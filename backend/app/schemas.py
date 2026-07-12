from typing import Any

from pydantic import BaseModel, Field


# フロントとbackendで共有するAPI payload の定義。
class ChatMessageRequest(BaseModel):
    user_id: str = Field(..., min_length=1, description="送信元ユーザーID")
    message: str = Field(..., min_length=1, description="送信メッセージ本文")
    # システムプロンプト生成に使う追加設定。未指定なら空辞書。
    user_settings: dict[str, Any] = Field(default_factory=dict, description="システムプロンプト生成に使う追加設定")


# AIが会話から抽出した口コミ情報のスキーマ。
class ExtractedReview(BaseModel):
    course_name: str = Field(..., description="講義名")
    review_content: str = Field(..., description="口コミ内容")
    category: str = Field(..., description="口コミのカテゴリ (例: 試験対策, 課題, 楽単情報)")


# バックエンドから返す会話応答の形。
class ChatMessageResponse(BaseModel):
    user_id: str = Field(..., description="送信元ユーザーID")
    message: str = Field(..., description="送信メッセージ本文")
    reply: str = Field(..., description="AIまたはバックエンドからの応答")
    is_katsu: bool = Field(default=False, description="喝モードでの応答かどうか")
    # 口コミが抽出されなかった場合は null になる。
    extracted_review: ExtractedReview | None = Field(default=None, description="抽出された口コミ情報")


# 共通のステータスレスポンス。
class HealthResponse(BaseModel):
    status: str


class ConfigResponse(BaseModel):
    supabase_configured: bool
    gemini_configured: bool
    gemini_model: str