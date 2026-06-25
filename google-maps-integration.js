// Google Maps API連携機能

class GoogleMapsManager {
    constructor() {
        this.map = null;
        this.markers = new Map();
        this.polylines = new Map();
        this.directionsService = null;
        this.directionsRenderer = null;
        this.apiKey = ''; // ユーザーが設定するAPIキー
        this.apiLoaded = false;
        this.truckMarkers = new Map(); // deliveryId -> marker
    }

    // APIキー設定
    setApiKey(key) {
        this.apiKey = key;
        localStorage.setItem('google_maps_api_key', key);
    }

    // APIキー読み込み
    loadApiKey() {
        const saved = localStorage.getItem('google_maps_api_key');
        if (saved) {
            this.apiKey = saved;
        }
        return this.apiKey;
    }

    // Google Maps APIスクリプト読み込み
    async loadGoogleMapsAPI() {
        if (this.apiLoaded) {
            return true;
        }

        if (!this.apiKey) {
            console.warn('Google Maps APIキーが設定されていません');
            return false;
        }

        return new Promise((resolve, reject) => {
            // 既にスクリプトが読み込まれているかチェック
            if (window.google && window.google.maps) {
                this.apiLoaded = true;
                resolve(true);
                return;
            }

            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${this.apiKey}&libraries=places,geometry`;
            script.async = true;
            script.defer = true;

            script.onload = () => {
                this.apiLoaded = true;
                this.directionsService = new google.maps.DirectionsService();
                console.log('✓ Google Maps API読み込み完了');
                resolve(true);
            };

            script.onerror = () => {
                console.error('Google Maps API読み込みエラー');
                reject(false);
            };

            document.head.appendChild(script);
        });
    }

    // 地図初期化
    async initMap(elementId, center = { lat: 35.6762, lng: 139.6503 }, zoom = 10) {
        if (!await this.loadGoogleMapsAPI()) {
            return false;
        }

        const mapElement = document.getElementById(elementId);
        if (!mapElement) {
            console.error('地図要素が見つかりません:', elementId);
            return false;
        }

        this.map = new google.maps.Map(mapElement, {
            center: center,
            zoom: zoom,
            mapTypeControl: true,
            streetViewControl: false,
            fullscreenControl: true,
            zoomControl: true
        });

        console.log('✓ Google Map初期化完了');
        return true;
    }

    // ルート表示（複数目的地対応）
    async displayRoute(destinations, optimizeRoute = true) {
        if (!this.map || destinations.length === 0) {
            return false;
        }

        // 既存のルートをクリア
        if (this.directionsRenderer) {
            this.directionsRenderer.setMap(null);
        }

        // DirectionsRendererを作成
        this.directionsRenderer = new google.maps.DirectionsRenderer({
            map: this.map,
            suppressMarkers: false,
            polylineOptions: {
                strokeColor: '#2196F3',
                strokeWeight: 5,
                strokeOpacity: 0.7
            }
        });

        // ルートリクエスト作成
        const waypoints = [];
        const origin = destinations[0];
        const destination = destinations[destinations.length - 1];

        // 中間地点
        for (let i = 1; i < destinations.length - 1; i++) {
            waypoints.push({
                location: destinations[i],
                stopover: true
            });
        }

        const request = {
            origin: origin,
            destination: destination,
            waypoints: waypoints,
            optimizeWaypoints: optimizeRoute,
            travelMode: google.maps.TravelMode.DRIVING,
            unitSystem: google.maps.UnitSystem.METRIC
        };

        return new Promise((resolve, reject) => {
            this.directionsService.route(request, (result, status) => {
                if (status === 'OK') {
                    this.directionsRenderer.setDirections(result);

                    // ルート情報を解析
                    const routeInfo = this.parseRouteResult(result);
                    console.log('✓ ルート表示完了', routeInfo);
                    resolve(routeInfo);
                } else {
                    console.error('ルート計算エラー:', status);
                    reject(status);
                }
            });
        });
    }

    // ルート結果を解析
    parseRouteResult(result) {
        const route = result.routes[0];
        let totalDistance = 0;
        let totalDuration = 0;

        const legs = route.legs.map(leg => {
            totalDistance += leg.distance.value; // メートル
            totalDuration += leg.duration.value; // 秒

            return {
                startAddress: leg.start_address,
                endAddress: leg.end_address,
                distance: leg.distance.text,
                distanceValue: leg.distance.value,
                duration: leg.duration.text,
                durationValue: leg.duration.value
            };
        });

        return {
            legs: legs,
            totalDistance: (totalDistance / 1000).toFixed(1), // km
            totalDuration: Math.round(totalDuration / 60), // 分
            optimizedOrder: route.waypoint_order
        };
    }

    // マーカー追加
    addMarker(id, position, options = {}) {
        if (!this.map) return null;

        const marker = new google.maps.Marker({
            map: this.map,
            position: position,
            title: options.title || '',
            label: options.label || '',
            icon: options.icon || null,
            animation: options.animation || null
        });

        // 情報ウィンドウ
        if (options.infoWindow) {
            const infoWindow = new google.maps.InfoWindow({
                content: options.infoWindow
            });

            marker.addListener('click', () => {
                infoWindow.open(this.map, marker);
            });
        }

        this.markers.set(id, marker);
        return marker;
    }

    // トラックマーカー更新（GPS追跡用）
    updateTruckMarker(deliveryId, position) {
        if (!this.map) return;

        const delivery = db.getDeliveryById(deliveryId);
        const truck = delivery ? db.getTruckById(delivery.truckId) : null;

        const truckIcon = {
            url: 'data:image/svg+xml,' + encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="40" height="40">
                    <circle cx="50" cy="50" r="45" fill="#2196F3" stroke="white" stroke-width="5"/>
                    <text x="50" y="70" font-size="60" text-anchor="middle" fill="white">🚚</text>
                </svg>
            `),
            scaledSize: new google.maps.Size(40, 40),
            anchor: new google.maps.Point(20, 20)
        };

        if (this.truckMarkers.has(deliveryId)) {
            // 既存のマーカーを更新
            const marker = this.truckMarkers.get(deliveryId);
            marker.setPosition({ lat: position.lat, lng: position.lng });
        } else {
            // 新しいマーカーを作成
            const marker = new google.maps.Marker({
                map: this.map,
                position: { lat: position.lat, lng: position.lng },
                title: truck ? truck.number : '配送中',
                icon: truckIcon,
                animation: google.maps.Animation.DROP
            });

            // 情報ウィンドウ
            const infoContent = `
                <div style="padding: 10px;">
                    <h3 style="margin: 0 0 10px 0;">${truck ? truck.number : '配送中'}</h3>
                    <p style="margin: 5px 0;">速度: ${position.speed ? position.speed.toFixed(1) : '-'} km/h</p>
                    <p style="margin: 5px 0;">精度: ${position.accuracy ? position.accuracy.toFixed(1) : '-'} m</p>
                    <p style="margin: 5px 0;">更新: ${position.timestamp.toLocaleTimeString('ja-JP')}</p>
                    <p style="margin: 5px 0; font-size: 11px; color: #666;">
                        ${position.isReal ? '実際のGPS' : 'シミュレーション'}
                    </p>
                </div>
            `;

            const infoWindow = new google.maps.InfoWindow({
                content: infoContent
            });

            marker.addListener('click', () => {
                infoWindow.open(this.map, marker);
            });

            this.truckMarkers.set(deliveryId, marker);

            // 地図の中心をマーカーに移動
            this.map.panTo({ lat: position.lat, lng: position.lng });
        }
    }

