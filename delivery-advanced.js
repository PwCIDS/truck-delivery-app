// 高度な配送管理機能

class DeliveryAdvancedManager {
    constructor() {
        this.notificationEnabled = false;
        this.trackingInterval = null;
        this.init();
    }

    init() {
        this.checkNotificationPermission();
        this.loadSettings();
    }

    // 通知権限チェック
    async checkNotificationPermission() {
        if ('Notification' in window) {
            if (Notification.permission === 'granted') {
                this.notificationEnabled = true;
            } else if (Notification.permission !== 'denied') {
                const permission = await Notification.requestPermission();
                this.notificationEnabled = permission === 'granted';
            }
        }
    }

    // 設定読み込み
    loadSettings() {
        const settings = localStorage.getItem('delivery_advanced_settings');
        if (settings) {
            this.settings = JSON.parse(settings);
        } else {
            this.settings = {
                autoNotification: true,
                delayThreshold: 30, // 遅延と判定する分数
                trackingEnabled: false,
                routeOptimization: true
            };
            this.saveSettings();
        }
    }

    // 設定保存
    saveSettings() {
        localStorage.setItem('delivery_advanced_settings', JSON.stringify(this.settings));
    }

    // 通知送信
    sendNotification(title, body, data = {}) {
        if (!this.notificationEnabled || !this.settings.autoNotification) {
            return;
        }

        try {
            const notification = new Notification(title, {
                body: body,
                icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="0.9em" font-size="90">🚚</text></svg>',
                badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="0.9em" font-size="90">🚚</text></svg>',
                data: data,
                requireInteraction: false
            });

            notification.onclick = () => {
                window.focus();
                if (data.deliveryId) {
                    editDelivery(data.deliveryId);
                }
            };

            // 5秒後に自動的に閉じる
            setTimeout(() => notification.close(), 5000);

        } catch (error) {
            console.error('通知送信エラー:', error);
        }
    }

    // 配送開始通知
    notifyDeliveryStart(delivery, truck, driver, customer) {
        const truckName = truck ? truck.number : '未選択';
        const driverName = driver ? driver.name : '未選択';
        const customerName = customer ? customer.name : '不明';

        this.sendNotification(
            '🚚 配送開始',
            `${truckName} - ${driverName}\n顧客: ${customerName}`,
            { deliveryId: delivery.id }
        );
    }

    // 配送完了通知
    notifyDeliveryComplete(delivery, customer) {
        const customerName = customer ? customer.name : '不明';

        this.sendNotification(
            '✅ 配送完了',
            `顧客: ${customerName}\n配送が完了しました`,
            { deliveryId: delivery.id }
        );
    }

    // 遅延アラート
    notifyDeliveryDelay(delivery, customer, delayMinutes) {
        const customerName = customer ? customer.name : '不明';

        this.sendNotification(
            '⚠️ 配送遅延',
            `顧客: ${customerName}\n予定より${delayMinutes}分遅延しています`,
            { deliveryId: delivery.id }
        );
    }

    // 距離計算（簡易版：2地点間の直線距離）
    calculateDistance(origin, destination) {
        // 実際のアプリではGoogle Maps Distance Matrix APIを使用
        // ここでは簡易的なシミュレーションを実装

        // 日本の主要都市の概算距離データ
        const cityDistances = {
            '東京': {
                '東京': 0, '横浜': 30, '千葉': 40, 'さいたま': 30,
                '名古屋': 350, '大阪': 500, '福岡': 1000, '札幌': 1100
            },
            '横浜': { '東京': 30, '横浜': 0, '千葉': 50, 'さいたま': 50 },
            '千葉': { '東京': 40, '横浜': 50, '千葉': 0, 'さいたま': 60 },
            'さいたま': { '東京': 30, '横浜': 50, '千葉': 60, 'さいたま': 0 },
            '名古屋': { '東京': 350, '大阪': 200 },
            '大阪': { '東京': 500, '名古屋': 200, '福岡': 550 },
            '福岡': { '東京': 1000, '大阪': 550 }
        };

        // 都市名を抽出（簡易版）
        const extractCity = (address) => {
            for (const city of Object.keys(cityDistances)) {
                if (address.includes(city)) {
                    return city;
                }
            }
            return null;
        };

        const originCity = extractCity(origin);
        const destCity = extractCity(destination);

        if (originCity && destCity && cityDistances[originCity] && cityDistances[originCity][destCity]) {
            return cityDistances[originCity][destCity];
        }

        // 不明な場合はランダムな距離（50-300km）
        return Math.floor(Math.random() * 250) + 50;
    }

