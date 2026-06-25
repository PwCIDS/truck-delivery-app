// 認証システム
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.sessionTimeout = 8 * 60 * 60 * 1000; // 8時間
        this.init();
    }

    init() {
        this.loadSession();
        this.initDefaultUsers();
        this.setupSessionCheck();
    }

    // デフォルトユーザーの初期化
    initDefaultUsers() {
        const users = this.getUsers();

        if (users.length === 0) {
            // デフォルト管理者アカウント
            this.addUser({
                username: 'admin',
                password: 'admin123', // 初回ログイン後に変更を推奨
                role: 'admin',
                fullName: '管理者'
            });

            // デフォルト一般ユーザー
            this.addUser({
                username: 'user',
                password: 'user123',
                role: 'user',
                fullName: '一般ユーザー'
            });

            console.log('デフォルトユーザーを作成しました');
            console.log('管理者: admin / admin123');
            console.log('一般ユーザー: user / user123');
        }
    }

    // ユーザー一覧取得
    getUsers() {
        const usersData = localStorage.getItem('system_users');
        return usersData ? JSON.parse(usersData) : [];
    }

    // ユーザー保存
    saveUsers(users) {
        localStorage.setItem('system_users', JSON.stringify(users));
    }

    // パスワードのハッシュ化（SHA-256）
    async hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hash = await crypto.subtle.digest('SHA-256', data);
        return Array.from(new Uint8Array(hash))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    // ユーザー追加
    async addUser(userData) {
        const users = this.getUsers();

        // ユーザー名の重複チェック
        if (users.some(u => u.username === userData.username)) {
            throw new Error('このユーザー名は既に使用されています');
        }

        const hashedPassword = await this.hashPassword(userData.password);

        const newUser = {
            id: Date.now(),
            username: userData.username,
            passwordHash: hashedPassword,
            role: userData.role || 'user', // 'admin' or 'user'
            fullName: userData.fullName || userData.username,
            createdAt: new Date().toISOString(),
            lastLogin: null
        };

        users.push(newUser);
        this.saveUsers(users);
        return newUser;
    }

    // ログイン
    async login(username, password) {
        const users = this.getUsers();
        const user = users.find(u => u.username === username);

        if (!user) {
            throw new Error('ユーザー名またはパスワードが正しくありません');
        }

        const hashedPassword = await this.hashPassword(password);

        if (user.passwordHash !== hashedPassword) {
            throw new Error('ユーザー名またはパスワードが正しくありません');
        }

        // 最終ログイン時刻を更新
        user.lastLogin = new Date().toISOString();
        this.saveUsers(users);

        // セッション作成
        const session = {
            userId: user.id,
            username: user.username,
            role: user.role,
            fullName: user.fullName,
            loginTime: Date.now(),
            expiresAt: Date.now() + this.sessionTimeout
        };

        localStorage.setItem('current_session', JSON.stringify(session));
        this.currentUser = session;

        console.log('✓ ログイン成功:', user.username);
        return session;
    }

    // ログアウト
    logout() {
        localStorage.removeItem('current_session');
        this.currentUser = null;
        console.log('✓ ログアウトしました');
    }

    // セッション読み込み
    loadSession() {
        const sessionData = localStorage.getItem('current_session');

        if (!sessionData) {
            return null;
        }

        const session = JSON.parse(sessionData);

        // セッション有効期限チェック
        if (Date.now() > session.expiresAt) {
            this.logout();
            return null;
        }

        this.currentUser = session;
        return session;
    }

    // セッションチェック（定期実行）
    setupSessionCheck() {
        setInterval(() => {
            if (this.currentUser && Date.now() > this.currentUser.expiresAt) {
                alert('セッションが期限切れです。再度ログインしてください。');
                this.logout();
                location.reload();
            }
        }, 60000); // 1分ごとにチェック
    }

    // セッション延長
    extendSession() {
        if (this.currentUser) {
            this.currentUser.expiresAt = Date.now() + this.sessionTimeout;
            localStorage.setItem('current_session', JSON.stringify(this.currentUser));
        }
    }

    // ログイン状態確認
    isLoggedIn() {
        return this.currentUser !== null;
    }

    // 管理者権限チェック
    isAdmin() {
        return this.currentUser && this.currentUser.role === 'admin';
    }

    // 現在のユーザー取得
    getCurrentUser() {
        return this.currentUser;
    }

    // パスワード変更
    async changePassword(username, oldPassword, newPassword) {
        const users = this.getUsers();
        const userIndex = users.findIndex(u => u.username === username);

        if (userIndex === -1) {
            throw new Error('ユーザーが見つかりません');
        }

        // 旧パスワード確認
        const oldHashedPassword = await this.hashPassword(oldPassword);
        if (users[userIndex].passwordHash !== oldHashedPassword) {
            throw new Error('現在のパスワードが正しくありません');
        }

        // 新パスワード設定
        const newHashedPassword = await this.hashPassword(newPassword);
        users[userIndex].passwordHash = newHashedPassword;
        this.saveUsers(users);

        console.log('✓ パスワードを変更しました');
    }

    // ユーザー削除（管理者のみ）
    deleteUser(userId) {
        if (!this.isAdmin()) {
            throw new Error('管理者権限が必要です');
        }

        const users = this.getUsers();
        const filteredUsers = users.filter(u => u.id !== userId);

        if (filteredUsers.length === users.length) {
            throw new Error('ユーザーが見つかりません');
        }

        // 自分自身は削除できない
        if (this.currentUser.userId === userId) {
            throw new Error('自分自身を削除することはできません');
        }

        this.saveUsers(filteredUsers);
        console.log('✓ ユーザーを削除しました');
    }

    // ユーザー情報更新（管理者のみ）
    updateUser(userId, updates) {
        if (!this.isAdmin()) {
            throw new Error('管理者権限が必要です');
        }

        const users = this.getUsers();
        const userIndex = users.findIndex(u => u.id === userId);

        if (userIndex === -1) {
            throw new Error('ユーザーが見つかりません');
        }

        // 更新可能なフィールド
        if (updates.fullName) users[userIndex].fullName = updates.fullName;
        if (updates.role) users[userIndex].role = updates.role;

        this.saveUsers(users);
        console.log('✓ ユーザー情報を更新しました');
    }

    // アクティビティログ記録
    logActivity(action, details = {}) {
        if (!this.currentUser) return;

        const logs = this.getActivityLogs();
        const log = {
            id: Date.now(),
            userId: this.currentUser.userId,
            username: this.currentUser.username,
            action: action,
            details: details,
            timestamp: new Date().toISOString()
        };

        logs.push(log);

        // 最新1000件のみ保持
        if (logs.length > 1000) {
            logs.shift();
        }

        localStorage.setItem('activity_logs', JSON.stringify(logs));
    }

    // アクティビティログ取得
    getActivityLogs(limit = 100) {
        const logsData = localStorage.getItem('activity_logs');
        const logs = logsData ? JSON.parse(logsData) : [];
        return logs.slice(-limit).reverse(); // 最新から表示
    }

    // ログインが必要な操作の権限チェック
    requireLogin() {
        if (!this.isLoggedIn()) {
            throw new Error('ログインが必要です');
        }
    }

    // 管理者権限が必要な操作のチェック
    requireAdmin() {
        this.requireLogin();
        if (!this.isAdmin()) {
            throw new Error('管理者権限が必要です');
        }
    }
}

