import logging
import json
import os
from datetime import datetime
from pathlib import Path
from typing import Annotated
from urllib.parse import urlparse
from uuid import UUID

from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, HTTPException, Query, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from google import genai
from pydantic import BaseModel, ConfigDict, Field
from supabase import Client, create_client

from app.gemini import GeminiGenerationError, generate_gemini_file_summary, generate_gemini_reply, generate_gemini_reply_with_file
from app.schemas import ChatMessageRequest, ChatMessageResponse

logger = logging.getLogger(__name__)

# リポジトリ直下の .env から、外部サービスの接続情報を読み込む。
BASE_DIR = Path(__file__).resolve().parents[2]
load_dotenv(BASE_DIR / ".env")


def _looks_like_placeholder(value: str | None) -> bool:
    if not value:
        return True

    cleaned = value.strip().lower()
    if not cleaned:
        return True

    placeholders = {
        "supabaseのproject url",
        "supabaseのanon key",
        "your-project-url",
        "your-anon-key",
        "your_supabase_url",
        "your_supabase_anon_key",
        "changeme",
        "replace-me",
    }
    return cleaned in placeholders or cleaned.startswith("supabaseの") or "your-project" in cleaned or "your-anon" in cleaned


def _is_valid_supabase_url(value: str | None) -> bool:
    if not value or _looks_like_placeholder(value):
        return False

    try:
        parsed = urlparse(value)
    except Exception:
        return False

    return parsed.scheme in {"http", "https"} and bool(parsed.netloc)


# 環境変数は起動時に一度だけ取得する。
SUPABASE_URL = (os.getenv("SUPABASE_URL") or "").strip()
SUPABASE_ANON_KEY = (os.getenv("SUPABASE_ANON_KEY") or "").strip()
SUPABASE_SERVICE_ROLE_KEY = (os.getenv("SUPABASE_SERVICE_ROLE_KEY") or "").strip()
GEMINI_API_KEY = (os.getenv("GEMINI_API_KEY") or "").strip()
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.1-flash-lite")
FRONTEND_ORIGINS = [
    origin.strip()
    for origin in os.getenv("FRONTEND_ORIGINS", "http://localhost:5173").split(",")
    if origin.strip()
]

app = FastAPI(title="THackthon Team E API")

# ブラウザ上のフロントエンドからAPIを呼び出せるようにする。
# 本番環境では FRONTEND_ORIGINS にデプロイ先のURLを指定する。
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # ハッカソン中は一時的にすべて許可
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# service_roleキーはRLSを回避できるため、バックエンド内だけで使用する。
# 未設定の場合は、開発用としてanonキーへフォールバックする。
supabase: Client | None = None
supabase_key = (SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY).strip()
if _is_valid_supabase_url(SUPABASE_URL) and supabase_key and not _looks_like_placeholder(supabase_key):
    try:
        supabase = create_client(SUPABASE_URL, supabase_key)
    except Exception as exc:
        logger.warning("Failed to initialize Supabase client: %s", exc)
        supabase = None
else:
    logger.info("Supabase client is disabled because configuration is missing or invalid")

# Gemini も API キーがある場合のみクライアントを作る。
gemini_client = (
    genai.Client(api_key=GEMINI_API_KEY)
    if GEMINI_API_KEY and not _looks_like_placeholder(GEMINI_API_KEY)
    else None
)


class UserCreate(BaseModel):
    """ユーザープロフィール登録時のリクエスト形式。"""

    # idにはSupabase Authがユーザー登録時に発行したUUIDを指定する。
    id: UUID
    display_name: Annotated[str, Field(min_length=1, max_length=50)]
    university: Annotated[str | None, Field(max_length=100)] = None
    department: Annotated[str | None, Field(max_length=100)] = None
    grade: Annotated[int | None, Field(ge=1, le=6)] = None