    // 配送時間計算（距離から推定）
    calculateEstimatedTime(distance, category = '配達') {
        // 平均速度（km/h）
        const speedMap = {
            '配達': 40,  // 市街地配送
            '保冷': 50,  // 高速優先
            '活魚': 60   // 最速配送
        };

        const speed = speedMap[category] || 40;
        const hours = distance / speed;
        const minutes = Math.round(hours * 60);

        return minutes;
    }

    // 燃料費計算
    calculateFuelCost(distance, truckType = '配達') {
        // 燃費（km/L）
        const fuelEfficiency = {
            '配達': 7,
            '保冷': 6,
            '活魚': 5
        };

        const efficiency = fuelEfficiency[truckType] || 7;
        const fuelPrice = 160; // 円/L（固定値）

        const fuelLiters = distance / efficiency;
        const cost = Math.round(fuelLiters * fuelPrice);

        return cost;
    }

    // ルート最適化（複数の行先を最適な順序に並べ替え）
    optimizeRoute(destinations, startPoint = '東京都') {
        if (!destinations || destinations.length <= 1) {
            return destinations;
        }

        // 貪欲法による最適化（最近傍法）
        const optimized = [];
        let currentPoint = startPoint;
        const remaining = [...destinations];

        while (remaining.length > 0) {
            let nearestIndex = 0;
            let nearestDistance = Infinity;

            // 現在地から最も近い地点を探す
            remaining.forEach((dest, index) => {
                const destName = typeof dest === 'object' ? dest.destination : dest;
                const distance = this.calculateDistance(currentPoint, destName);

                if (distance < nearestDistance) {
                    nearestDistance = distance;
                    nearestIndex = index;
                }
            });

            // 最も近い地点を追加
            optimized.push(remaining[nearestIndex]);
            currentPoint = typeof remaining[nearestIndex] === 'object'
                ? remaining[nearestIndex].destination
                : remaining[nearestIndex];
            remaining.splice(nearestIndex, 1);
        }

        return optimized;
    }

    // 配送ステータスの自動更新（時間経過に基づく）
    updateDeliveryStatus(delivery) {
        const now = new Date();
        const startDateTime = new Date(delivery.startDate + ' ' + delivery.startTime);
        const endDateTime = new Date(delivery.endDate + ' ' + delivery.endTime);

        // 予定時刻との差分（分）
        const minutesUntilStart = (startDateTime - now) / (1000 * 60);
        const minutesSinceStart = (now - startDateTime) / (1000 * 60);
        const totalMinutes = (endDateTime - startDateTime) / (1000 * 60);
        const progress = minutesSinceStart / totalMinutes;

        let newStatus = delivery.status;
        let newDetailedStatus = delivery.detailedStatus || delivery.status;

        if (minutesUntilStart > 60) {
            // 開始1時間以上前
            newStatus = 'scheduled';
            newDetailedStatus = 'preparing';
        } else if (minutesUntilStart > 0) {
            // 開始前（1時間以内）
            newStatus = 'scheduled';
            newDetailedStatus = 'preparing';
        } else if (progress < 0.1) {
            // 開始直後（10%未満）
            newStatus = 'inprogress';
            newDetailedStatus = 'loading';
        } else if (progress < 0.9) {
            // 配送中（10-90%）
            newStatus = 'inprogress';
            newDetailedStatus = 'intransit';
        } else if (progress < 1.0) {
            // 到着間近（90-100%）
            newStatus = 'inprogress';
            newDetailedStatus = 'unloading';
        } else {
            // 完了
            newStatus = 'completed';
            newDetailedStatus = 'completed';
        }

        return { status: newStatus, detailedStatus: newDetailedStatus, progress: Math.min(progress * 100, 100) };
    }

    // 遅延チェック
    checkDelay(delivery) {
        const now = new Date();
        const endDateTime = new Date(delivery.endDate + ' ' + delivery.endTime);
        const delayMinutes = (now - endDateTime) / (1000 * 60);

        if (delivery.status !== 'completed' && delayMinutes > this.settings.delayThreshold) {
            return {
                isDelayed: true,
                delayMinutes: Math.round(delayMinutes)
            };
        }

        return {
            isDelayed: false,
            delayMinutes: 0
        };
    }

