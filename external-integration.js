// 外部システム連携機能

class ExternalIntegration {
    constructor() {
        this.settings = {
            webhook: {
                enabled: false,
                url: '',
                events: []
            },
            api: {
                enabled: false,
                endpoint: '',
                apiKey: ''
            },
            email: {
                enabled: false,
                smtpServer: '',
                smtpPort: 587,
                username: '',
                password: ''
            }
        };
        this.init();
    }

    init() {
        this.loadSettings();
    }

    // 設定読み込み
    loadSettings() {
        const saved = localStorage.getItem('external_integration_settings');
        if (saved) {
            this.settings = { ...this.settings, ...JSON.parse(saved) };
        }
    }

    // 設定保存
    saveSettings() {
        localStorage.setItem('external_integration_settings', JSON.stringify(this.settings));
    }

    // Webhook送信
    async sendWebhook(event, data) {
        if (!this.settings.webhook.enabled) {
            return { success: false, message: 'Webhookが無効です' };
        }

        if (!this.settings.webhook.url) {
            return { success: false, message: 'Webhook URLが設定されていません' };
        }

        // イベントフィルタ
        if (this.settings.webhook.events.length > 0 &&
            !this.settings.webhook.events.includes(event)) {
            return { success: false, message: 'このイベントはWebhookの対象外です' };
        }

        const payload = {
            event: event,
            timestamp: new Date().toISOString(),
            data: data
        };

        try {
            const response = await fetch(this.settings.webhook.url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                console.log('Webhook送信成功:', event);
                return { success: true, response: await response.json() };
            } else {
                console.error('Webhook送信失敗:', response.statusText);
                return { success: false, message: response.statusText };
            }
        } catch (error) {
            console.error('Webhook送信エラー:', error);
            return { success: false, message: error.message };
        }
    }

    // 配送イベント通知
    async notifyDeliveryEvent(eventType, delivery) {
        const truck = db.getTruckById(delivery.truckId);
        const driver = db.getDriverById(delivery.driverId);
        const customer = db.getCustomerById(delivery.customerId);

        const data = {
            deliveryId: delivery.id,
            truck: truck ? { number: truck.number, type: truck.type } : null,
            driver: driver ? { name: driver.name, code: driver.code } : null,
            customer: customer ? { name: customer.name, code: customer.code } : null,
            startDateTime: `${delivery.startDate} ${delivery.startTime}`,
            endDateTime: `${delivery.endDate} ${delivery.endTime}`,
            status: delivery.status,
            cargo: delivery.cargo
        };

        // Webhook送信
        await this.sendWebhook(`delivery.${eventType}`, data);

        // Emailしい通知（設定されている場合）
        if (this.settings.email.enabled) {
            await this.sendEmail(
                customer?.email,
                `配送${eventType === 'started' ? '開始' : '完了'}のお知らせ`,
                this.generateDeliveryEmailBody(eventType, data)
            );
        }
    }

    // メール送信
    async sendEmail(to, subject, body) {
        if (!this.settings.email.enabled) {
            return { success: false, message: 'メール機能が無効です' };
        }

        // 実際のメール送信は外部サービス（SendGrid, AWS SESなど）を使用
        // ここではシミュレーション
        console.log('メール送信:', { to, subject, body });

        return {
            success: true,
            message: 'メール送信をシミュレートしました'
        };
    }

    // 配送メール本文生成
    generateDeliveryEmailBody(eventType, data) {
        if (eventType === 'started') {
            return `
                【配送開始のお知らせ】

                お客様

                以下の配送を開始いたしました。

                配送ID: ${data.deliveryId}
                トラック: ${data.truck?.number || '未定'}
                ドライバー: ${data.driver?.name || '未定'}
                出発予定: ${data.startDateTime}
                到着予定: ${data.endDateTime}
                積載内容: ${data.cargo}

                何かご不明な点がございましたら、お気軽にお問い合わせください。

                ──────────────────
                トラック配送管理システム
            `;
        } else if (eventType === 'completed') {
            return `
                【配送完了のお知らせ】

                お客様

                以下の配送が完了いたしました。

                配送ID: ${data.deliveryId}
                トラック: ${data.truck?.number || '未定'}
                ドライバー: ${data.driver?.name || '未定'}
                完了日時: ${new Date().toLocaleString('ja-JP')}
                積載内容: ${data.cargo}

                ご利用ありがとうございました。

                ──────────────────
                トラック配送管理システム
            `;
        }
    }