class UserUpdate(BaseModel):
    """プロフィール更新時のリクエスト形式。指定された項目だけ更新する。"""

    display_name: Annotated[str | None, Field(min_length=1, max_length=50)] = None
    university: Annotated[str | None, Field(max_length=100)] = None
    department: Annotated[str | None, Field(max_length=100)] = None
    grade: Annotated[int | None, Field(ge=1, le=6)] = None


class User(UserCreate):
    """APIから返すユーザープロフィール。"""

    model_config = ConfigDict(from_attributes=True)

    created_at: datetime
    updated_at: datetime


class ReviewCreate(BaseModel):
    """口コミ投稿時のリクエスト形式。"""

    course_id: Annotated[str, Field(min_length=1, max_length=100)]
    user_id: UUID
    rating: Annotated[int, Field(ge=1, le=5)]
    content: Annotated[str, Field(min_length=1, max_length=2000)]


class Review(ReviewCreate):
    """APIから返す口コミ。DBが生成したIDと日時を含む。"""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime
    updated_at: datetime


def get_supabase() -> Client:
    """Supabaseクライアントを返し、未設定なら503エラーにする。"""

    if supabase is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Supabase is not configured",
        )
    return supabase


@app.get("/health")
def health_check() -> dict[str, str]:
    """サーバーが起動しているか確認するためのヘルスチェック。"""

    return {"status": "ok"}


@app.get("/config")
def config_status() -> dict[str, str | bool | list[str]]:
    """秘密値を公開せず、外部サービスの設定状態だけを返す。"""

    return {
        "supabase_configured": bool(supabase),
        "supabase_service_role_configured": bool(SUPABASE_SERVICE_ROLE_KEY),
        "gemini_configured": bool(gemini_client),
        "gemini_model": GEMINI_MODEL,
        "frontend_origins": FRONTEND_ORIGINS,
    }


@app.post("/chat", response_model=ChatMessageResponse)
def create_chat_reply(request: ChatMessageRequest) -> ChatMessageResponse:
    """ぽけ先輩のシステムプロンプトを使って相談へ回答する。"""

    if gemini_client is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Gemini is not configured",
        )

    try:
        reply = generate_gemini_reply(
            client=gemini_client,
            model=GEMINI_MODEL,
            user_message=request.message,
            user_settings=request.user_settings,
        )
    except GeminiGenerationError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Gemini chat generation failed")
        raise HTTPException(status_code=502, detail="Failed to generate chat reply") from exc

    return ChatMessageResponse(
        user_id=request.user_id,
        message=request.message,
        reply=reply,
    )


@app.post("/chat/with-file", response_model=ChatMessageResponse)
async def create_chat_reply_with_file(
    user_id: Annotated[str, Form(min_length=1)],
    message: Annotated[str, Form(min_length=1)],
    user_settings: Annotated[str, Form()] = "{}",
    attachment: UploadFile = File(...),
) -> ChatMessageResponse:
    """添付ファイル本体をGeminiへ渡して相談へ回答する。"""

    if gemini_client is None:
        raise HTTPException(status_code=503, detail="Gemini is not configured")

    mime_type = attachment.content_type or "application/octet-stream"
    supported = (
        mime_type == "application/pdf"
        or mime_type in {"text/plain", "text/markdown"}
        or mime_type.startswith("image/")
        or mime_type.startswith("audio/")
    )
    if not supported:
        raise HTTPException(status_code=415, detail="Unsupported file type")

    file_data = await attachment.read(10 * 1024 * 1024 + 1)
    if len(file_data) > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File size must be 10MB or less")
    if not file_data:
        raise HTTPException(status_code=400, detail="The attached file is empty")

    try:
        settings = json.loads(user_settings)
        if not isinstance(settings, dict):
            raise ValueError
    except (json.JSONDecodeError, ValueError) as exc:
        raise HTTPException(status_code=400, detail="Invalid user_settings") from exc

    try:
        reply = generate_gemini_reply_with_file(
            client=gemini_client,
            model=GEMINI_MODEL,
            user_message=message,
            file_data=file_data,
            mime_type=mime_type,
            user_settings=settings,
        )
    except GeminiGenerationError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Gemini file chat generation failed")
        raise HTTPException(status_code=502, detail="Failed to analyze attached file") from exc

    return ChatMessageResponse(user_id=user_id, message=message, reply=reply)