    // 配送追跡の開始
    startTracking(deliveryId) {
        if (this.trackingInterval) {
            clearInterval(this.trackingInterval);
        }

        this.trackingInterval = setInterval(() => {
            this.updateActiveDeliveries();
        }, 60000); // 1分ごとに更新

        console.log('✓ 配送追跡を開始しました');
    }

    // 配送追跡の停止
    stopTracking() {
        if (this.trackingInterval) {
            clearInterval(this.trackingInterval);
            this.trackingInterval = null;
            console.log('✓ 配送追跡を停止しました');
        }
    }

    // アクティブな配送の更新
    updateActiveDeliveries() {
        const deliveries = db.getAllDeliveries();
        const activeDeliveries = deliveries.filter(d => d.status === 'inprogress');

        activeDeliveries.forEach(delivery => {
            const statusUpdate = this.updateDeliveryStatus(delivery);
            const delayCheck = this.checkDelay(delivery);

            // ステータスが変わった場合は通知
            if (statusUpdate.detailedStatus !== delivery.detailedStatus) {
                const customer = db.getCustomerById(delivery.customerId);
                const statusText = {
                    'loading': '積込中',
                    'intransit': '配送中',
                    'unloading': '荷卸中',
                    'completed': '完了'
                }[statusUpdate.detailedStatus];

                this.sendNotification(
                    '📍 配送ステータス更新',
                    `顧客: ${customer ? customer.name : '不明'}\nステータス: ${statusText}`,
                    { deliveryId: delivery.id }
                );

                // データベースを更新
                db.updateDelivery(delivery.id, {
                    ...delivery,
                    status: statusUpdate.status,
                    detailedStatus: statusUpdate.detailedStatus
                });
            }

            // 遅延チェック
            if (delayCheck.isDelayed && !delivery.delayNotified) {
                const customer = db.getCustomerById(delivery.customerId);
                this.notifyDeliveryDelay(delivery, customer, delayCheck.delayMinutes);

                // 遅延通知済みフラグを立てる
                db.updateDelivery(delivery.id, {
                    ...delivery,
                    delayNotified: true
                });
            }
        });
    }

    // 配送効率分析
    analyzeDeliveryEfficiency(delivery) {
        const truck = db.getTruckById(delivery.truckId);
        const totalDistance = delivery.distance || 0;
        const fuelCost = delivery.fuelCost || 0;
        const category = delivery.category || '配達';

        // 実際の所要時間
        const startDateTime = new Date(delivery.startDate + ' ' + delivery.startTime);
        const endDateTime = new Date(delivery.endDate + ' ' + delivery.endTime);
        const actualMinutes = (endDateTime - startDateTime) / (1000 * 60);

        // 予測時間
        const estimatedMinutes = this.calculateEstimatedTime(totalDistance, category);

        // 効率スコア（100点満点）
        const timeEfficiency = Math.min(100, (estimatedMinutes / actualMinutes) * 100);
        const costEfficiency = totalDistance > 0 ? Math.min(100, (totalDistance / fuelCost) * 50) : 0;
        const overallScore = (timeEfficiency * 0.6 + costEfficiency * 0.4);

        return {
            timeEfficiency: Math.round(timeEfficiency),
            costEfficiency: Math.round(costEfficiency),
            overallScore: Math.round(overallScore),
            actualMinutes: Math.round(actualMinutes),
            estimatedMinutes: estimatedMinutes,
            timeDifference: Math.round(actualMinutes - estimatedMinutes)
        };
    }

    // 配送の総距離計算
    calculateTotalDistance(destinations) {
        if (!destinations || destinations.length === 0) {
            return 0;
        }

        let totalDistance = 0;
        let currentPoint = '東京都'; // デフォルト出発地

        destinations.forEach(dest => {
            const destName = typeof dest === 'object' ? dest.destination : dest;
            const distance = this.calculateDistance(currentPoint, destName);
            totalDistance += distance;
            currentPoint = destName;
        });

        return totalDistance;
    }
}

// グローバルインスタンス
const deliveryAdvanced = new DeliveryAdvancedManager();