    // REST API エンドポイント（簡易版）
    async callExternalAPI(endpoint, method = 'GET', data = null) {
        if (!this.settings.api.enabled) {
            return { success: false, message: 'API連携が無効です' };
        }

        const url = `${this.settings.api.endpoint}${endpoint}`;
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.settings.api.apiKey}`
            }
        };

        if (data && (method === 'POST' || method === 'PUT')) {
            options.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(url, options);

            if (response.ok) {
                return { success: true, data: await response.json() };
            } else {
                return { success: false, message: response.statusText };
            }
        } catch (error) {
            console.error('API呼び出しエラー:', error);
            return { success: false, message: error.message };
        }
    }

    // CSV/JSONエクスポート
    exportData(format = 'json', dataType = 'all') {
        let data = {};

        switch (dataType) {
            case 'deliveries':
                data = { deliveries: db.getAllDeliveries() };
                break;
            case 'trucks':
                data = { trucks: db.getAllTrucks() };
                break;
            case 'drivers':
                data = { drivers: db.getAllDrivers() };
                break;
            case 'customers':
                data = { customers: db.getAllCustomers() };
                break;
            case 'all':
            default:
                data = {
                    deliveries: db.getAllDeliveries(),
                    trucks: db.getAllTrucks(),
                    drivers: db.getAllDrivers(),
                    customers: db.getAllCustomers(),
                    exportedAt: new Date().toISOString()
                };
        }

        if (format === 'json') {
            return this.exportAsJSON(data);
        } else if (format === 'csv') {
            return this.exportAsCSV(data);
        }
    }

    // JSON形式でエクスポート
    exportAsJSON(data) {
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `truck-delivery-export-${Date.now()}.json`;
        a.click();

        URL.revokeObjectURL(url);

        return { success: true, message: 'JSONエクスポート完了' };
    }

    // CSV形式でエクスポート
    exportAsCSV(data) {
        // 配送データをCSVに変換
        if (data.deliveries) {
            const csv = this.convertDeliveriesToCSV(data.deliveries);
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `deliveries-${Date.now()}.csv`;
            a.click();

            URL.revokeObjectURL(url);
        }

        return { success: true, message: 'CSVエクスポート完了' };
    }

    // 配送データをCSV形式に変換
    convertDeliveriesToCSV(deliveries) {
        const headers = [
            '配送ID', '出発日', '出発時刻', '到着日', '到着時刻',
            'トラックID', 'ドライバーID', '顧客ID',
            '積載内容', 'ステータス', '距離(km)', 'カテゴリ'
        ];

        let csv = headers.join(',') + '\n';

        deliveries.forEach(d => {
            const row = [
                d.id,
                d.startDate,
                d.startTime,
                d.endDate,
                d.endTime,
                d.truckId,
                d.driverId,
                d.customerId,
                `"${d.cargo}"`,
                d.status,
                d.distance || 0,
                d.category || ''
            ];
            csv += row.join(',') + '\n';
        });

        return csv;
    }

    // データインポート
    async importData(file, format = 'json') {
        try {
            const text = await file.text();

            if (format === 'json') {
                const data = JSON.parse(text);
                return this.importFromJSON(data);
            } else if (format === 'csv') {
                return this.importFromCSV(text);
            }
        } catch (error) {
            console.error('インポートエラー:', error);
            return { success: false, message: error.message };
        }
    }

    // JSONからインポート
    importFromJSON(data) {
        let imported = {
            deliveries: 0,
            trucks: 0,
            drivers: 0,
            customers: 0
        };

        // データ検証
        const validation = dataValidation.checkDataIntegrity();

        // トラック
        if (data.trucks && Array.isArray(data.trucks)) {
            data.trucks.forEach(truck => {
                const validation = dataValidation.validateEntity('truck', truck);
                if (validation.valid) {
                    db.addTruck(truck);
                    imported.trucks++;
                }
            });
        }

        // ドライバー
        if (data.drivers && Array.isArray(data.drivers)) {
            data.drivers.forEach(driver => {
                const validation = dataValidation.validateEntity('driver', driver);
                if (validation.valid) {
                    db.addDriver(driver);
                    imported.drivers++;
                }
            });
        }

        // 顧客
        if (data.customers && Array.isArray(data.customers)) {
            data.customers.forEach(customer => {
                const validation = dataValidation.validateEntity('customer', customer);
                if (validation.valid) {
                    db.addCustomer(customer);
                    imported.customers++;
                }
            });
        }

        // 配送
        if (data.deliveries && Array.isArray(data.deliveries)) {
            data.deliveries.forEach(delivery => {
                const validation = dataValidation.validateEntity('delivery', delivery);
                if (validation.valid) {
                    db.addDelivery(delivery);
                    imported.deliveries++;
                }
            });
        }

        return {
            success: true,
            message: 'インポート完了',
            imported: imported
        };
    }

    // CSVからインポート
    importFromCSV(csvText) {
        const lines = csvText.split('\n');
        const headers = lines[0].split(',');
        let imported = 0;

        for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;

            const values = lines[i].split(',');
            const delivery = {};

            headers.forEach((header, index) => {
                delivery[header.trim()] = values[index]?.trim().replace(/^"|"$/g, '');
            });

            const validation = dataValidation.validateEntity('delivery', delivery);
            if (validation.valid) {
                db.addDelivery(delivery);
                imported++;
            }
        }

        return {
            success: true,
            message: 'CSVインポート完了',
            imported: { deliveries: imported }
        };
    }

    // Slack通知
    async sendSlackNotification(message, channel = '#general') {
        // Slack Webhook URLを使用
        // 設定から取得
        const webhookUrl = this.settings.slack?.webhookUrl;

        if (!webhookUrl) {
            return { success: false, message: 'Slack Webhook URLが設定されていません' };
        }

        try {
            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    channel: channel,
                    text: message,
                    username: 'トラック配送システム',
                    icon_emoji: ':truck:'
                })
            });

            if (response.ok) {
                return { success: true, message: 'Slack通知送信完了' };
            } else {
                return { success: false, message: response.statusText };
            }
        } catch (error) {
            console.error('Slack通知エラー:', error);
            return { success: false, message: error.message };
        }
    }

    // 設定ダイアログ表示
    showSettingsDialog() {
        const html = `
            <div style="padding: 20px;">
                <h3>外部連携設定</h3>