    // マーカー削除
    removeMarker(id) {
        const marker = this.markers.get(id);
        if (marker) {
            marker.setMap(null);
            this.markers.delete(id);
        }
    }

    // トラックマーカー削除
    removeTruckMarker(deliveryId) {
        const marker = this.truckMarkers.get(deliveryId);
        if (marker) {
            marker.setMap(null);
            this.truckMarkers.delete(deliveryId);
        }
    }

    // 全マーカークリア
    clearAllMarkers() {
        this.markers.forEach(marker => marker.setMap(null));
        this.markers.clear();

        this.truckMarkers.forEach(marker => marker.setMap(null));
        this.truckMarkers.clear();
    }

    // ルートクリア
    clearRoute() {
        if (this.directionsRenderer) {
            this.directionsRenderer.setMap(null);
            this.directionsRenderer = null;
        }
    }

    // 住所から座標を取得（Geocoding）
    async geocodeAddress(address) {
        if (!this.apiLoaded) {
            await this.loadGoogleMapsAPI();
        }

        const geocoder = new google.maps.Geocoder();

        return new Promise((resolve, reject) => {
            geocoder.geocode({ address: address, region: 'JP' }, (results, status) => {
                if (status === 'OK' && results[0]) {
                    const location = results[0].geometry.location;
                    resolve({
                        lat: location.lat(),
                        lng: location.lng(),
                        formattedAddress: results[0].formatted_address
                    });
                } else {
                    console.error('Geocodingエラー:', status);
                    reject(status);
                }
            });
        });
    }

