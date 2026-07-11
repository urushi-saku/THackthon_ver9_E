import os

from dotenv import load_dotenv
from fastapi import FastAPI
from google import genai
from supabase import Client, create_client

load_dotenv()

app = FastAPI(title="THackthon Team E API")

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.1-flash-lite")

supabase: Client | None = None
if SUPABASE_URL and SUPABASE_ANON_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

gemini_client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/config")
def config_status() -> dict[str, str | bool]:
    return {
        "supabase_configured": bool(supabase),
        "gemini_configured": bool(gemini_client),
        "gemini_model": GEMINI_MODEL,
    }