                <div style="margin-bottom: 20px;">
                    <h4>Webhook設定</h4>
                    <label>
                        <input type="checkbox" id="webhook-enabled" ${this.settings.webhook.enabled ? 'checked' : ''}>
                        Webhookを有効にする
                    </label>
                    <div class="form-group">
                        <label>Webhook URL:</label>
                        <input type="url" id="webhook-url" value="${this.settings.webhook.url}"
                               placeholder="https://example.com/webhook">
                    </div>
                </div>

                <div style="margin-bottom: 20px;">
                    <h4>API設定</h4>
                    <label>
                        <input type="checkbox" id="api-enabled" ${this.settings.api.enabled ? 'checked' : ''}>
                        API連携を有効にする
                    </label>
                    <div class="form-group">
                        <label>APIエンドポイント:</label>
                        <input type="url" id="api-endpoint" value="${this.settings.api.endpoint}"
                               placeholder="https://api.example.com">
                    </div>
                    <div class="form-group">
                        <label>APIキー:</label>
                        <input type="password" id="api-key" value="${this.settings.api.apiKey}"
                               placeholder="APIキーを入力">
                    </div>
                </div>

                <div style="margin-top: 20px; display: flex; gap: 10px; justify-content: flex-end;">
                    <button onclick="closeModal()" class="btn-secondary">キャンセル</button>
                    <button onclick="externalIntegration.saveSettingsFromDialog()" class="btn-primary">保存</button>
                </div>
            </div>
        `;

        showModal('外部連携設定', html);
    }

    // 設定保存（ダイアログから）
    saveSettingsFromDialog() {
        this.settings.webhook.enabled = document.getElementById('webhook-enabled').checked;
        this.settings.webhook.url = document.getElementById('webhook-url').value;
        this.settings.api.enabled = document.getElementById('api-enabled').checked;
        this.settings.api.endpoint = document.getElementById('api-endpoint').value;
        this.settings.api.apiKey = document.getElementById('api-key').value;

        this.saveSettings();
        showNotification('外部連携設定を保存しました', 'success');
        closeModal();
    }
}

// グローバルインスタンス
const externalIntegration = new ExternalIntegration();
