# トラック配送管理システム

Next.js + TypeScript + Tailwind CSSで構築されたトラック配送管理アプリケーション

## 🚀 デプロイ済みアプリ

**本番環境**: https://truck-delivery-nextjs.vercel.app

## 📋 機能

### 配送管理
- ✅ カレンダー表示（日付×トラックのマトリックス）
- ✅ リスト表示（検索・フィルタリング機能）
- ✅ 配送の新規登録・編集・削除
- ✅ 検索可能なトラック・顧客選択
- ✅ 複数日にまたがる配送対応
- ✅ 複数の行先入力
- ✅ トラック空き状況の自動チェック

### トラックマスタ
- ✅ トラック情報の管理
- ✅ ステータス表示

### 顧客マスタ
- ✅ 顧客情報の管理

## ⚙️ 環境変数の設定

### 必要な環境変数

`.env.local` ファイルを作成し、以下の環境変数を設定してください：

```env
# Database Configuration
DATABASE_URL=postgresql://user:password@host:5432/database

# Application Configuration
NEXT_PUBLIC_APP_NAME=トラック配送管理システム
NEXT_PUBLIC_COMPANY_NAME=PwCIDS
```

### Neon Postgres の設定手順

1. [Neon Console](https://console.neon.tech) にアクセス
2. 新しいプロジェクトを作成
3. 接続文字列（Connection String）をコピー
4. `.env.local` の `DATABASE_URL` に貼り付け

### Vercel での環境変数設定

#### 方法1: Vercel ダッシュボード

1. [Vercel ダッシュボード](https://vercel.com/dashboard)でプロジェクトを開く
2. **Settings** → **Environment Variables** に移動
3. 以下の環境変数を追加：

| 変数名 | 値の例 | 環境 |
|--------|--------|------|
| `DATABASE_URL` | `postgresql://...` | Production, Preview, Development |
| `NEXT_PUBLIC_APP_NAME` | `トラック配送管理システム` | Production, Preview, Development |
| `NEXT_PUBLIC_COMPANY_NAME` | `PwCIDS` | Production, Preview, Development |

4. **Save** をクリック
5. **Deployments** → 最新のデプロイ → **Redeploy** で再デプロイ

#### 方法2: Vercel CLI

```bash
# 環境変数を追加
vercel env add DATABASE_URL
# 値を入力: postgresql://...
# 環境を選択: Production, Preview, Development

vercel env add NEXT_PUBLIC_APP_NAME
# 値を入力: トラック配送管理システム

vercel env add NEXT_PUBLIC_COMPANY_NAME
# 値を入力: PwCIDS

# 再デプロイ
vercel --prod
```

### データベースの初期化

データベースに初めて接続する場合、テーブルを作成する必要があります：

```bash
# 開発環境
npm run db:init

# または手動で実行
node -e "require('./lib/db').initDatabase().then(() => require('./lib/db').seedDatabase())"
```

## 💻 ローカル開発

### 前提条件

- Node.js 18.0 以降
- npm または yarn
- Neon Postgres アカウント（または PostgreSQL サーバー）

### セットアップ

```bash
# リポジトリをクローン
git clone https://github.com/PwCIDS/truck-delivery-app.git
cd truck-delivery-app

# 依存関係をインストール
npm install

# 環境変数を設定
cp .env.example .env.local
# .env.local を編集して環境変数を設定

# データベースを初期化（初回のみ）
npm run db:init

# 開発サーバーを起動
npm run dev
```

ブラウザで http://localhost:3000 を開く

### 利用可能なコマンド

```bash
# 開発サーバー起動
npm run dev

# 本番ビルド
npm run build

# 本番サーバー起動
npm start

# データベース初期化
npm run db:init

# リント
npm run lint
```

## 🚢 デプロイ

### Vercel へのデプロイ

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/PwCIDS/truck-delivery-app)

または手動で：

```bash
# Vercel CLI をインストール
npm install -g vercel

# ログイン
vercel login

# デプロイ
vercel --prod
```

## 🛠 技術スタック

- **フレームワーク**: Next.js 16.2.6
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS
- **データベース**: Neon Postgres (PostgreSQL)
- **ORM**: @neondatabase/serverless
- **デプロイ**: Vercel

## 📊 データベーススキーマ

### trucks テーブル
```sql
CREATE TABLE trucks (
  id SERIAL PRIMARY KEY,
  number VARCHAR(50) NOT NULL,
  plate VARCHAR(50) NOT NULL,
  capacity INTEGER NOT NULL,
  purchase_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'available',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### customers テーブル
```sql
CREATE TABLE customers (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(200) NOT NULL,
  address TEXT NOT NULL,
  phone VARCHAR(20) NOT NULL,
  contact VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### deliveries テーブル
```sql
CREATE TABLE deliveries (
  id SERIAL PRIMARY KEY,
  truck_id INTEGER REFERENCES trucks(id) ON DELETE RESTRICT,
  customer_id INTEGER REFERENCES customers(id) ON DELETE RESTRICT,
  start_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_date DATE NOT NULL,
  end_time TIME NOT NULL,
  destinations TEXT[] NOT NULL,
  cargo TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'scheduled',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 📝 ライセンス

MIT

## 🐛 サポート

問題が発生した場合は、[Issues](https://github.com/PwCIDS/truck-delivery-app/issues) で報告してください。