// グローバルインスタンス
const authManager = new AuthManager();

// ログイン画面の表示/非表示制御
function checkAuthAndShowContent() {
    const loginScreen = document.getElementById('login-screen');
    const mainApp = document.getElementById('main-app');

    if (authManager.isLoggedIn()) {
        // ログイン済み
        if (loginScreen) loginScreen.style.display = 'none';
        if (mainApp) mainApp.style.display = 'block';
        updateUserInfo();

        // セッション延長（アクティビティがあれば）
        document.addEventListener('click', () => authManager.extendSession(), { once: true });
        document.addEventListener('keydown', () => authManager.extendSession(), { once: true });
    } else {
        // 未ログイン
        if (loginScreen) loginScreen.style.display = 'flex';
        if (mainApp) mainApp.style.display = 'none';
    }
}

// ユーザー情報表示更新
function updateUserInfo() {
    const user = authManager.getCurrentUser();
    if (!user) return;

    const userInfoElement = document.getElementById('user-info');
    if (userInfoElement) {
        const roleLabel = user.role === 'admin' ? '管理者' : '一般ユーザー';
        const roleColor = user.role === 'admin' ? '#e74c3c' : '#3498db';

        userInfoElement.innerHTML = `
            <span style="margin-right: 10px;">
                <strong>${user.fullName}</strong>
                <span style="background-color: ${roleColor}; color: white; padding: 2px 8px; border-radius: 3px; font-size: 11px; margin-left: 5px;">${roleLabel}</span>
            </span>
            <button id="logout-btn" class="btn-secondary" style="padding: 6px 12px; font-size: 13px;">ログアウト</button>
        `;

        // ログアウトボタンのイベント設定
        document.getElementById('logout-btn').addEventListener('click', handleLogout);
    }

    // 管理者のみ表示する要素の制御
    if (!authManager.isAdmin()) {
        document.querySelectorAll('.admin-only').forEach(el => {
            el.style.display = 'none';
        });
    }
}

// ログアウト処理
function handleLogout() {
    if (confirm('ログアウトしますか？')) {
        authManager.logout();
        location.reload();
    }
}

// ページ読み込み時の認証チェック
document.addEventListener('DOMContentLoaded', () => {
    checkAuthAndShowContent();
});
