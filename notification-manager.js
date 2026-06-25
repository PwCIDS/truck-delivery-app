// 拡張通知管理機能

class NotificationManager {
    constructor() {
        this.enabled = false;
        this.settings = {
            deliveryStart: true,
            deliveryComplete: true,
            deliveryDelay: true,
            gpsUpdate: false, // GPS更新通知（頻繁なため初期はOFF）
            maintenanceReminder: true,
            upcomingDelivery: true, // 配送開始30分前
            sound: true,
            vibration: true
        };
        this.notificationQueue = [];
        this.lastNotificationTime = new Map(); // 通知の重複防止
        this.init();
    }

    // 初期化
    async init() {
        await this.requestPermission();
        this.loadSettings();
        this.startPeriodicCheck();
    }

    // 通知権限リクエスト
    async requestPermission() {
        if (!('Notification' in window)) {
            console.warn('このブラウザは通知をサポートしていません');
            return false;
        }

        if (Notification.permission === 'granted') {
            this.enabled = true;
            return true;
        }

        if (Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission();
            this.enabled = permission === 'granted';
            return this.enabled;
        }

        return false;
    }

    // 設定読み込み
    loadSettings() {
        const saved = localStorage.getItem('notification_settings');
        if (saved) {
            try {
                this.settings = { ...this.settings, ...JSON.parse(saved) };
            } catch (error) {
                console.error('通知設定読み込みエラー:', error);
            }
        }
    }

    // 設定保存
    saveSettings() {
        localStorage.setItem('notification_settings', JSON.stringify(this.settings));
    }

    // 通知送信（基本）
    send(title, body, options = {}) {
        if (!this.enabled || !this.canSendNotification(options.id)) {
            return null;
        }

        // 通知タイプごとの設定チェック
        if (options.type && !this.settings[options.type]) {
            return null;
        }

        const notificationOptions = {
            body: body,
            icon: options.icon || this.getDefaultIcon(options.type),
            badge: 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="0.9em" font-size="90">🚚</text></svg>'),
            tag: options.tag || `delivery-${Date.now()}`,
            requireInteraction: options.requireInteraction || false,
            silent: !this.settings.sound,
            vibrate: this.settings.vibration ? [200, 100, 200] : [],
            data: options.data || {},
            actions: options.actions || []
        };

        try {
            const notification = new Notification(title, notificationOptions);

            // クリックイベント
            notification.onclick = () => {
                window.focus();
                if (options.onClick) {
                    options.onClick(options.data);
                }
                notification.close();
            };

            // 自動クローズ
            if (!options.requireInteraction) {
                setTimeout(() => notification.close(), options.duration || 5000);
            }

            // 最終通知時刻を記録
            if (options.id) {
                this.lastNotificationTime.set(options.id, Date.now());
            }

            return notification;

        } catch (error) {
            console.error('通知送信エラー:', error);
            return null;
        }
    }

    // 通知送信可能かチェック（重複防止）
    canSendNotification(id, minInterval = 60000) {
        if (!id) return true;

        const lastTime = this.lastNotificationTime.get(id);
        if (!lastTime) return true;

        return (Date.now() - lastTime) >= minInterval;
    }

    // デフォルトアイコン取得
    getDefaultIcon(type) {
        const icons = {
            deliveryStart: '🚚',
            deliveryComplete: '✅',
            deliveryDelay: '⚠️',
            gpsUpdate: '📍',
            maintenanceReminder: '🔧',
            upcomingDelivery: '🔔'
        };

        const emoji = icons[type] || '📢';
        return 'data:image/svg+xml,' + encodeURIComponent(
            `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="0.9em" font-size="90">${emoji}</text></svg>`
        );
    }

    // 配送開始通知
    notifyDeliveryStart(delivery) {
        const truck = db.getTruckById(delivery.truckId);
        const driver = db.getDriverById(delivery.driverId);
        const customer = db.getCustomerById(delivery.customerId);

        this.send(
            '🚚 配送開始',
            `${truck ? truck.number : 'トラック'} - ${driver ? driver.name : 'ドライバー'}\n顧客: ${customer ? customer.name : '不明'}`,
            {
                type: 'deliveryStart',
                id: `start-${delivery.id}`,
                data: { deliveryId: delivery.id, action: 'viewDelivery' },
                onClick: (data) => {
                    if (data.deliveryId) {
                        editDelivery(data.deliveryId);
                    }
                }
            }
        );
    }