@app.post("/summary")
async def create_lecture_summary(attachment: UploadFile = File(...)) -> dict[str, str]:
    """PDFまたは音声の内容を、会話調ではない講義要約に変換する。"""

    if gemini_client is None:
        raise HTTPException(status_code=503, detail="Gemini is not configured")

    mime_type = attachment.content_type or "application/octet-stream"
    if mime_type != "application/pdf" and not mime_type.startswith("audio/"):
        raise HTTPException(status_code=415, detail="PDFまたは音声ファイルを選択してください")

    file_data = await attachment.read(10 * 1024 * 1024 + 1)
    if len(file_data) > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="ファイルサイズは10MB以下にしてください")
    if not file_data:
        raise HTTPException(status_code=400, detail="ファイルが空です")

    try:
        summary = generate_gemini_file_summary(
            client=gemini_client,
            model=GEMINI_MODEL,
            file_data=file_data,
            mime_type=mime_type,
        )
    except GeminiGenerationError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Gemini lecture summary failed")
        raise HTTPException(status_code=502, detail="講義を要約できませんでした") from exc

    return {"filename": attachment.filename or "添付ファイル", "summary": summary}


@app.get("/reviews", response_model=list[Review])
def get_reviews(
    course_id: str | None = None,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> list[dict]:
    """口コミを新しい順で取得する。course_idを渡すと講義別に絞り込む。"""

    client = get_supabase()
    try:
        # まず全口コミを対象とするクエリを作り、必要な場合だけ条件を追加する。
        query = client.table("reviews").select("*")
        if course_id:
            query = query.eq("course_id", course_id)
        response = (
            query.order("created_at", desc=True)
            # Supabaseのrangeは終端を含むため、件数から1を引く。
            .range(offset, offset + limit - 1)
            .execute()
        )
        return response.data
    except Exception as exc:
        raise HTTPException(status_code=502, detail="Failed to fetch reviews") from exc


@app.post("/reviews", response_model=Review, status_code=status.HTTP_201_CREATED)
def create_review(review: ReviewCreate) -> dict:
    """入力値を検証してから口コミを1件登録する。"""

    client = get_supabase()
    try:
        response = (
            client.table("reviews")
            .insert(review.model_dump(mode="json"))
            .execute()
        )
        if not response.data:
            raise RuntimeError("Supabase returned no review")
        return response.data[0]
    except Exception as exc:
        raise HTTPException(status_code=502, detail="Failed to create review") from exc


@app.post("/users", response_model=User, status_code=status.HTTP_201_CREATED)
def create_user(user: UserCreate) -> dict:
    """Supabase AuthのIDに対応するプロフィールを登録する。"""

    client = get_supabase()
    try:
        response = client.table("users").insert(user.model_dump(mode="json")).execute()
        if not response.data:
            raise RuntimeError("Supabase returned no user")
        return response.data[0]
    except Exception as exc:
        raise HTTPException(status_code=502, detail="Failed to create user") from exc


@app.patch("/users/{user_id}", response_model=User)
def update_user(user_id: UUID, user: UserUpdate) -> dict:
    """指定されたユーザーのプロフィールを部分更新する。"""

    # exclude_unset=Trueにより、リクエストに含まれなかった項目を上書きしない。
    updates = user.model_dump(mode="json", exclude_unset=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")

    client = get_supabase()
    try:
        response = (
            client.table("users")
            .update(updates)
            .eq("id", str(user_id))
            .execute()
        )
        if not response.data:
            raise HTTPException(status_code=404, detail="User not found")
        return response.data[0]
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=502, detail="Failed to update user") from exc
