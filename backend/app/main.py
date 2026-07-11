import os
from datetime import datetime
from typing import Annotated
from uuid import UUID

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from google import genai
from pydantic import BaseModel, ConfigDict, Field
from supabase import Client, create_client

# リポジトリ直下の .env から、外部サービスの接続情報を読み込む。
load_dotenv()

# 環境変数は起動時に一度だけ取得する。
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
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
    allow_origins=FRONTEND_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# service_roleキーはRLSを回避できるため、バックエンド内だけで使用する。
# 未設定の場合は、開発用としてanonキーへフォールバックする。
supabase: Client | None = None
supabase_key = SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY
if SUPABASE_URL and supabase_key:
    supabase = create_client(SUPABASE_URL, supabase_key)

gemini_client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None


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
