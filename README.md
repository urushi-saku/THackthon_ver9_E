# THackthon_ver9_E
滝沢ハッカソン第9回チームE

## 技術構成
- フロント: React + CSS (Vite)
- バックエンド: Python + FastAPI
- DB: Supabase
- AIモデル: Gemini 3.1 Flash Lite

## 環境構築

### 1) フロントエンド
```bash
cd frontend
npm install
npm run dev
```

### 2) バックエンド
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### 3) 環境変数
リポジトリ直下に `.env` を作成し、`.env.example` を参考に値を設定してください。

```bash
cp .env.example .env
```

必須項目:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `GEMINI_API_KEY`
- `GEMINI_MODEL` (デフォルト: `gemini-3.1-flash-lite`)

## 動作確認
- フロント: `http://localhost:5173`
- バックエンド: `http://localhost:8000/health`
- 設定確認: `http://localhost:8000/config`
