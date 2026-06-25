// 本番ビルド検証スクリプト

const fs = require('fs');
const path = require('path');

class BuildValidator {
    constructor() {
        this.errors = [];
        this.warnings = [];
        this.info = [];
    }

    // ファイル存在チェック
    checkFileExists(filePath) {
        if (!fs.existsSync(filePath)) {
            this.errors.push(`ファイルが見つかりません: ${filePath}`);
            return false;
        }
        return true;
    }

    // 必須ファイルのチェック
    checkRequiredFiles() {
        console.log('\n📁 必須ファイルのチェック...');

        const requiredFiles = [
            'index.html',
            'styles.css',
            'mobile-responsive.css',
            'app.js',
            'database.js',
            'auth.js',
            'crypto.js',
            'backup.js',
            'data-validation.js',
            'cost-management.js',
            'driver-management-advanced.js',
            'advanced-analytics.js',
            'external-integration.js',
            'delivery-advanced.js',
            'route-map.js',
            'gps-tracking.js',
            'google-maps-integration.js',
            'notification-manager.js',
            'app-gps-maps.js',
            'app-enhanced-features.js',
            'security-ui.js'
        ];

        requiredFiles.forEach(file => {
            if (this.checkFileExists(file)) {
                const stats = fs.statSync(file);
                this.info.push(`✓ ${file} (${(stats.size / 1024).toFixed(1)} KB)`);
            }
        });
    }

    // HTML内のスクリプト参照チェック
    checkScriptReferences() {
        console.log('\n🔗 スクリプト参照のチェック...');

        const html = fs.readFileSync('index.html', 'utf-8');
        const scriptMatches = html.matchAll(/<script src="([^"]+)"><\/script>/g);

