from fastapi import FastAPI

from .config import settings

app = FastAPI(title="Scaffold API", version="0.1.0")


@app.get("/health")
def health() -> dict:
    return {
        "status": "ok",
        "llm_model": settings.llm_model,
        "llm_base_url": settings.llm_base_url,
    }
