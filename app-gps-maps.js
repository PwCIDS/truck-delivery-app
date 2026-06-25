// GPS追跡・地図表示機能の統合（app.jsの拡張）

// 地図表示・GPS追跡タブの切り替え
document.addEventListener('DOMContentLoaded', () => {
    // 地図表示タブ
    const viewMapBtn = document.getElementById('view-map');
    const viewGpsBtn = document.getElementById('view-gps');
    const mapView = document.getElementById('map-view');
    const gpsView = document.getElementById('gps-view');

    if (viewMapBtn) {
        viewMapBtn.addEventListener('click', () => {
            viewMapBtn.classList.add('active');
            viewGpsBtn.classList.remove('active');
            mapView.style.display = 'block';
            gpsView.style.display = 'none';
        });
    }

    if (viewGpsBtn) {
        viewGpsBtn.addEventListener('click', () => {
            viewGpsBtn.classList.add('active');
            viewMapBtn.classList.remove('active');
            gpsView.style.display = 'block';
            mapView.style.display = 'none';
            loadActiveTrackingList();
        });
    }

    // GPS追跡の定期更新
    setInterval(() => {
        if (gpsView && gpsView.style.display !== 'none') {
            loadActiveTrackingList();
        }
    }, 30000); // 30秒ごと
});

// 配送選択ダイアログ（地図表示用）
function showDeliveryRouteSelector() {
    const deliveries = db.getAllDeliveries().filter(d => d.status !== 'completed');

    if (deliveries.length === 0) {
        showNotification('配送中または予定の配送がありません', 'warning');
        return;
    }

    let html = `
        <div style="padding: 20px;">
            <h3>配送を選択してください</h3>
            <div style="max-height: 400px; overflow-y: auto; margin-top: 15px;">
    `;

    deliveries.forEach(delivery => {
        const truck = db.getTruckById(delivery.truckId);
        const customer = db.getCustomerById(delivery.customerId);
        const statusText = delivery.status === 'inprogress' ? '運転中' : '予定';

        html += `
            <div style="padding: 15px; margin-bottom: 10px; border: 2px solid #ddd; border-radius: 8px; cursor: pointer;"
                 onclick="displayDeliveryRoute(${delivery.id})">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong style="font-size: 16px;">${truck ? truck.number : '不明'}</strong>
                        <span style="margin-left: 10px; color: #666;">${customer ? customer.name : '不明'}</span>
                    </div>
                    <span class="status-badge status-${delivery.status}">${statusText}</span>
                </div>
                <div style="margin-top: 10px; color: #666; font-size: 14px;">
                    ${delivery.startDate} ${delivery.startTime} 〜 ${delivery.endDate} ${delivery.endTime}
                </div>
                <div style="margin-top: 5px; color: #999; font-size: 13px;">
                    行先: ${delivery.destinations && delivery.destinations.length > 0
                        ? delivery.destinations.map(d => typeof d === 'object' ? d.destination : d).join(' → ')
                        : '未設定'}
                </div>
            </div>
        `;
    });

    html += `
            </div>
            <div style="margin-top: 20px; text-align: right;">
                <button onclick="closeModal()" class="btn-secondary">閉じる</button>
            </div>
        </div>
    `;

    showModal('配送選択', html);
}

// 配送ルートを地図に表示
async function displayDeliveryRoute(deliveryId) {
    closeModal();

    const delivery = db.getDeliveryById(deliveryId);
    if (!delivery) {
        showNotification('配送が見つかりません', 'error');
        return;
    }

    if (!delivery.destinations || delivery.destinations.length === 0) {
        showNotification('この配送には行先が設定されていません', 'warning');
        return;
    }

    const destinations = delivery.destinations.map(d =>
        typeof d === 'object' ? d.destination : d
    );

    // Google Maps APIが利用可能かチェック
    const apiKey = googleMapsManager.loadApiKey();
    if (apiKey) {
        // Google Mapsで表示
        await displayRouteOnGoogleMaps(delivery, destinations);
    } else {
        // 静的地図で表示
        displayRouteOnStaticMap(delivery, destinations);
    }

    // 地図ビューに切り替え
    document.getElementById('view-map').click();
}

