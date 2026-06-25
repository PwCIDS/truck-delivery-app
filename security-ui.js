// セキュリティUI管理

document.addEventListener('DOMContentLoaded', function() {
    // ログイン画面が表示されている場合のみ処理
    if (document.getElementById('login-screen')) {
        initLoginScreen();
    }

    // メインアプリが表示されている場合のみ処理
    if (authManager.isLoggedIn()) {
        initSecurityManagement();
        initUserManagement();
    }
});

// ログイン画面初期化
function initLoginScreen() {
    const loginForm = document.getElementById('login-form');
    if (!loginForm) return;

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;
        const errorDiv = document.getElementById('login-error');

        try {
            errorDiv.textContent = '';
            await authManager.login(username, password);

            // ログイン成功
            authManager.logActivity('ログイン', { username });
            location.reload();

        } catch (error) {
            errorDiv.textContent = error.message;
            errorDiv.style.display = 'block';
        }
    });
}

// セキュリティ管理初期化
function initSecurityManagement() {
    // ナビゲーション
    const navSecurity = document.getElementById('nav-security');
    if (navSecurity) {
        navSecurity.addEventListener('click', () => switchSection('security'));
    }

    // パスワード変更フォーム
    const changePasswordForm = document.getElementById('change-password-form');
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', handlePasswordChange);
    }

    // 暗号化トグル
    const toggleEncryption = document.getElementById('toggle-encryption');
    if (toggleEncryption) {
        toggleEncryption.addEventListener('click', handleEncryptionToggle);
    }

    // セキュリティ設定画面読み込み時
    const observer = new MutationObserver(() => {
        if (document.getElementById('security-section').classList.contains('active')) {
            loadSecurityInfo();
        }
    });

    const securitySection = document.getElementById('security-section');
    if (securitySection) {
        observer.observe(securitySection, { attributes: true, attributeFilter: ['class'] });
    }
}

// パスワード変更処理
async function handlePasswordChange(e) {
    e.preventDefault();

    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    // 新しいパスワードの確認
    if (newPassword !== confirmPassword) {
        alert('新しいパスワードが一致しません。');
        return;
    }

    if (newPassword.length < 6) {
        alert('パスワードは6文字以上で設定してください。');
        return;
    }

    try {
        const user = authManager.getCurrentUser();
        await authManager.changePassword(user.username, currentPassword, newPassword);

        authManager.logActivity('パスワード変更');
        alert('パスワードを変更しました。');

        // フォームをクリア
        document.getElementById('change-password-form').reset();

    } catch (error) {
        alert('エラー: ' + error.message);
    }
}

// 暗号化トグル処理
function handleEncryptionToggle() {
    const isEnabled = cryptoManager.isEncryptionEnabled();

    if (isEnabled) {
        if (confirm('データ暗号化を無効化しますか？\n\n注意: データが平文で保存されるようになります。')) {
            cryptoManager.disableEncryption();
            authManager.logActivity('暗号化無効化');
            loadSecurityInfo();
            alert('データ暗号化を無効化しました。');
        }
    } else {
        if (confirm('データ暗号化を有効化しますか？\n\n注意: 有効化後は管理者パスワードが必要になります。')) {
            cryptoManager.enableEncryption();
            authManager.logActivity('暗号化有効化');
            loadSecurityInfo();
            alert('データ暗号化を有効化しました。\n\n今後はログインパスワードでデータが保護されます。');
        }
    }
}

