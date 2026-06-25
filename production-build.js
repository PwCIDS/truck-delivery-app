// 本番ビルドスクリプト

const fs = require('fs');
const path = require('path');

class ProductionBuilder {
    constructor() {
        this.buildDir = 'dist';
        this.version = '3.0.0';
    }

    // ビルドディレクトリの作成
    createBuildDirectory() {
        console.log('📁 ビルドディレクトリを作成中...');

        if (fs.existsSync(this.buildDir)) {
            console.log('既存のビルドディレクトリを削除中...');
            fs.rmSync(this.buildDir, { recursive: true });
        }

        fs.mkdirSync(this.buildDir);
        console.log('✓ ビルドディレクトリを作成しました');
    }

    // ファイルのコピー
    copyFiles() {
        console.log('\n📋 ファイルをコピー中...');

        const filesToCopy = [
            'index.html',
            'styles.css',
            'mobile-responsive.css',
            'vercel.json',
            'README.md',
            'CHANGELOG.md',
            'FEATURES.md',
            'FEATURES-PART2.md'
        ];

        // JavaScriptファイル
        const jsFiles = fs.readdirSync('.').filter(f =>
            f.endsWith('.js') &&
            !f.includes('build-validation') &&
            !f.includes('production-build')
        );

        filesToCopy.push(...jsFiles);

        let copiedCount = 0;
        filesToCopy.forEach(file => {
            if (fs.existsSync(file)) {
                fs.copyFileSync(file, path.join(this.buildDir, file));
                copiedCount++;
                console.log(`  ✓ ${file}`);
            }
        });

        console.log(`\n合計 ${copiedCount} ファイルをコピーしました`);
    }

    // HTMLにバージョン情報を追加
    addVersionInfo() {
        console.log('\n📝 バージョン情報を追加中...');

        const htmlPath = path.join(this.buildDir, 'index.html');
        let html = fs.readFileSync(htmlPath, 'utf-8');

        // メタタグにバージョン情報を追加
        html = html.replace(
            '<meta name="viewport"',
            `<meta name="version" content="${this.version}">\n    <meta name="build-date" content="${new Date().toISOString()}">\n    <meta name="viewport"`
        );

        // フッターにバージョン表示を追加
        html = html.replace(
            '</body>',
            `    <!-- Version Info -->\n    <div style="position: fixed; bottom: 5px; right: 10px; font-size: 10px; color: #999; z-index: 9999;">v${this.version}</div>\n</body>`
        );

        fs.writeFileSync(htmlPath, html);
        console.log(`✓ バージョン ${this.version} を追加しました`);
    }

    // console.logを削除（本番用）
    removeConsoleLogs() {
        console.log('\n🔇 console.logを削除中（本番最適化）...');

        const jsFiles = fs.readdirSync(this.buildDir).filter(f => f.endsWith('.js'));
        let removedCount = 0;

        jsFiles.forEach(file => {
            const filePath = path.join(this.buildDir, file);
            let content = fs.readFileSync(filePath, 'utf-8');

            // console.logを削除（console.errorは残す）
            const before = content.length;
            content = content.replace(/console\.log\([^)]*\);?/g, '');
            const after = content.length;

            if (before !== after) {
                fs.writeFileSync(filePath, content);
                removedCount++;
                console.log(`  ✓ ${file} から console.log を削除`);
            }
        });