// Google Mapsでルート表示
async function displayRouteOnGoogleMaps(delivery, destinations) {
    const mapContainer = document.getElementById('google-map-container');
    const routeInfoContainer = document.getElementById('route-info-container');

    mapContainer.style.display = 'block';

    try {
        // 地図初期化
        const initialized = await googleMapsManager.initMap('google-map-container');
        if (!initialized) {
            throw new Error('地図の初期化に失敗しました');
        }

        // ルート表示
        showNotification('ルートを計算中...', 'info');
        const routeInfo = await googleMapsManager.displayRoute(destinations, true);

        // ルート情報を表示
        const truck = db.getTruckById(delivery.truckId);
        const customer = db.getCustomerById(delivery.customerId);

        routeInfoContainer.innerHTML = `
            <div class="notification-card" style="background-color: #e3f2fd;">
                <h3>📊 ルート情報</h3>
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-top: 15px;">
                    <div>
                        <div style="font-size: 12px; color: #666;">トラック</div>
                        <div style="font-size: 18px; font-weight: bold;">${truck ? truck.number : '不明'}</div>
                    </div>
                    <div>
                        <div style="font-size: 12px; color: #666;">顧客</div>
                        <div style="font-size: 18px; font-weight: bold;">${customer ? customer.name : '不明'}</div>
                    </div>
                    <div>
                        <div style="font-size: 12px; color: #666;">総距離</div>
                        <div style="font-size: 18px; font-weight: bold; color: #2196F3;">${routeInfo.totalDistance} km</div>
                    </div>
                    <div>
                        <div style="font-size: 12px; color: #666;">予測時間</div>
                        <div style="font-size: 18px; font-weight: bold; color: #f57c00;">
                            ${Math.floor(routeInfo.totalDuration / 60)}時間${routeInfo.totalDuration % 60}分
                        </div>
                    </div>
                </div>
                <div style="margin-top: 15px;">
                    <h4>経路詳細</h4>
                    <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                        <thead>
                            <tr style="background-color: #2196F3; color: white;">
                                <th style="padding: 10px; text-align: left;">区間</th>
                                <th style="padding: 10px; text-align: right;">距離</th>
                                <th style="padding: 10px; text-align: right;">時間</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${routeInfo.legs.map((leg, index) => `
                                <tr style="border-bottom: 1px solid #ddd;">
                                    <td style="padding: 10px;">${index + 1}. ${leg.startAddress} → ${leg.endAddress}</td>
                                    <td style="padding: 10px; text-align: right;">${leg.distance}</td>
                                    <td style="padding: 10px; text-align: right;">${leg.duration}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        showNotification('ルート表示完了', 'success');

    } catch (error) {
        console.error('Google Mapsルート表示エラー:', error);
        showNotification('ルート表示に失敗しました。静的地図で表示します。', 'warning');
        displayRouteOnStaticMap(delivery, destinations);
    }
}

// 静的地図でルート表示
function displayRouteOnStaticMap(delivery, destinations) {
    const routeInfoContainer = document.getElementById('route-info-container');
    const mapContainer = document.getElementById('google-map-container');

    mapContainer.style.display = 'none';

    // SVG地図生成
    const mapSvg = routeMapViewer.generateRouteMap(
        delivery.destinations || destinations.map(d => ({ destination: d }))
    );

    // ルート情報テーブル生成
    const routeTable = routeMapViewer.generateRouteTable(
        delivery.destinations || destinations.map(d => ({ destination: d }))
    );

    // 配送詳細情報生成
    const deliveryDetails = routeMapViewer.generateDeliveryDetails(delivery);

    routeInfoContainer.innerHTML = `
        <div class="notification-card">
            <h3>🗺️ 配送ルート地図（静的表示）</h3>
            <p style="color: #666; margin-bottom: 15px;">
                Google Maps APIキーを設定すると、実際の地図とより正確なルート情報が表示されます。
            </p>
            ${deliveryDetails}
            <div style="margin-top: 20px; background-color: white; padding: 20px; border-radius: 10px;">
                ${mapSvg}
            </div>
            ${routeTable}
        </div>
    `;

    showNotification('ルート表示完了（静的地図）', 'success');
}