// セキュリティ情報読み込み
function loadSecurityInfo() {
    // 暗号化ステータス
    const isEncrypted = cryptoManager.isEncryptionEnabled();
    const statusText = document.getElementById('encryption-status-text');
    const toggleBtn = document.getElementById('toggle-encryption');

    if (statusText) {
        statusText.textContent = isEncrypted ? '✓ 有効' : '✗ 無効';
        statusText.style.color = isEncrypted ? '#27ae60' : '#e74c3c';
    }

    if (toggleBtn) {
        toggleBtn.textContent = isEncrypted ? '暗号化を無効化' : '暗号化を有効化';
    }

    // セッション情報
    const user = authManager.getCurrentUser();
    if (user) {
        const loginTime = new Date(user.loginTime);
        const expiresAt = new Date(user.expiresAt);
        const remainingTime = Math.floor((user.expiresAt - Date.now()) / (1000 * 60));

        const sessionInfoDiv = document.getElementById('session-info');
        if (sessionInfoDiv) {
            sessionInfoDiv.innerHTML = `
                <p style="margin: 5px 0;"><strong>ユーザー名:</strong> ${user.username}</p>
                <p style="margin: 5px 0;"><strong>表示名:</strong> ${user.fullName}</p>
                <p style="margin: 5px 0;"><strong>権限:</strong> ${user.role === 'admin' ? '管理者' : '一般ユーザー'}</p>
                <p style="margin: 5px 0;"><strong>ログイン時刻:</strong> ${loginTime.toLocaleString('ja-JP')}</p>
                <p style="margin: 5px 0;"><strong>セッション有効期限:</strong> ${expiresAt.toLocaleString('ja-JP')}</p>
                <p style="margin: 5px 0;"><strong>残り時間:</strong> 約${remainingTime}分</p>
            `;
        }
    }
}

// ユーザー管理初期化
function initUserManagement() {
    if (!authManager.isAdmin()) return;

    const navUsers = document.getElementById('nav-users');
    if (navUsers) {
        navUsers.addEventListener('click', () => switchSection('users'));
    }

    const addUserBtn = document.getElementById('add-user');
    if (addUserBtn) {
        addUserBtn.addEventListener('click', openUserModal);
    }

    const userModal = document.getElementById('user-modal');
    if (userModal) {
        userModal.querySelector('.close').addEventListener('click', closeUserModal);
    }

    const cancelUser = document.getElementById('cancel-user');
    if (cancelUser) {
        cancelUser.addEventListener('click', closeUserModal);
    }

    const userForm = document.getElementById('user-form');
    if (userForm) {
        userForm.addEventListener('submit', handleUserSubmit);
    }

    // ユーザー管理画面読み込み時
    const observer = new MutationObserver(() => {
        if (document.getElementById('users-section').classList.contains('active')) {
            loadUsersList();
            loadActivityLogs();
        }
    });

    const usersSection = document.getElementById('users-section');
    if (usersSection) {
        observer.observe(usersSection, { attributes: true, attributeFilter: ['class'] });
    }
}