        console.log(`${removedCount} ファイルから console.log を削除しました`);
    }

    // ファイルサイズレポート
    generateSizeReport() {
        console.log('\n📊 ファイルサイズレポート:');

        const files = fs.readdirSync(this.buildDir);
        let totalSize = 0;
        const sizeData = [];

        files.forEach(file => {
            const stats = fs.statSync(path.join(this.buildDir, file));
            const sizeKB = stats.size / 1024;
            totalSize += sizeKB;

            if (file.endsWith('.js') || file.endsWith('.css') || file.endsWith('.html')) {
                sizeData.push({ file, size: sizeKB });
            }
        });

        // サイズ順にソート
        sizeData.sort((a, b) => b.size - a.size);

        console.log('\n大きいファイル順:');
        sizeData.slice(0, 10).forEach((item, index) => {
            console.log(`  ${index + 1}. ${item.file.padEnd(40)} ${item.size.toFixed(1)} KB`);
        });

        console.log(`\n総ファイルサイズ: ${totalSize.toFixed(1)} KB`);
    }

    // ビルド情報ファイルを生成
    generateBuildInfo() {
        console.log('\n📄 ビルド情報ファイルを生成中...');

        const buildInfo = {
            version: this.version,
            buildDate: new Date().toISOString(),
            buildDateJST: new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }),
            environment: 'production',
            files: fs.readdirSync(this.buildDir).filter(f =>
                f.endsWith('.js') || f.endsWith('.css') || f.endsWith('.html')
            ),
            features: [
                'GPS追跡',
                'Google Maps連携',
                'プッシュ通知',
                'ドライバー管理',
                'コスト管理',
                '高度な分析',
                'モバイル対応',
                'データ検証',
                '外部連携'
            ]
        };

        fs.writeFileSync(
            path.join(this.buildDir, 'build-info.json'),
            JSON.stringify(buildInfo, null, 2)
        );

        console.log('✓ build-info.json を生成しました');
    }

    // デプロイ手順書を生成
    generateDeploymentGuide() {
        console.log('\n📖 デプロイ手順書を生成中...');

        const guide = `# デプロイ手順書

## バージョン: ${this.version}
## ビルド日時: ${new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}

---

## 📦 ビルド内容

このビルドには以下が含まれています：

- ✅ すべてのJavaScriptファイル（最適化済み）
- ✅ CSSファイル（モバイル対応含む）
- ✅ HTMLファイル
- ✅ 設定ファイル（vercel.json）
- ✅ ドキュメント

---

## 🚀 デプロイ方法

### 方法1: Vercel（推奨）

\`\`\`bash
# Vercelにデプロイ
cd dist
vercel --prod
\`\`\`

### 方法2: Netlify

\`\`\`bash
# Netlifyにデプロイ
cd dist
netlify deploy --prod --dir .
\`\`\`

### 方法3: 静的ホスティング

\`dist\` ディレクトリの内容を以下にアップロード：
- GitHub Pages
- AWS S3 + CloudFront
- Firebase Hosting
- その他の静的ホスティングサービス

---

## ⚙️ 環境設定

### Google Maps APIキー（オプション）

本番環境でGoogle Maps機能を使用する場合：

1. アプリを起動
2. 統計・レポート画面を開く
3. 「🔑 Google Maps APIキー設定」をクリック
4. APIキーを入力して保存

### 外部連携設定（オプション）

Webhook、メール通知を使用する場合：

1. アプリを起動
2. 統計・レポート画面を開く
3. 「🔗 外部連携設定」をクリック
4. 必要な設定を入力

---

## 🔒 セキュリティ

### HTTPSの使用

本番環境では必ずHTTPSを使用してください：
- 通知機能の動作に必要
- GPS機能の動作に必要
- データの暗号化に推奨

### APIキーの管理

- APIキーは環境変数で管理することを推奨
- 公開リポジトリにAPIキーを含めない
- 定期的にAPIキーをローテーション

---

## 📊 パフォーマンス

### 最適化済み項目

- ✅ console.log削除（本番用）
- ✅ ファイル構造の最適化
- ✅ 依存関係の整理

### 推奨設定

- CDN経由での配信
- Gzip/Brotli圧縮の有効化
- キャッシュヘッダーの設定

---

## 🐛 トラブルシューティング

### 通知が動作しない

原因: HTTPSが使用されていない、またはブラウザの権限が許可されていない

対策:
1. HTTPSでアクセスしているか確認
2. ブラウザの通知権限を確認
3. 統計・レポート画面で「🔓 通知権限リクエスト」をクリック

### GPS追跡が動作しない

原因: 位置情報サービスが無効

対策:
1. デバイスの位置情報サービスを有効化
2. ブラウザの位置情報権限を許可
3. シミュレーションモードを使用

### 地図が表示されない

原因: Google Maps APIキーが未設定または無効

対策:
1. APIキーを設定
2. APIキーの制限を確認
3. 必要なAPIが有効化されているか確認

---

## 📞 サポート

問題が発生した場合：

1. \`build-info.json\` でバージョンを確認
2. ブラウザのコンソールでエラーを確認
3. LocalStorageをクリアして再試行

---

## 📝 変更履歴

詳細は \`CHANGELOG.md\` を参照してください。

---

生成日時: ${new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}
`;

        fs.writeFileSync(path.join(this.buildDir, 'DEPLOYMENT.md'), guide);
        console.log('✓ DEPLOYMENT.md を生成しました');
    }

    // ビルド実行
    build() {
        console.log('🏗️  本番ビルドを開始します...\n');
        console.log('='.repeat(60));

        try {
            this.createBuildDirectory();
            this.copyFiles();
            this.addVersionInfo();
            this.removeConsoleLogs();
            this.generateSizeReport();
            this.generateBuildInfo();
            this.generateDeploymentGuide();

            console.log('\n' + '='.repeat(60));
            console.log('✅ ビルドが完了しました！');
            console.log('='.repeat(60));
            console.log(`\n📦 ビルド出力: ${path.resolve(this.buildDir)}`);
            console.log('\n🚀 デプロイ手順:');
            console.log('  1. cd dist');
            console.log('  2. vercel --prod  または  netlify deploy --prod');
            console.log('\n📖 詳細: dist/DEPLOYMENT.md を参照してください\n');

            return true;
        } catch (error) {
            console.error('\n❌ ビルドエラー:', error.message);
            return false;
        }
    }
}

// 実行
if (require.main === module) {
    const builder = new ProductionBuilder();
    const success = builder.build();
    process.exit(success ? 0 : 1);
}

module.exports = ProductionBuilder;
