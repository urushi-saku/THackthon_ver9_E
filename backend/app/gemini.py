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