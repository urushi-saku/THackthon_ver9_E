from typing import Any

from pydantic import BaseModel, Field


# フロントとbackendで共有するAPI payload の定義。
class ChatMessageRequest(BaseModel):
    user_id: str = Field(..., min_length=1, description="送信元ユーザーID")
    message: str = Field(..., min_length=1, description="送信メッセージ本文")
    # システムプロンプト生成に使う追加設定。未指定なら空辞書。
    user_settings: dict[str, Any] = Field(default_factory=dict, description="システムプロンプト生成に使う追加設定")


# バックエンドから返す会話応答の形。
class ChatMessageResponse(BaseModel):
    user_id: str = Field(..., description="送信元ユーザーID")
    message: str = Field(..., description="送信メッセージ本文")
    reply: str = Field(..., description="AIまたはバックエンドからの応答")


# 共通のステータスレスポンス。
class HealthResponse(BaseModel):
    status: str


class ConfigResponse(BaseModel):
    supabase_configured: bool
    gemini_configured: bool
    gemini_model: str