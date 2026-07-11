from __future__ import annotations

import json
from collections.abc import Mapping
from typing import Any


def _format_setting_value(value: Any) -> str:
    # プロンプトに埋め込みやすい文字列へ正規化する。
    if value is None:
        return ""
    if isinstance(value, str):
        return value.strip()
    if isinstance(value, (int, float, bool)):
        return str(value)
    if isinstance(value, Mapping):
        return json.dumps(value, ensure_ascii=False, indent=2)
    if isinstance(value, (list, tuple, set)):
        return json.dumps(list(value), ensure_ascii=False, indent=2)
    return str(value).strip()


def _append_section(lines: list[str], title: str, value: Any) -> None:
    # 値がある項目だけをセクションとして追加する。
    formatted = _format_setting_value(value)
    if formatted:
        lines.extend([f"## {title}", formatted, ""])


def build_system_prompt(user_settings: dict[str, Any]) -> str:
    """user_settings をもとに、LLMへ渡すシステムプロンプトを生成する。"""

    # 未知の入力でも壊れないように、まず辞書へ固定する。
    settings = dict(user_settings or {})
    lines: list[str] = [
        "あなたは THackthon Team E のアシスタントです。",
        "指示は簡潔かつ正確に守り、必要以上に推測しないでください。",
        "出力はユーザー設定に従い、わかりやすく、再利用しやすい形に整えてください。",
        "",
    ]

    _append_section(lines, "基本方針", settings.get("system_policy"))
    _append_section(lines, "役割", settings.get("persona") or settings.get("role"))
    _append_section(lines, "目的", settings.get("goal") or settings.get("task"))
    _append_section(lines, "文体", settings.get("tone") or settings.get("style"))
    _append_section(lines, "言語", settings.get("language"))
    _append_section(lines, "制約", settings.get("constraints") or settings.get("rules"))
    _append_section(lines, "出力形式", settings.get("output_format") or settings.get("format"))
    _append_section(lines, "参考コンテキスト", settings.get("context") or settings.get("notes"))

    custom_instructions = settings.get("custom_instructions")
    if custom_instructions:
        _append_section(lines, "追加指示", custom_instructions)

    # 定義済み項目以外も、必要ならまとめて追記できるように残す。
    metadata = {key: value for key, value in settings.items() if key not in {
        "system_policy",
        "persona",
        "role",
        "goal",
        "task",
        "tone",
        "style",
        "language",
        "constraints",
        "rules",
        "output_format",
        "format",
        "context",
        "notes",
        "custom_instructions",
    }}
    if metadata:
        _append_section(lines, "その他の設定", metadata)

    lines.append("必要な情報が足りない場合は、推測で埋めずに不足点を短く確認してください。")
    return "\n".join(lines).strip()