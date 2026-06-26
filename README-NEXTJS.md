# Truck Delivery Management System - Next.js Version

トラック配送管理システムのNext.js実装版です。

## 🚀 機能

- 📦 配送管理
- 🚚 トラック管理
- 👥 顧客管理
- 📍 GPS追跡
- 📊 レポート・分析
- ⚙️ システム設定
- 🔐 認証システム

## 🛠️ 技術スタック

- **フレームワーク**: Next.js 15
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS
- **UI**: React 18
- **デプロイ**: Vercel

## 📋 必要要件

- Node.js 18以上
- npm または yarn

## 🔧 セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.local`ファイルを作成:

```bash
cp .env.example .env.local
```

### 3. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開きます。

## 📦 ビルド

本番用ビルドの作成:

```bash
npm run build
```

ビルドの起動:

```bash
npm start
```

## 🔐 デフォルトアカウント

- **管理者**: 
  - ユーザー名: `admin`
  - パスワード: `admin123`

- **一般ユーザー**: 
  - ユーザー名: `user`
  - パスワード: `user123`

## 📁 プロジェクト構成

```
truck-delivery-nextjs/
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
├── lib/
├── public/
├── backend/
│   ├── routers/
│   ├── auth.py
│   ├── config.py
│   ├── database.py
│   ├── models.py
│   └── schemas.py
├── .env.example
├── .env.local
├── next.config.ts
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

## 🚀 Vercelへのデプロイ

1. GitHubリポジトリにプッシュ
2. [Vercel](https://vercel.com)にインポート
3. 自動デプロイが開始されます

または、Vercel CLIを使用:

```bash
npm install -g vercel
vercel
```

## 📝 開発ガイドライン

### コンポーネントの追加

`components/`ディレクトリに新しいコンポーネントを作成:

```tsx
// components/MyComponent.tsx
export default function MyComponent() {
  return <div>My Component</div>;
}
```

### ページの追加

`app/`ディレクトリに新しいルートを作成:

```tsx
// app/deliveries/page.tsx
export default function DeliveriesPage() {
  return <div>Deliveries Page</div>;
}
```

### APIルートの追加

`app/api/`ディレクトリにAPIルートを作成:

```tsx
// app/api/deliveries/route.ts
export async function GET() {
  return Response.json({ deliveries: [] });
}
```

## 🔧 トラブルシューティング

### ポートが既に使用されている

```bash
# 別のポートで起動
PORT=3001 npm run dev
```

### ビルドエラー

```bash
# キャッシュをクリア
rm -rf .next
npm run build
```

## 📄 ライセンス

MIT

## 🤝 貢献

プルリクエストを歓迎します。大きな変更の場合は、まずissueを開いて変更内容を議論してください。
