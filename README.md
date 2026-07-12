# ぽけ先輩 - 先輩の知恵を、ポケットに。

「ぽけ先輩」は、大学生活を送る学生のためのAIチャットボットアプリケーションです。
履修登録、課題、テスト対策など、大学生活のあらゆる悩みを、頼れる先輩としてサポートします。

## ✨ コンセプト

**『先輩の知恵を、ポケットに。』**

このアプリケーションは、単に答えを教えるAIではありません。
先輩たちのリアルな体験談や大学の講義情報（口コミ）を学習し、学生が自ら考え、行動し、成長できるよう、そっと背中を押すことを目指しています。

## 🚀 主な機能

- **AI先輩とのチャット**: いつでも気軽に大学生活の相談ができます。
- **口コミの自動収集**: 学生がチャットで話した有益な情報（楽単情報、テスト対策など）を自動で抽出し、データベースに蓄積します。
- **講義資料の要約**: PDFや音声形式の講義資料をアップロードすると、AIが内容を要約します。
- **口コミ掲示板**: 講義ごとの口コミを閲覧・投稿できます。
- **ユーザープロフィール**: 大学や学部情報を登録できます。

## 🛠️ 技術スタック

| カテゴリ       | 技術                                                              |
| -------------- | ----------------------------------------------------------------- |
| **フロントエンド** | React, Vite, TypeScript, Tailwind CSS, react-router-dom           |
| **バックエンド**   | Python, FastAPI, Uvicorn                                          |
| **AI**           | Google Gemini API                                                 |
| **データベース**   | Supabase (PostgreSQL)                                             |
| **認証**         | Firebase Authentication                                           |
| **デプロイ**     | Vercel (Frontend), Render (Backend)                               |

## 🔧 環境構築

### 1. 前提条件

- [Node.js](https://nodejs.org/) (v20.x 以上)
- [Python](https://www.python.org/) (v3.11 以上)

### 2. リポジトリのクローン

```bash
git clone https://github.com/your-username/your-repository-name.git
cd your-repository-name
```

### 3. 環境変数の設定

プロジェクトのルートディレクトリに `.env` ファイルを作成し、以下の内容を参考に設定してください。
バックエンド用に、プロジェクトのルートディレクトリに `.env` ファイルを作成します。

```ini
# .env.example

# SupabaseのプロジェクトURLとAnon Key
# Supabaseの管理画面 > Project Settings > API で確認できます
SUPABASE_URL="https://xxxxxxxx.supabase.co"
SUPABASE_ANON_KEY="your-anon-key"

# バックエンドでRLSをバイパスするためのキー (任意)
# Supabaseの管理画面 > Project Settings > API > Project API keys の service_role を設定
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Google AI Studioで取得したAPIキー
# <https://aistudio.google.com/app/apikey>
# https://aistudio.google.com/app/apikey
GEMINI_API_KEY="your-gemini-api-key"

# 使用するGeminiのモデル名 (任意、デフォルト: gemini-1.5-flash-latest)
GEMINI_MODEL="gemini-1.5-flash-latest"

# CORSを許可するフロントエンドのオリジン (任意、デフォルト: http://localhost:5173)
# 複数ある場合はカンマ区切りで指定
FRONTEND_ORIGINS="http://localhost:5173,https://your-deployed-frontend.com"
```

### 4. データベースのセットアップ

Supabaseプロジェクトの管理画面にある `SQL Editor` で、以下のSQLを実行してテーブルを作成します。

<details>
<summary>テーブル作成用SQL</summary>

```sql
-- users テーブル
CREATE TABLE public.users (
  id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  display_name character varying(50) NOT NULL,
  university character varying(100),
  department character varying(100),
  grade smallint,
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_grade_check CHECK (((grade >= 1) AND (grade <= 6)))
);
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- reviews テーブル
CREATE TABLE public.reviews (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  user_id uuid,
  course_id text,
  course_name text,
  rating smallint,
  content text,
  category text,
  CONSTRAINT reviews_pkey PRIMARY KEY (id),
  CONSTRAINT reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL,
  CONSTRAINT reviews_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
```

</details>

### 5. バックエンドの起動

```bash
# backendディレクトリに移動
cd backend

# 依存パッケージのインストール
pip install -r requirements.txt

# サーバーの起動
uvicorn app.main:app --reload
```

### 6. フロントエンドの起動

```bash
# frontendディレクトリに移動
cd frontend

# 依存パッケージのインストール
npm install

# 開発サーバーの起動
npm run dev
```

これで、 `http://localhost:5173` でアプリケーションにアクセスできます。
