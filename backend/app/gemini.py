from __future__ import annotations

from typing import Any

from google import genai
from google.genai import types

from app.prompt import build_system_prompt


class GeminiGenerationError(RuntimeError):
    pass


def generate_gemini_reply(
    client: genai.Client,
    model: str,
    user_message: str,
    user_settings: dict[str, Any] | None = None,
) -> str:
    # user_settings からシステムプロンプトを組み立てる。
    system_prompt = build_system_prompt(user_settings or {})

    # Google GenAI の model 呼び出しで本文と systemInstruction を渡す。
    response = client.models.generate_content(
        model=model,
        contents=user_message,
        config=types.GenerateContentConfig(systemInstruction=system_prompt),
    )

    # 返答本文が空なら呼び出し失敗として扱う。
    reply = (response.text or "").strip()
    if not reply:
        raise GeminiGenerationError("Gemini から応答を取得できませんでした。")

    return reply


def generate_gemini_reply_with_file(
    client: genai.Client,
    model: str,
    user_message: str,
    file_data: bytes,
    mime_type: str,
    user_settings: dict[str, Any] | None = None,
) -> str:
    """質問文と添付ファイル本体をGeminiへまとめて渡す。"""

    system_prompt = build_system_prompt(user_settings or {})
    contents = types.Content(
        role="user",
        parts=[
            types.Part.from_text(text=user_message),
            types.Part.from_bytes(data=file_data, mime_type=mime_type),
        ],
    )
    response = client.models.generate_content(
        model=model,
        contents=contents,
        config=types.GenerateContentConfig(systemInstruction=system_prompt),
    )

    reply = (response.text or "").strip()
    if not reply:
        raise GeminiGenerationError("Gemini から応答を取得できませんでした。")
    return reply


def generate_gemini_file_summary(
    client: genai.Client,
    model: str,
    file_data: bytes,
    mime_type: str,
) -> str:
    """講義資料・音声を会話調にせず、構造化された要約へ変換する。"""

    system_prompt = """あなたは大学講義資料の要約アシスタントです。
キャラクターや先輩の口調は使わず、資料の内容だけを客観的かつ簡潔に整理してください。
資料にない情報を補ったり推測したりしないでください。
Markdownで、次の構成を基本に日本語で出力してください。
## 講義の概要
## 重要ポイント
## 覚えるべき用語
## 復習するとよいこと
該当情報がない項目は「資料内に記載なし」としてください。"""
    contents = types.Content(
        role="user",
        parts=[
            types.Part.from_text(text="添付された講義資料または講義音声を要約してください。"),
            types.Part.from_bytes(data=file_data, mime_type=mime_type),
        ],
    )
    response = client.models.generate_content(
        model=model,
        contents=contents,
        config=types.GenerateContentConfig(systemInstruction=system_prompt),
    )

    summary = (response.text or "").strip()
    if not summary:
        raise GeminiGenerationError("Gemini から要約を取得できませんでした。")
    return summary
