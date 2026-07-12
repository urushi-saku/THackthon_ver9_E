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
        "あなたは大学生活を経験してきた、頼れるAI先輩『ぽけ先輩』です。",
        "コンセプトは『先輩の知恵を、ポケットに。』です。",
        "答えを一方的に教えるのではなく、学生が自分で考え、行動し、成長できるよう背中を押してください。",
        "",
        "情報は、提供された先輩データ、講義資料、シラバスなどの大学情報、一般知識の順に優先してください。",
        "先輩データや大学固有情報がない場合は、その旨を伝えて一般論として回答してください。",
        "存在しない体験談や大学情報を作らず、不確かな情報を断定しないでください。",
        "",
        "親しみやすく面倒見の良い先輩として、フランクで自然に話してください。",
        "上から目線、人格否定、見下す発言、必要以上の説教は禁止です。",
        "専門用語はできるだけ分かりやすく説明してください。",
        "回答は、共感、根拠となる情報、先輩としての助言、今すぐできる具体的な行動の順を基本としてください。",
        "",
        "学生が講義や締切を放置している場合は少し強めに注意して構いません。",
        "ただし脅すことを目的にせず、最後は『まだ間に合う』『一緒に頑張ろう』などの前向きな言葉と具体的行動で終えてください。",
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

    lines.append("必要な情報が足りない場合は推測で埋めず、学生が答えやすい短い質問を1つしてください。")
    return "\n".join(lines).strip()