// アクティブな追跡リスト読み込み
function loadActiveTrackingList() {
    const container = document.getElementById('tracking-deliveries-list');
    const deliveries = db.getAllDeliveries().filter(d => d.status === 'inprogress');

    if (deliveries.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #999;">
                <p>運転中の配送がありません</p>
            </div>
        `;
        return;
    }

    let html = '<div style="display: grid; gap: 15px;">';

    deliveries.forEach(delivery => {
        const truck = db.getTruckById(delivery.truckId);
        const driver = db.getDriverById(delivery.driverId);
        const customer = db.getCustomerById(delivery.customerId);
        const isTracking = gpsTracker.activeTracking.has(delivery.id);
        const position = gpsTracker.getCurrentPosition(delivery.id);
        const eta = position ? gpsTracker.calculateETA(delivery.id) : null;

        html += `
            <div class="notification-card" style="background-color: ${isTracking ? '#e8f5e9' : '#f5f5f5'};">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div style="flex: 1;">
                        <h4 style="margin: 0 0 10px 0;">${truck ? truck.number : '不明'}</h4>
                        <div style="color: #666; font-size: 14px;">
                            <div>🚗 ドライバー: ${driver ? driver.name : '未割当'}</div>
                            <div>👤 顧客: ${customer ? customer.name : '不明'}</div>
                            <div>📍 行先: ${delivery.destinations && delivery.destinations.length > 0
                                ? delivery.destinations[delivery.destinations.length - 1].destination ||
                                  delivery.destinations[delivery.destinations.length - 1]
                                : '未設定'}</div>
                            ${position ? `
                                <div style="margin-top: 10px; padding: 10px; background-color: white; border-radius: 5px;">
                                    <div>⚡ 速度: ${position.speed ? position.speed.toFixed(1) : '-'} km/h</div>
                                    <div>🎯 精度: ${position.accuracy ? position.accuracy.toFixed(1) : '-'} m</div>
                                    <div>🕐 更新: ${position.timestamp ? position.timestamp.toLocaleTimeString('ja-JP') : '-'}</div>
                                    ${eta ? `<div>📍 到着予定: ${eta.eta.toLocaleTimeString('ja-JP')} (残り ${eta.distance} km)</div>` : ''}
                                </div>
                            ` : ''}
                        </div>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 10px;">
                        ${isTracking ? `
                            <button onclick="stopGPSTracking(${delivery.id})" class="btn-secondary">
                                ⏹️ 追跡停止
                            </button>
                            <button onclick="viewTrackingOnMap(${delivery.id})" class="btn-primary">
                                🗺️ 地図表示
                            </button>
                            <button onclick="showTrackingStats(${delivery.id})" class="btn-secondary">
                                📊 統計
                            </button>
                        ` : `
                            <button onclick="startGPSTracking(${delivery.id})" class="btn-primary">
                                ▶️ 追跡開始
                            </button>
                        `}
                    </div>
                </div>
            </div>
        `;
    });

    html += '</div>';
    container.innerHTML = html;
}

// GPS追跡開始
function startGPSTracking(deliveryId) {
    const useRealGPS = document.getElementById('use-real-gps')?.checked || false;

    gpsTracker.startTracking(deliveryId, useRealGPS);

    const delivery = db.getDeliveryById(deliveryId);
    if (delivery) {
        notificationManager.send(
            '📍 GPS追跡開始',
            `配送 #${deliveryId} の追跡を開始しました`,
            { type: 'gpsUpdate' }
        );
    }

    loadActiveTrackingList();
}

// GPS追跡停止
function stopGPSTracking(deliveryId) {
    gpsTracker.stopTracking(deliveryId);
    showNotification('GPS追跡を停止しました', 'success');
    loadActiveTrackingList();
}

// 追跡を地図で表示
async function viewTrackingOnMap(deliveryId) {
    const position = gpsTracker.getCurrentPosition(deliveryId);
    if (!position) {
        showNotification('位置情報がありません', 'warning');
        return;
    }

    const delivery = db.getDeliveryById(deliveryId);
    const apiKey = googleMapsManager.loadApiKey();

    if (apiKey) {
        // Google Mapsで表示
        const mapContainer = document.getElementById('gps-map-container');
        mapContainer.style.display = 'block';

        await googleMapsManager.initMap('gps-map-container',
            { lat: position.lat, lng: position.lng },
            14
        );

        // トラックマーカーを表示
        googleMapsManager.updateTruckMarker(deliveryId, position);

        // ルートも表示
        if (delivery && delivery.destinations) {
            const destinations = delivery.destinations.map(d =>
                typeof d === 'object' ? d.destination : d
            );
            await googleMapsManager.displayRoute(destinations, false);
        }

        showNotification('GPS位置を地図に表示しました', 'success');
    } else {
        showNotification('Google Maps APIキーを設定してください', 'warning');
        googleMapsManager.showApiKeyDialog();
    }
}