    // 配送完了通知
    notifyDeliveryComplete(delivery) {
        const customer = db.getCustomerById(delivery.customerId);
        const duration = this.calculateDeliveryDuration(delivery);

        this.send(
            '✅ 配送完了',
            `顧客: ${customer ? customer.name : '不明'}\n所要時間: ${duration}`,
            {
                type: 'deliveryComplete',
                id: `complete-${delivery.id}`,
                data: { deliveryId: delivery.id, action: 'viewDelivery' },
                onClick: (data) => {
                    if (data.deliveryId) {
                        editDelivery(data.deliveryId);
                    }
                }
            }
        );
    }

    // 遅延警告通知
    notifyDeliveryDelay(delivery, delayMinutes) {
        const customer = db.getCustomerById(delivery.customerId);

        this.send(
            '⚠️ 配送遅延',
            `顧客: ${customer ? customer.name : '不明'}\n予定より${delayMinutes}分遅延しています`,
            {
                type: 'deliveryDelay',
                id: `delay-${delivery.id}`,
                requireInteraction: true,
                data: { deliveryId: delivery.id, action: 'viewDelivery' },
                onClick: (data) => {
                    if (data.deliveryId) {
                        editDelivery(data.deliveryId);
                    }
                }
            }
        );
    }

    // GPS更新通知
    notifyGPSUpdate(delivery, position) {
        const truck = db.getTruckById(delivery.truckId);
        const eta = gpsTracker.calculateETA(delivery.id);

        this.send(
            '📍 位置情報更新',
            `${truck ? truck.number : 'トラック'}\n速度: ${position.speed ? position.speed.toFixed(1) : '-'} km/h\n${eta ? `到着予定: ${eta.eta.toLocaleTimeString('ja-JP')}` : ''}`,
            {
                type: 'gpsUpdate',
                id: `gps-${delivery.id}`,
                duration: 3000,
                data: { deliveryId: delivery.id }
            }
        );
    }

    // メンテナンス期限通知
    notifyMaintenanceReminder(truck, daysUntilMaintenance) {
        const urgency = daysUntilMaintenance <= 3 ? '緊急' : '注意';

        this.send(
            `🔧 メンテナンス${urgency}`,
            `${truck.number}\n次回メンテナンスまで ${daysUntilMaintenance} 日`,
            {
                type: 'maintenanceReminder',
                id: `maintenance-${truck.id}`,
                requireInteraction: daysUntilMaintenance <= 3,
                data: { truckId: truck.id }
            }
        );
    }

    // 配送開始30分前通知
    notifyUpcomingDelivery(delivery) {
        const truck = db.getTruckById(delivery.truckId);
        const driver = db.getDriverById(delivery.driverId);
        const customer = db.getCustomerById(delivery.customerId);

        this.send(
            '🔔 配送開始まもなく',
            `30分後に配送開始予定\n${truck ? truck.number : 'トラック'} - ${driver ? driver.name : 'ドライバー'}\n顧客: ${customer ? customer.name : '不明'}`,
            {
                type: 'upcomingDelivery',
                id: `upcoming-${delivery.id}`,
                data: { deliveryId: delivery.id },
                onClick: (data) => {
                    if (data.deliveryId) {
                        editDelivery(data.deliveryId);
                    }
                }
            }
        );
    }

    // カスタム通知
    notifyCustom(title, message, options = {}) {
        this.send(title, message, {
            icon: options.icon,
            duration: options.duration || 5000,
            requireInteraction: options.important || false,
            data: options.data || {}
        });
    }

    // 定期チェック（配送開始前通知、メンテナンス期限など）
    startPeriodicCheck() {
        // 5分ごとにチェック
        setInterval(() => {
            this.checkUpcomingDeliveries();
            this.checkMaintenanceReminders();
        }, 5 * 60 * 1000);

        // 初回実行
        this.checkUpcomingDeliveries();
        this.checkMaintenanceReminders();
    }

    // 配送開始前チェック
    checkUpcomingDeliveries() {
        if (!this.settings.upcomingDelivery) return;

        const deliveries = db.getAllDeliveries();
        const now = new Date();

        deliveries.forEach(delivery => {
            if (delivery.status === 'scheduled') {
                const startDateTime = new Date(delivery.startDate + ' ' + delivery.startTime);
                const minutesUntilStart = (startDateTime - now) / (1000 * 60);

                // 25-35分前に通知（30分前を目安に、5分の余裕を持たせる）
                if (minutesUntilStart > 25 && minutesUntilStart <= 35) {
                    if (this.canSendNotification(`upcoming-${delivery.id}`, 24 * 60 * 60 * 1000)) {
                        this.notifyUpcomingDelivery(delivery);
                    }
                }
            }
        });
    }

