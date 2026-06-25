// データ暗号化システム（Web Crypto API使用）
class CryptoManager {
    constructor() {
        this.algorithm = 'AES-GCM';
        this.keyLength = 256;
        this.ivLength = 12;
        this.saltLength = 16;
    }

    // パスワードから暗号化キーを生成
    async deriveKey(password, salt) {
        const encoder = new TextEncoder();
        const passwordBuffer = encoder.encode(password);

        // PBKDF2でキー導出
        const baseKey = await crypto.subtle.importKey(
            'raw',
            passwordBuffer,
            'PBKDF2',
            false,
            ['deriveBits', 'deriveKey']
        );

        return await crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: salt,
                iterations: 100000,
                hash: 'SHA-256'
            },
            baseKey,
            {
                name: this.algorithm,
                length: this.keyLength
            },
            false,
            ['encrypt', 'decrypt']
        );
    }

    // データの暗号化
    async encrypt(data, password) {
        try {
            const encoder = new TextEncoder();
            const dataBuffer = encoder.encode(JSON.stringify(data));

            // ランダムなsaltとIVを生成
            const salt = crypto.getRandomValues(new Uint8Array(this.saltLength));
            const iv = crypto.getRandomValues(new Uint8Array(this.ivLength));

            // キー生成
            const key = await this.deriveKey(password, salt);

            // 暗号化
            const encryptedData = await crypto.subtle.encrypt(
                {
                    name: this.algorithm,
                    iv: iv
                },
                key,
                dataBuffer
            );

            // salt + iv + 暗号化データを結合
            const resultBuffer = new Uint8Array(
                salt.length + iv.length + encryptedData.byteLength
            );
            resultBuffer.set(salt, 0);
            resultBuffer.set(iv, salt.length);
            resultBuffer.set(new Uint8Array(encryptedData), salt.length + iv.length);

            // Base64エンコード
            return this.arrayBufferToBase64(resultBuffer);

        } catch (error) {
            console.error('暗号化エラー:', error);
            throw new Error('データの暗号化に失敗しました');
        }
    }

    // データの復号化
    async decrypt(encryptedBase64, password) {
        try {
            // Base64デコード
            const encryptedBuffer = this.base64ToArrayBuffer(encryptedBase64);
            const encryptedArray = new Uint8Array(encryptedBuffer);

            // salt、IV、暗号化データを分離
            const salt = encryptedArray.slice(0, this.saltLength);
            const iv = encryptedArray.slice(this.saltLength, this.saltLength + this.ivLength);
            const data = encryptedArray.slice(this.saltLength + this.ivLength);

            // キー生成
            const key = await this.deriveKey(password, salt);

            // 復号化
            const decryptedBuffer = await crypto.subtle.decrypt(
                {
                    name: this.algorithm,
                    iv: iv
                },
                key,
                data
            );

            // デコード
            const decoder = new TextDecoder();
            const decryptedText = decoder.decode(decryptedBuffer);

            return JSON.parse(decryptedText);

        } catch (error) {
            console.error('復号化エラー:', error);
            throw new Error('データの復号化に失敗しました。パスワードが正しくない可能性があります。');
        }
    }

    // ArrayBufferをBase64に変換
    arrayBufferToBase64(buffer) {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    // Base64をArrayBufferに変換
    base64ToArrayBuffer(base64) {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes.buffer;
    }

    // LocalStorageのデータを暗号化して保存
    async saveEncryptedData(key, data, password) {
        const encrypted = await this.encrypt(data, password);
        localStorage.setItem(key, encrypted);
        localStorage.setItem(key + '_encrypted', 'true');
    }

    // 暗号化されたデータを復号化して取得
    async loadEncryptedData(key, password) {
        const isEncrypted = localStorage.getItem(key + '_encrypted');
        if (!isEncrypted) {
            // 暗号化されていないデータ
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        }

        const encrypted = localStorage.getItem(key);
        if (!encrypted) return null;

        return await this.decrypt(encrypted, password);
    }

    // データ暗号化の有効/無効チェック
    isEncryptionEnabled() {
        const setting = localStorage.getItem('encryption_enabled');
        return setting === 'true';
    }

    // データ暗号化の有効化
    enableEncryption() {
        localStorage.setItem('encryption_enabled', 'true');
    }

    // データ暗号化の無効化
    disableEncryption() {
        localStorage.setItem('encryption_enabled', 'false');
    }
}

// グローバルインスタンス
const cryptoManager = new CryptoManager();
