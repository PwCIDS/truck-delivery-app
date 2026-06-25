// GPS追跡機能（シミュレーション + 実際のGeolocation API対応）

class GPSTracker {
    constructor() {
        this.activeTracking = new Map(); // deliveryId -> tracking data
        this.watchIds = new Map();
        this.simulationIntervals = new Map();
        this.trackingHistory = new Map(); // deliveryId -> position history
    }

    // GPS追跡開始
    startTracking(deliveryId, useRealGPS = false) {
        if (this.activeTracking.has(deliveryId)) {
            console.log('既に追跡中です:', deliveryId);
            return;
        }

        const delivery = db.getDeliveryById(deliveryId);
        if (!delivery) {
            console.error('配送が見つかりません:', deliveryId);
            return;
        }

        if (useRealGPS && 'geolocation' in navigator) {
            this.startRealGPSTracking(deliveryId, delivery);
        } else {
            this.startSimulatedTracking(deliveryId, delivery);
        }

        console.log(`✓ GPS追跡開始: ${deliveryId}`);
    }

    // 実際のGPS追跡
    startRealGPSTracking(deliveryId, delivery) {
        const options = {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
        };

        const watchId = navigator.geolocation.watchPosition(
            (position) => {
                this.updatePosition(deliveryId, {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    speed: position.coords.speed,
                    heading: position.coords.heading,
                    timestamp: new Date(position.timestamp),
                    isReal: true
                });
            },
            (error) => {
                console.error('GPS取得エラー:', error);
                // エラー時はシミュレーションにフォールバック
                this.startSimulatedTracking(deliveryId, delivery);
            },
            options
        );

        this.watchIds.set(deliveryId, watchId);
    }

    // シミュレーションGPS追跡
    startSimulatedTracking(deliveryId, delivery) {
        // 配送ルートに基づいて位置をシミュレート
        const route = this.generateRoutePoints(delivery);
        let currentIndex = 0;

        const interval = setInterval(() => {
            if (currentIndex >= route.length) {
                // ルート完了
                this.stopTracking(deliveryId);
                return;
            }

            const point = route[currentIndex];
            this.updatePosition(deliveryId, {
                lat: point.lat,
                lng: point.lng,
                accuracy: 10,
                speed: point.speed || 50,
                heading: point.heading || 0,
                timestamp: new Date(),
                isReal: false,
                routeProgress: (currentIndex / route.length) * 100
            });

            currentIndex++;
        }, 30000); // 30秒ごとに更新

        this.simulationIntervals.set(deliveryId, interval);
    }

    // 位置情報更新
    updatePosition(deliveryId, position) {
        this.activeTracking.set(deliveryId, position);

        // 履歴に追加
        if (!this.trackingHistory.has(deliveryId)) {
            this.trackingHistory.set(deliveryId, []);
        }
        this.trackingHistory.get(deliveryId).push(position);

        // 最大100ポイントまで保持
        const history = this.trackingHistory.get(deliveryId);
        if (history.length > 100) {
            history.shift();
        }

        // イベント発火（地図更新用）
        this.onPositionUpdate(deliveryId, position);

        // LocalStorageに保存
        this.saveTrackingData();
    }

    // GPS追跡停止
    stopTracking(deliveryId) {
        // 実際のGPS監視を停止
        if (this.watchIds.has(deliveryId)) {
            navigator.geolocation.clearWatch(this.watchIds.get(deliveryId));
            this.watchIds.delete(deliveryId);
        }

        // シミュレーションを停止
        if (this.simulationIntervals.has(deliveryId)) {
            clearInterval(this.simulationIntervals.get(deliveryId));
            this.simulationIntervals.delete(deliveryId);
        }

        this.activeTracking.delete(deliveryId);
        console.log(`✓ GPS追跡停止: ${deliveryId}`);
    }

    // 全追跡停止
    stopAllTracking() {
        for (const deliveryId of this.activeTracking.keys()) {
            this.stopTracking(deliveryId);
        }
    }

    // 現在位置取得
    getCurrentPosition(deliveryId) {
        return this.activeTracking.get(deliveryId);
    }

    // 追跡履歴取得
    getTrackingHistory(deliveryId) {
        return this.trackingHistory.get(deliveryId) || [];
    }

    // ルートポイント生成（シミュレーション用）
    generateRoutePoints(delivery) {
        const destinations = delivery.destinations || [];
        if (destinations.length === 0) return [];

        const points = [];

        // 東京を起点として設定
        let currentLat = 35.6762;
        let currentLng = 139.6503;

        // 各目的地への経路ポイントを生成
        destinations.forEach((dest, index) => {
            const destCoords = this.getCoordinatesFromAddress(
                typeof dest === 'object' ? dest.destination : dest
            );

            // 現在地から目的地までの中間ポイントを生成（10ポイント）
            const steps = 10;
            for (let i = 0; i <= steps; i++) {
                const ratio = i / steps;
                points.push({
                    lat: currentLat + (destCoords.lat - currentLat) * ratio,
                    lng: currentLng + (destCoords.lng - currentLng) * ratio,
                    speed: 40 + Math.random() * 20, // 40-60 km/h
                    heading: this.calculateBearing(currentLat, currentLng, destCoords.lat, destCoords.lng),
                    destinationIndex: index
                });
            }

            currentLat = destCoords.lat;
            currentLng = destCoords.lng;
        });

        return points;
    }