// ユーザー一覧読み込み
function loadUsersList() {
    const users = authManager.getUsers();
    const container = document.getElementById('users-list-container');

    if (!container) return;

    container.innerHTML = '';

    users.forEach(user => {
        const roleLabel = user.role === 'admin' ? '管理者' : '一般ユーザー';
        const roleColor = user.role === 'admin' ? '#e74c3c' : '#3498db';
        const lastLogin = user.lastLogin ? new Date(user.lastLogin).toLocaleString('ja-JP') : '未ログイン';

        const userDiv = document.createElement('div');
        userDiv.style.cssText = 'padding: 15px; background-color: white; border: 1px solid #ddd; border-radius: 5px; margin-bottom: 10px;';
        userDiv.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div style="flex: 1;">
                    <div style="font-weight: bold; margin-bottom: 5px;">
                        ${user.fullName}
                        <span style="background-color: ${roleColor}; color: white; padding: 2px 8px; border-radius: 3px; font-size: 11px; margin-left: 8px;">${roleLabel}</span>
                    </div>
                    <div style="font-size: 13px; color: #666;">
                        ユーザー名: ${user.username} | 最終ログイン: ${lastLogin}
                    </div>
                    <div style="font-size: 12px; color: #999; margin-top: 3px;">
                        作成日: ${new Date(user.createdAt).toLocaleString('ja-JP')}
                    </div>
                </div>
                <div style="display: flex; gap: 5px;">
                    <button class="btn-edit" onclick="editUser(${user.id})" style="padding: 5px 10px; font-size: 12px;">編集</button>
                    <button class="btn-danger" onclick="deleteUser(${user.id})" style="padding: 5px 10px; font-size: 12px;">削除</button>
                </div>
            </div>
        `;
        container.appendChild(userDiv);
    });
}

// アクティビティログ読み込み
function loadActivityLogs() {
    const logs = authManager.getActivityLogs(100);
    const container = document.getElementById('activity-logs');

    if (!container) return;

    container.innerHTML = '';

    if (logs.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">アクティビティログがありません</p>';
        return;
    }

    logs.forEach(log => {
        const timestamp = new Date(log.timestamp).toLocaleString('ja-JP');
        const details = log.details ? JSON.stringify(log.details) : '';

        const logDiv = document.createElement('div');
        logDiv.style.cssText = 'padding: 10px; background-color: #f8f9fa; border-left: 3px solid #3498db; margin-bottom: 8px; border-radius: 3px;';
        logDiv.innerHTML = `
            <div style="font-size: 12px; color: #666; margin-bottom: 3px;">${timestamp}</div>
            <div style="font-weight: bold;">${log.username} - ${log.action}</div>
            ${details ? `<div style="font-size: 12px; color: #666; margin-top: 3px;">${details}</div>` : ''}
        `;
        container.appendChild(logDiv);
    });
}

// ユーザーモーダル開く
function openUserModal() {
    const modal = document.getElementById('user-modal');
    const form = document.getElementById('user-form');

    form.reset();
    document.getElementById('user-modal-title').textContent = '新規ユーザー登録';
    document.getElementById('user-id').value = '';
    document.getElementById('password-field').style.display = 'block';

    modal.classList.add('active');
}

// ユーザーモーダル閉じる
function closeUserModal() {
    document.getElementById('user-modal').classList.remove('active');
}

// ユーザー編集
function editUser(userId) {
    const users = authManager.getUsers();
    const user = users.find(u => u.id === userId);

    if (!user) return;

    const modal = document.getElementById('user-modal');
    document.getElementById('user-modal-title').textContent = 'ユーザー編集';

    document.getElementById('user-id').value = user.id;
    document.getElementById('user-username').value = user.username;
    document.getElementById('user-username').disabled = true; // ユーザー名は変更不可
    document.getElementById('user-fullname').value = user.fullName;
    document.getElementById('user-role').value = user.role;
    document.getElementById('password-field').style.display = 'none'; // 編集時はパスワード欄を非表示

    modal.classList.add('active');
}

// ユーザー削除
async function deleteUser(userId) {
    if (!confirm('このユーザーを削除しますか？')) {
        return;
    }

    try {
        authManager.deleteUser(userId);
        authManager.logActivity('ユーザー削除', { userId });
        loadUsersList();
        alert('ユーザーを削除しました。');
    } catch (error) {
        alert('エラー: ' + error.message);
    }
}

// ユーザー登録/更新
async function handleUserSubmit(e) {
    e.preventDefault();

    const userId = document.getElementById('user-id').value;
    const username = document.getElementById('user-username').value;
    const fullName = document.getElementById('user-fullname').value;
    const password = document.getElementById('user-password').value;
    const role = document.getElementById('user-role').value;

    try {
        if (userId) {
            // 更新
            authManager.updateUser(parseInt(userId), { fullName, role });
            authManager.logActivity('ユーザー更新', { userId, fullName, role });
            alert('ユーザー情報を更新しました。');
        } else {
            // 新規登録
            if (!password || password.length < 6) {
                alert('パスワードは6文字以上で設定してください。');
                return;
            }

            await authManager.addUser({ username, password, fullName, role });
            authManager.logActivity('ユーザー登録', { username, fullName, role });
            alert('ユーザーを登録しました。');
        }

        closeUserModal();
        loadUsersList();

        // ユーザー名フィールドを再度有効化
        document.getElementById('user-username').disabled = false;

    } catch (error) {
        alert('エラー: ' + error.message);
    }
}
