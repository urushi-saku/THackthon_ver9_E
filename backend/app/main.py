import os

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from google import genai
from supabase import Client, create_client

from app.gemini import GeminiGenerationError, generate_gemini_reply
from app.schemas import ChatMessageRequest, ChatMessageResponse, ConfigResponse, HealthResponse

load_dotenv()

app = FastAPI(title="THackthon Team E API")

# 環境変数から外部サービスの設定を読み込む。
SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_ANON_KEY = os.environ.get("SUPABASE_ANON_KEY") or os.environ.get("SUPABASE_KEY", "")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.1-flash-lite")

# Supabase は本番・ローカルともに環境変数から初期化する。
supabase: Client | None = None
if SUPABASE_URL and SUPABASE_ANON_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

# Gemini も API キーがある場合のみクライアントを作る。
gemini_client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None


@app.get("/health")
def health_check() -> HealthResponse:
    return {"status": "ok"}


@app.get("/config")
def config_status() -> ConfigResponse:
    return {
        "supabase_configured": bool(supabase),
        "gemini_configured": bool(gemini_client),
        "gemini_model": GEMINI_MODEL,
    }


@app.post("/chat", response_model=ChatMessageResponse)
def chat(payload: ChatMessageRequest) -> ChatMessageResponse:
    if not gemini_client:
        raise HTTPException(status_code=503, detail="GEMINI_API_KEY が設定されていません。")

    # システムプロンプト生成に使う設定へ user_id を補完する。
    user_settings = dict(payload.user_settings)
    user_settings["user_id"] = payload.user_id

    try:
        # 組み立てたシステムプロンプトとユーザー文を Gemini に渡す。
        reply = generate_gemini_reply(
            client=gemini_client,
            model=GEMINI_MODEL,
            user_message=payload.message,
            user_settings=user_settings,
        )
    except GeminiGenerationError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    return ChatMessageResponse(user_id=payload.user_id, message=payload.message, reply=reply)