        for (const match of scriptMatches) {
            const scriptPath = match[1];
            if (!this.checkFileExists(scriptPath)) {
                this.errors.push(`参照されているスクリプトが見つかりません: ${scriptPath}`);
            } else {
                this.info.push(`✓ スクリプト参照: ${scriptPath}`);
            }
        }
    }

    // CSS参照チェック
    checkCSSReferences() {
        console.log('\n🎨 CSS参照のチェック...');

        const html = fs.readFileSync('index.html', 'utf-8');
        const cssMatches = html.matchAll(/<link rel="stylesheet" href="([^"]+)">/g);

        for (const match of cssMatches) {
            const cssPath = match[1];
            if (!this.checkFileExists(cssPath)) {
                this.errors.push(`参照されているCSSが見つかりません: ${cssPath}`);
            } else {
                this.info.push(`✓ CSS参照: ${cssPath}`);
            }
        }
    }

    // グローバル変数の依存関係チェック
    checkGlobalDependencies() {
        console.log('\n🔍 グローバル変数の依存関係チェック...');

        const dependencies = {
            'data-validation.js': [],
            'cost-management.js': ['db', 'dataValidation'],
            'driver-management-advanced.js': ['db'],
            'advanced-analytics.js': ['db', 'costManagement'],
            'external-integration.js': ['db', 'dataValidation'],
            'delivery-advanced.js': ['db'],
            'route-map.js': ['deliveryAdvanced'],
            'gps-tracking.js': ['db'],
            'google-maps-integration.js': [],
            'notification-manager.js': ['db'],
            'app-gps-maps.js': ['db', 'gpsTracker', 'googleMapsManager', 'notificationManager'],
            'app-enhanced-features.js': ['db', 'advancedAnalytics', 'costManagement', 'driverManagementAdvanced', 'dataValidation', 'externalIntegration']
        };

        Object.entries(dependencies).forEach(([file, deps]) => {
            if (deps.length > 0) {
                this.info.push(`${file} は以下に依存: ${deps.join(', ')}`);
            }
        });
    }

    // ファイルサイズチェック
    checkFileSizes() {
        console.log('\n📊 ファイルサイズのチェック...');

        let totalSize = 0;
        const files = fs.readdirSync('.');

        files.forEach(file => {
            if (file.endsWith('.js') || file.endsWith('.css') || file.endsWith('.html')) {
                const stats = fs.statSync(file);
                const sizeKB = stats.size / 1024;
                totalSize += sizeKB;

                if (sizeKB > 100) {
                    this.warnings.push(`⚠️  大きなファイル: ${file} (${sizeKB.toFixed(1)} KB)`);
                }
            }
        });

        this.info.push(`総ファイルサイズ: ${totalSize.toFixed(1)} KB`);

        if (totalSize > 1000) {
            this.warnings.push('⚠️  総ファイルサイズが1MB を超えています。最適化を検討してください。');
        }
    }

    // console.log/console.errorの使用チェック
    checkConsoleUsage() {
        console.log('\n🐛 デバッグコードのチェック...');

        const jsFiles = fs.readdirSync('.').filter(f => f.endsWith('.js') && !f.includes('build-validation'));

        jsFiles.forEach(file => {
            const content = fs.readFileSync(file, 'utf-8');
            const consoleMatches = content.match(/console\.(log|error|warn|debug)/g);

            if (consoleMatches && consoleMatches.length > 5) {
                this.warnings.push(`⚠️  ${file} に多数のconsole文があります (${consoleMatches.length}個)`);
            }
        });
    }

    // HTML構文の基本チェック
    checkHTMLSyntax() {
        console.log('\n📝 HTML構文のチェック...');

        const html = fs.readFileSync('index.html', 'utf-8');

        // タグのバランスチェック
        const tags = ['div', 'section', 'form', 'table'];
        tags.forEach(tag => {
            const openCount = (html.match(new RegExp(`<${tag}[\\s>]`, 'g')) || []).length;
            const closeCount = (html.match(new RegExp(`</${tag}>`, 'g')) || []).length;

            if (openCount !== closeCount) {
                this.errors.push(`❌ <${tag}> タグが不均衡: 開始${openCount}個、閉じ${closeCount}個`);
            } else {
                this.info.push(`✓ <${tag}> タグ: ${openCount}個（バランス良好）`);
            }
        });

        // 必須メタタグのチェック
        if (!html.includes('<meta charset="UTF-8">')) {
            this.warnings.push('⚠️  charset指定が見つかりません');
        }
        if (!html.includes('<meta name="viewport"')) {
            this.warnings.push('⚠️  viewport指定が見つかりません');
        }
    }

    // localStorage使用量の推定
    estimateStorageUsage() {
        console.log('\n💾 ストレージ使用量の推定...');

        const jsFiles = fs.readdirSync('.').filter(f => f.endsWith('.js'));
        let storageKeys = new Set();

        jsFiles.forEach(file => {
            const content = fs.readFileSync(file, 'utf-8');
            const matches = content.matchAll(/localStorage\.(getItem|setItem)\(['"]([^'"]+)['"]/g);

            for (const match of matches) {
                storageKeys.add(match[2]);
            }
        });

        this.info.push(`LocalStorageキー数: ${storageKeys.size}`);
        this.info.push(`使用されているキー: ${Array.from(storageKeys).join(', ')}`);

        if (storageKeys.size > 20) {
            this.warnings.push('⚠️  LocalStorageキーが多数使用されています。整理を検討してください。');
        }
    }

    // セキュリティチェック
    checkSecurity() {
        console.log('\n🔐 セキュリティチェック...');

        const jsFiles = fs.readdirSync('.').filter(f => f.endsWith('.js') && !f.includes('build-validation'));

        jsFiles.forEach(file => {
            const content = fs.readFileSync(file, 'utf-8');

            // eval使用チェック
            if (content.includes('eval(')) {
                this.warnings.push(`⚠️  ${file} でeval()が使用されています（セキュリティリスク）`);
            }

            // innerHTML使用チェック
            const innerHTMLCount = (content.match(/innerHTML\s*=/g) || []).length;
            if (innerHTMLCount > 10) {
                this.warnings.push(`⚠️  ${file} でinnerHTMLが多用されています (${innerHTMLCount}箇所)。XSSに注意してください。`);
            }
        });
    }

    // レポート生成
    generateReport() {
        console.log('\n' + '='.repeat(60));
        console.log('📋 ビルド検証レポート');
        console.log('='.repeat(60));

        if (this.errors.length > 0) {
            console.log('\n❌ エラー:');
            this.errors.forEach(err => console.log('  ' + err));
        }

        if (this.warnings.length > 0) {
            console.log('\n⚠️  警告:');
            this.warnings.forEach(warn => console.log('  ' + warn));
        }

        if (this.info.length > 0) {
            console.log('\nℹ️  情報:');
            this.info.forEach(info => console.log('  ' + info));
        }

        console.log('\n' + '='.repeat(60));

        if (this.errors.length === 0) {
            console.log('✅ ビルド検証が成功しました！');
            console.log('🚀 本番環境にデプロイ可能です。');
        } else {
            console.log('❌ ビルド検証が失敗しました。');
            console.log('修正が必要です。');
        }

        console.log('='.repeat(60));

        return this.errors.length === 0;
    }

    // すべてのチェックを実行
    runAllChecks() {
        console.log('🔍 ビルド検証を開始します...\n');

        this.checkRequiredFiles();
        this.checkScriptReferences();
        this.checkCSSReferences();
        this.checkGlobalDependencies();
        this.checkFileSizes();
        this.checkConsoleUsage();
        this.checkHTMLSyntax();
        this.estimateStorageUsage();
        this.checkSecurity();

        return this.generateReport();
    }
}

// 実行
if (require.main === module) {
    const validator = new BuildValidator();
    const success = validator.runAllChecks();
    process.exit(success ? 0 : 1);
}

module.exports = BuildValidator;