    // メンテナンス期限チェック
    checkMaintenanceReminders() {
        if (!this.settings.maintenanceReminder) return;

        const trucks = db.getAllTrucks();
        const now = new Date();

        trucks.forEach(truck => {
            if (truck.nextMaintenance) {
                const maintenanceDate = new Date(truck.nextMaintenance);
                const daysUntil = Math.ceil((maintenanceDate - now) / (1000 * 60 * 60 * 24));

                // 7日前、3日前、当日に通知
                if ([7, 3, 0].includes(daysUntil)) {
                    if (this.canSendNotification(`maintenance-${truck.id}`, 24 * 60 * 60 * 1000)) {
                        this.notifyMaintenanceReminder(truck, daysUntil);
                    }
                }
            }
        });
    }

    // 配送時間計算
    calculateDeliveryDuration(delivery) {
        if (!delivery.startDate || !delivery.startTime || !delivery.endDate || !delivery.endTime) {
            return '不明';
        }

        const start = new Date(delivery.startDate + ' ' + delivery.startTime);
        const end = new Date(delivery.endDate + ' ' + delivery.endTime);
        const minutes = (end - start) / (1000 * 60);

        const hours = Math.floor(minutes / 60);
        const mins = Math.round(minutes % 60);

        if (hours > 0) {
            return `${hours}時間${mins}分`;
        } else {
            return `${mins}分`;
        }
    }

    // 通知設定画面表示
    showSettingsDialog() {
        const html = `
            <div style="padding: 20px;">
                <h3 style="margin-top: 0;">通知設定</h3>

                <div style="margin-bottom: 20px;">
                    <h4>通知タイプ</h4>
                    ${this.renderCheckbox('deliveryStart', '配送開始時')}
                    ${this.renderCheckbox('deliveryComplete', '配送完了時')}
                    ${this.renderCheckbox('deliveryDelay', '配送遅延時')}
                    ${this.renderCheckbox('gpsUpdate', 'GPS更新時（頻繁）')}
                    ${this.renderCheckbox('maintenanceReminder', 'メンテナンス期限')}
                    ${this.renderCheckbox('upcomingDelivery', '配送開始30分前')}
                </div>

                <div style="margin-bottom: 20px;">
                    <h4>通知オプション</h4>
                    ${this.renderCheckbox('sound', '通知音を鳴らす')}
                    ${this.renderCheckbox('vibration', 'バイブレーション')}
                </div>

                <div style="margin-top: 20px; display: flex; gap: 10px; justify-content: flex-end;">
                    <button onclick="closeModal()" class="btn-secondary">キャンセル</button>
                    <button onclick="notificationManager.saveSettingsFromDialog()" class="btn-primary">保存</button>
                </div>
            </div>
        `;

        showModal('通知設定', html);
    }

    // チェックボックスHTML生成
    renderCheckbox(key, label) {
        const checked = this.settings[key] ? 'checked' : '';
        return `
            <div style="margin: 10px 0;">
                <label style="display: flex; align-items: center; cursor: pointer;">
                    <input type="checkbox" id="notification-${key}" ${checked}
                           style="margin-right: 10px; width: 18px; height: 18px;">
                    <span>${label}</span>
                </label>
            </div>
        `;
    }

    // 設定保存（ダイアログから）
    saveSettingsFromDialog() {
        Object.keys(this.settings).forEach(key => {
            const checkbox = document.getElementById(`notification-${key}`);
            if (checkbox) {
                this.settings[key] = checkbox.checked;
            }
        });

        this.saveSettings();
        showNotification('通知設定を保存しました', 'success');
        closeModal();
    }

    // 通知テスト
    testNotification() {
        this.send(
            '🔔 テスト通知',
            'これはテスト通知です。通知が正常に動作しています。',
            {
                duration: 3000
            }
        );
    }

    // 通知履歴（今後の拡張用）
    getNotificationHistory() {
        return this.notificationQueue;
    }

    // 通知クリア
    clearAllNotifications() {
        this.notificationQueue = [];
        this.lastNotificationTime.clear();
    }
}

// グローバルインスタンス
const notificationManager = new NotificationManager();
window.notificationManager = notificationManager;