    // 住所から座標を取得（簡易版）
    getCoordinatesFromAddress(address) {
        // 実際のアプリではGoogle Geocoding APIを使用
        // ここでは主要都市の座標を返す
        const cityCoords = {
            '東京': { lat: 35.6762, lng: 139.6503 },
            '横浜': { lat: 35.4437, lng: 139.6380 },
            '千葉': { lat: 35.6074, lng: 140.1065 },
            'さいたま': { lat: 35.8617, lng: 139.6455 },
            '名古屋': { lat: 35.1815, lng: 136.9066 },
            '大阪': { lat: 34.6937, lng: 135.5023 },
            '福岡': { lat: 33.5904, lng: 130.4017 },
            '札幌': { lat: 43.0642, lng: 141.3469 },
            '仙台': { lat: 38.2682, lng: 140.8694 }
        };

        for (const [city, coords] of Object.entries(cityCoords)) {
            if (address.includes(city)) {
                // ランダムなオフセットを追加（市内の位置を模擬）
                return {
                    lat: coords.lat + (Math.random() - 0.5) * 0.1,
                    lng: coords.lng + (Math.random() - 0.5) * 0.1
                };
            }
        }

        // デフォルト：東京
        return { lat: 35.6762, lng: 139.6503 };
    }

    // 方角計算
    calculateBearing(lat1, lng1, lat2, lng2) {
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const lat1Rad = lat1 * Math.PI / 180;
        const lat2Rad = lat2 * Math.PI / 180;

        const y = Math.sin(dLng) * Math.cos(lat2Rad);
        const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) -
                  Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLng);

        const bearing = Math.atan2(y, x) * 180 / Math.PI;
        return (bearing + 360) % 360;
    }

    // 位置更新時のコールバック
    onPositionUpdate(deliveryId, position) {
        // Google Mapがロードされていれば、マーカーを更新
        if (window.googleMapsManager) {
            window.googleMapsManager.updateTruckMarker(deliveryId, position);
        }

        // 配送の進捗を更新
        const delivery = db.getDeliveryById(deliveryId);
        if (delivery && position.routeProgress !== undefined) {
            db.updateDelivery(deliveryId, {
                ...delivery,
                gpsProgress: Math.round(position.routeProgress)
            });
        }

        // ダッシュボードが表示されている場合は更新
        if (window.currentView === 'dashboard') {
            updateDashboard();
        }
    }

    // 追跡データ保存
    saveTrackingData() {
        const data = {
            activeTracking: Array.from(this.activeTracking.entries()),
            trackingHistory: Array.from(this.trackingHistory.entries())
        };
        localStorage.setItem('gps_tracking_data', JSON.stringify(data));
    }

    // 追跡データ読み込み
    loadTrackingData() {
        const data = localStorage.getItem('gps_tracking_data');
        if (data) {
            try {
                const parsed = JSON.parse(data);
                this.activeTracking = new Map(parsed.activeTracking);
                this.trackingHistory = new Map(parsed.trackingHistory);
            } catch (error) {
                console.error('追跡データ読み込みエラー:', error);
            }
        }
    }

    // 配送の推定到着時刻計算
    calculateETA(deliveryId) {
        const position = this.getCurrentPosition(deliveryId);
        const delivery = db.getDeliveryById(deliveryId);

        if (!position || !delivery || !delivery.destinations || delivery.destinations.length === 0) {
            return null;
        }

        // 最後の目的地までの距離を計算
        const lastDest = delivery.destinations[delivery.destinations.length - 1];
        const destCoords = this.getCoordinatesFromAddress(
            typeof lastDest === 'object' ? lastDest.destination : lastDest
        );

        const distance = this.calculateDistance(
            position.lat, position.lng,
            destCoords.lat, destCoords.lng
        );

        // 平均速度から到着時刻を推定
        const avgSpeed = position.speed || 50; // km/h
        const hoursRemaining = distance / avgSpeed;
        const eta = new Date();
        eta.setHours(eta.getHours() + hoursRemaining);

        return {
            distance: Math.round(distance),
            eta: eta,
            hoursRemaining: hoursRemaining.toFixed(1)
        };
    }

    // 2地点間の距離計算（ハーバーサイン公式）
    calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371; // 地球の半径（km）
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;

        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLng / 2) * Math.sin(dLng / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;

        return distance;
    }

    // アクティブな追跡一覧取得
    getActiveTrackingList() {
        return Array.from(this.activeTracking.keys());
    }

    // トラック位置の統計情報
    getTrackingStats(deliveryId) {
        const history = this.getTrackingHistory(deliveryId);
        if (history.length === 0) return null;

        const speeds = history.map(h => h.speed).filter(s => s);
        const avgSpeed = speeds.reduce((a, b) => a + b, 0) / speeds.length;
        const maxSpeed = Math.max(...speeds);
        const minSpeed = Math.min(...speeds);

        // 総移動距離
        let totalDistance = 0;
        for (let i = 1; i < history.length; i++) {
            totalDistance += this.calculateDistance(
                history[i - 1].lat, history[i - 1].lng,
                history[i].lat, history[i].lng
            );
        }

        return {
            totalPoints: history.length,
            avgSpeed: avgSpeed.toFixed(1),
            maxSpeed: maxSpeed.toFixed(1),
            minSpeed: minSpeed.toFixed(1),
            totalDistance: totalDistance.toFixed(1),
            duration: (history[history.length - 1].timestamp - history[0].timestamp) / (1000 * 60) // 分
        };
    }
}

// グローバルインスタンス
const gpsTracker = new GPSTracker();

// ページ読み込み時に追跡データを復元
window.addEventListener('load', () => {
    gpsTracker.loadTrackingData();
});

// ページアンロード時に追跡を停止
window.addEventListener('beforeunload', () => {
    gpsTracker.stopAllTracking();
});