    // 距離計算（Google Distance Matrix API）
    async calculateDistance(origins, destinations) {
        if (!this.apiLoaded) {
            await this.loadGoogleMapsAPI();
        }

        const service = new google.maps.DistanceMatrixService();

        return new Promise((resolve, reject) => {
            service.getDistanceMatrix(
                {
                    origins: origins,
                    destinations: destinations,
                    travelMode: google.maps.TravelMode.DRIVING,
                    unitSystem: google.maps.UnitSystem.METRIC
                },
                (response, status) => {
                    if (status === 'OK') {
                        const results = response.rows[0].elements.map(element => ({
                            distance: element.distance.text,
                            distanceValue: element.distance.value / 1000, // km
                            duration: element.duration.text,
                            durationValue: element.duration.value / 60 // 分
                        }));
                        resolve(results);
                    } else {
                        reject(status);
                    }
                }
            );
        });
    }

    // ルート最適化（Google Directions APIを使用）
    async optimizeDeliveryRoute(destinations) {
        if (destinations.length <= 2) {
            return destinations; // 最適化不要
        }

        try {
            const routeInfo = await this.displayRoute(destinations, true);

            // 最適化された順序を取得
            const optimizedOrder = routeInfo.optimizedOrder || [];
            const optimizedDestinations = [destinations[0]]; // 起点

            optimizedOrder.forEach(index => {
                optimizedDestinations.push(destinations[index + 1]);
            });

            optimizedDestinations.push(destinations[destinations.length - 1]); // 終点

            return {
                destinations: optimizedDestinations,
                routeInfo: routeInfo
            };
        } catch (error) {
            console.error('ルート最適化エラー:', error);
            return { destinations: destinations, routeInfo: null };
        }
    }

    // 地図をPDF/画像として保存
    async captureMap() {
        if (!this.map) return null;

        // 静的地図APIを使用（より確実）
        const center = this.map.getCenter();
        const zoom = this.map.getZoom();

        const url = `https://maps.googleapis.com/maps/api/staticmap?center=${center.lat()},${center.lng()}&zoom=${zoom}&size=800x600&maptype=roadmap&key=${this.apiKey}`;

        return url;
    }

    // APIキー設定ダイアログ表示
    showApiKeyDialog() {
        const currentKey = this.loadApiKey();

        const html = `
            <div style="padding: 20px;">
                <h3 style="margin-top: 0;">Google Maps APIキー設定</h3>
                <p style="color: #666; font-size: 14px;">
                    Google Maps APIキーを設定すると、以下の機能が利用できます：
                </p>
                <ul style="color: #666; font-size: 14px; margin-bottom: 20px;">
                    <li>実際の地図上でのルート表示</li>
                    <li>正確な距離と時間の計算</li>
                    <li>ルートの自動最適化</li>
                    <li>GPS位置のリアルタイム表示</li>
                </ul>
                <div class="form-group">
                    <label>APIキー:</label>
                    <input type="text" id="google-maps-api-key-input" value="${currentKey}"
                           placeholder="AIzaSy..." style="width: 100%;">
                    <small style="color: #999; display: block; margin-top: 5px;">
                        APIキーの取得方法:
                        <a href="https://developers.google.com/maps/documentation/javascript/get-api-key"
                           target="_blank">Google Maps Platform</a>
                    </small>
                </div>
                <div style="margin-top: 20px; display: flex; gap: 10px; justify-content: flex-end;">
                    <button onclick="closeModal()" class="btn-secondary">キャンセル</button>
                    <button onclick="googleMapsManager.saveApiKeyFromDialog()" class="btn-primary">保存</button>
                </div>
            </div>
        `;

        showModal('Google Maps API設定', html);
    }

    // ダイアログからAPIキーを保存
    saveApiKeyFromDialog() {
        const input = document.getElementById('google-maps-api-key-input');
        const key = input.value.trim();

        if (key) {
            this.setApiKey(key);
            showNotification('APIキーを保存しました', 'success');
            closeModal();

            // ページをリロードして新しいキーを適用
            if (confirm('新しいAPIキーを適用するにはページをリロードする必要があります。今すぐリロードしますか？')) {
                location.reload();
            }
        } else {
            showNotification('APIキーを入力してください', 'error');
        }
    }
}

// グローバルインスタンス
const googleMapsManager = new GoogleMapsManager();
window.googleMapsManager = googleMapsManager;

// ページ読み込み時にAPIキーを読み込む
window.addEventListener('load', () => {
    googleMapsManager.loadApiKey();
});
