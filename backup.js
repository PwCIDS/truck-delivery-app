// バックアップ管理システム
class BackupManager {
    constructor() {
        this.dbName = 'TruckDeliveryBackup';
        this.dbVersion = 1;
        this.db = null;
        this.maxBackups = 10; // 保持する最大バックアップ数
        this.init();
    }

    async init() {
        await this.initIndexedDB();
        this.loadSettings();
        this.checkAndAutoBackup();
    }

    // IndexedDBの初期化
    initIndexedDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => {
                console.error('IndexedDB初期化エラー:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // バックアップストア
                if (!db.objectStoreNames.contains('backups')) {
                    const backupStore = db.createObjectStore('backups', { keyPath: 'id', autoIncrement: true });
                    backupStore.createIndex('timestamp', 'timestamp', { unique: false });
                    backupStore.createIndex('type', 'type', { unique: false });
                }
            };
        });
    }

    // 設定の読み込み
    loadSettings() {
        const settings = localStorage.getItem('backupSettings');
        if (settings) {
            this.settings = JSON.parse(settings);
        } else {
            // デフォルト設定
            this.settings = {
                autoBackup: true,
                backupInterval: 24, // 時間
                lastBackupTime: null
            };
            this.saveSettings();
        }
    }

    // 設定の保存
    saveSettings() {
        localStorage.setItem('backupSettings', JSON.stringify(this.settings));
    }

    // 自動バックアップチェック
    async checkAndAutoBackup() {
        if (!this.settings.autoBackup) {
            return;
        }

        const now = Date.now();
        const lastBackup = this.settings.lastBackupTime;

        if (!lastBackup) {
            // 初回バックアップ
            await this.createBackup('auto');
            return;
        }

        const hoursSinceLastBackup = (now - lastBackup) / (1000 * 60 * 60);

        if (hoursSinceLastBackup >= this.settings.backupInterval) {
            await this.createBackup('auto');
        }
    }

    // バックアップ作成
    async createBackup(type = 'manual') {
        try {
            // LocalStorageからデータを取得
            const deliveries = JSON.parse(localStorage.getItem('deliveries') || '[]');
            const trucks = JSON.parse(localStorage.getItem('trucks') || '[]');
            const customers = JSON.parse(localStorage.getItem('customers') || '[]');
            const drivers = JSON.parse(localStorage.getItem('drivers') || '[]');
            const maintenances = JSON.parse(localStorage.getItem('maintenances') || '[]');

            const backup = {
                timestamp: Date.now(),
                date: new Date().toISOString(),
                type: type, // 'auto' or 'manual'
                data: {
                    deliveries,
                    trucks,
                    customers,
                    drivers,
                    maintenances,
                    dataVersion: localStorage.getItem('dataVersion')
                },
                size: this.calculateBackupSize({ deliveries, trucks, customers, drivers, maintenances })
            };

            // IndexedDBに保存
            await this.saveBackupToIndexedDB(backup);

            // 設定を更新
            this.settings.lastBackupTime = Date.now();
            this.saveSettings();

            // 古いバックアップを削除
            await this.cleanupOldBackups();

            console.log('✓ バックアップ作成成功:', type, new Date(backup.timestamp).toLocaleString('ja-JP'));
            return backup;

        } catch (error) {
            console.error('バックアップ作成エラー:', error);
            throw error;
        }
    }

    // バックアップサイズの計算（概算）
    calculateBackupSize(data) {
        const jsonString = JSON.stringify(data);
        return new Blob([jsonString]).size;
    }

    // IndexedDBにバックアップを保存
    saveBackupToIndexedDB(backup) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['backups'], 'readwrite');
            const store = transaction.objectStore('backups');
            const request = store.add(backup);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // バックアップ一覧取得
    async getAllBackups() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['backups'], 'readonly');
            const store = transaction.objectStore('backups');
            const request = store.getAll();

            request.onsuccess = () => {
                const backups = request.result;
                // 新しい順にソート
                backups.sort((a, b) => b.timestamp - a.timestamp);
                resolve(backups);
            };
            request.onerror = () => reject(request.error);
        });
    }

    // 特定のバックアップを取得
    async getBackup(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['backups'], 'readonly');
            const store = transaction.objectStore('backups');
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // バックアップから復元
    async restoreBackup(backupId) {
        try {
            const backup = await this.getBackup(backupId);
            if (!backup) {
                throw new Error('バックアップが見つかりません');
            }

            // データ検証
            if (!this.validateBackupData(backup.data)) {
                throw new Error('バックアップデータが破損しています');
            }

            // 現在のデータをバックアップ（復元前）
            await this.createBackup('pre-restore');

            // LocalStorageにデータを復元
            localStorage.setItem('deliveries', JSON.stringify(backup.data.deliveries));
            localStorage.setItem('trucks', JSON.stringify(backup.data.trucks));
            localStorage.setItem('customers', JSON.stringify(backup.data.customers));
            localStorage.setItem('drivers', JSON.stringify(backup.data.drivers));
            localStorage.setItem('maintenances', JSON.stringify(backup.data.maintenances));

            if (backup.data.dataVersion) {
                localStorage.setItem('dataVersion', backup.data.dataVersion);
            }

            console.log('✓ バックアップから復元成功:', new Date(backup.timestamp).toLocaleString('ja-JP'));
            return true;

        } catch (error) {
            console.error('復元エラー:', error);
            throw error;
        }
    }

    // バックアップデータの検証
    validateBackupData(data) {
        if (!data) return false;

        // 必須データの存在確認
        if (!Array.isArray(data.deliveries)) return false;
        if (!Array.isArray(data.trucks)) return false;
        if (!Array.isArray(data.customers)) return false;
        if (!Array.isArray(data.drivers)) return false;
        if (!Array.isArray(data.maintenances)) return false;

        return true;
    }

    // 古いバックアップを削除
    async cleanupOldBackups() {
        try {
            const backups = await this.getAllBackups();

            // 最大数を超えている場合、古いものから削除
            if (backups.length > this.maxBackups) {
                const backupsToDelete = backups.slice(this.maxBackups);

                for (const backup of backupsToDelete) {
                    await this.deleteBackup(backup.id);
                }

                console.log(`✓ 古いバックアップを${backupsToDelete.length}件削除しました`);
            }
        } catch (error) {
            console.error('バックアップクリーンアップエラー:', error);
        }
    }

    // バックアップ削除
    async deleteBackup(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['backups'], 'readwrite');
            const store = transaction.objectStore('backups');
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    // 全バックアップ削除
    async deleteAllBackups() {
        try {
            const backups = await this.getAllBackups();
            for (const backup of backups) {
                await this.deleteBackup(backup.id);
            }
            console.log('✓ 全バックアップを削除しました');
        } catch (error) {
            console.error('全バックアップ削除エラー:', error);
            throw error;
        }
    }

    // バックアップをJSONファイルとしてダウンロード
    async downloadBackupAsJSON(backupId) {
        try {
            const backup = await this.getBackup(backupId);
            if (!backup) {
                throw new Error('バックアップが見つかりません');
            }

            const exportData = {
                backupInfo: {
                    timestamp: backup.timestamp,
                    date: backup.date,
                    type: backup.type
                },
                ...backup.data
            };

            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `truck-delivery-backup-${new Date(backup.timestamp).toISOString().slice(0, 10)}.json`;
            link.click();

            console.log('✓ バックアップをJSONとしてダウンロードしました');
        } catch (error) {
            console.error('JSONダウンロードエラー:', error);
            throw error;
        }
    }

    // JSONファイルからインポート
    async importFromJSON(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = async (e) => {
                try {
                    const data = JSON.parse(e.target.result);

                    // バックアップデータの検証
                    if (!this.validateBackupData(data)) {
                        throw new Error('無効なバックアップファイルです');
                    }

                    // 現在のデータをバックアップ（インポート前）
                    await this.createBackup('pre-import');

                    // データを復元
                    localStorage.setItem('deliveries', JSON.stringify(data.deliveries || []));
                    localStorage.setItem('trucks', JSON.stringify(data.trucks || []));
                    localStorage.setItem('customers', JSON.stringify(data.customers || []));
                    localStorage.setItem('drivers', JSON.stringify(data.drivers || []));
                    localStorage.setItem('maintenances', JSON.stringify(data.maintenances || []));

                    if (data.dataVersion) {
                        localStorage.setItem('dataVersion', data.dataVersion);
                    }

                    console.log('✓ JSONファイルからインポート成功');
                    resolve(true);

                } catch (error) {
                    console.error('JSONインポートエラー:', error);
                    reject(error);
                }
            };

            reader.onerror = () => reject(reader.error);
            reader.readAsText(file);
        });
    }

    // バックアップ統計情報
    async getBackupStats() {
        try {
            const backups = await this.getAllBackups();
            const totalSize = backups.reduce((sum, b) => sum + (b.size || 0), 0);

            return {
                totalBackups: backups.length,
                totalSize: totalSize,
                totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
                oldestBackup: backups.length > 0 ? backups[backups.length - 1] : null,
                newestBackup: backups.length > 0 ? backups[0] : null,
                autoBackupsCount: backups.filter(b => b.type === 'auto').length,
                manualBackupsCount: backups.filter(b => b.type === 'manual').length
            };
        } catch (error) {
            console.error('バックアップ統計取得エラー:', error);
            return null;
        }
    }

    // 自動バックアップ設定の更新
    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        this.saveSettings();
    }

    // 最終バックアップからの経過時間（時間単位）
    getHoursSinceLastBackup() {
        if (!this.settings.lastBackupTime) {
            return null;
        }
        const now = Date.now();
        return Math.floor((now - this.settings.lastBackupTime) / (1000 * 60 * 60));
    }

    // 次回自動バックアップまでの時間（時間単位）
    getHoursUntilNextBackup() {
        if (!this.settings.autoBackup || !this.settings.lastBackupTime) {
            return null;
        }
        const hoursSince = this.getHoursSinceLastBackup();
        return Math.max(0, this.settings.backupInterval - hoursSince);
    }
}

// グローバルインスタンス
const backupManager = new BackupManager();