// 追跡統計表示
function showTrackingStats(deliveryId) {
    const stats = gpsTracker.getTrackingStats(deliveryId);
    const history = gpsTracker.getTrackingHistory(deliveryId);

    if (!stats) {
        showNotification('統計情報がありません', 'warning');
        return;
    }

    const delivery = db.getDeliveryById(deliveryId);
    const truck = delivery ? db.getTruckById(delivery.truckId) : null;

    const html = `
        <div style="padding: 20px;">
            <h3>📊 追跡統計: ${truck ? truck.number : `配送 #${deliveryId}`}</h3>

            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-top: 20px;">
                <div style="padding: 15px; background-color: #e3f2fd; border-radius: 8px;">
                    <div style="font-size: 12px; color: #666;">総移動距離</div>
                    <div style="font-size: 24px; font-weight: bold; color: #2196F3;">${stats.totalDistance} km</div>
                </div>
                <div style="padding: 15px; background-color: #fff3e0; border-radius: 8px;">
                    <div style="font-size: 12px; color: #666;">平均速度</div>
                    <div style="font-size: 24px; font-weight: bold; color: #f57c00;">${stats.avgSpeed} km/h</div>
                </div>
                <div style="padding: 15px; background-color: #e8f5e9; border-radius: 8px;">
                    <div style="font-size: 12px; color: #666;">追跡時間</div>
                    <div style="font-size: 24px; font-weight: bold; color: #388e3c;">${Math.round(stats.duration)} 分</div>
                </div>
            </div>

            <div style="margin-top: 20px;">
                <h4>速度情報</h4>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
                    <div>最高速度: <strong>${stats.maxSpeed} km/h</strong></div>
                    <div>最低速度: <strong>${stats.minSpeed} km/h</strong></div>
                    <div>記録ポイント数: <strong>${stats.totalPoints}</strong></div>
                </div>
            </div>

            <div style="margin-top: 20px;">
                <h4>位置履歴（最新10件）</h4>
                <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                    <thead>
                        <tr style="background-color: #2196F3; color: white;">
                            <th style="padding: 8px;">時刻</th>
                            <th style="padding: 8px;">緯度</th>
                            <th style="padding: 8px;">経度</th>
                            <th style="padding: 8px;">速度</th>
                            <th style="padding: 8px;">精度</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${history.slice(-10).reverse().map(pos => `
                            <tr style="border-bottom: 1px solid #ddd;">
                                <td style="padding: 8px;">${pos.timestamp.toLocaleTimeString('ja-JP')}</td>
                                <td style="padding: 8px;">${pos.lat.toFixed(6)}</td>
                                <td style="padding: 8px;">${pos.lng.toFixed(6)}</td>
                                <td style="padding: 8px;">${pos.speed ? pos.speed.toFixed(1) : '-'} km/h</td>
                                <td style="padding: 8px;">${pos.accuracy ? pos.accuracy.toFixed(1) : '-'} m</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>

            <div style="margin-top: 20px; text-align: right;">
                <button onclick="closeModal()" class="btn-secondary">閉じる</button>
            </div>
        </div>
    `;

    showModal('追跡統計', html);
}

// 配送ステータス変更時の通知連携
function enhanceDeliveryStatusChange() {
    const originalUpdateDelivery = window.updateDelivery;

    window.updateDelivery = function() {
        const result = originalUpdateDelivery.apply(this, arguments);

        // フォームから配送データを取得
        const deliveryId = parseInt(document.getElementById('delivery-id').value);
        const delivery = db.getDeliveryById(deliveryId);

        if (delivery) {
            // ステータスに応じた通知
            if (delivery.status === 'inprogress' && !delivery.startNotified) {
                notificationManager.notifyDeliveryStart(delivery);
                db.updateDelivery(deliveryId, { ...delivery, startNotified: true });

                // GPS追跡を自動開始（オプション）
                if (confirm('GPS追跡を開始しますか？')) {
                    const useRealGPS = confirm('実際のGPSを使用しますか？（いいえを選択するとシミュレーションになります）');
                    gpsTracker.startTracking(deliveryId, useRealGPS);
                }
            } else if (delivery.status === 'completed' && !delivery.completeNotified) {
                notificationManager.notifyDeliveryComplete(delivery);
                db.updateDelivery(deliveryId, { ...delivery, completeNotified: true });

                // GPS追跡を停止
                gpsTracker.stopTracking(deliveryId);
            }
        }

        return result;
    };
}

// ページ読み込み時に初期化
window.addEventListener('load', () => {
    // 配送ステータス変更の拡張
    if (typeof updateDelivery !== 'undefined') {
        enhanceDeliveryStatusChange();
    }

    // 通知権限をリクエスト
    notificationManager.requestPermission();
});
