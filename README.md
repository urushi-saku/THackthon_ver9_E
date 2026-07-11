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
推奨: Python 3.12 か 3.13

Windows で Python 3.14 を使う場合、`pydantic-core` のビルドに `link.exe` が必要になることがあり、`pip install -r requirements.txt` が失敗する場合があります。

```bash
cd backend
python -m venv .venv
```

Windows PowerShell:
```powershell
.\.venv\Scripts\Activate.ps1
```

macOS / Linux:
```bash
source .venv/bin/activate
```

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload
```

注意: `pip install -r requirements.txt` が Python 3.14 で失敗する場合は、Python 3.12 か 3.13 の仮想環境を使ってください。`pydantic-core` が 3.14 向けの事前ビルド wheel をまだ用意できず、Windows では Rust / MSVC のビルド環境が必要になることがあります。

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
