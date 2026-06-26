"""FastAPI 入口 — 今天吃什么 后端服务"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import CORS_ORIGINS
from app.database import engine
from app.models import Base
from app.routers import analyze, sync, backup

Base.metadata.create_all(bind=engine)

app = FastAPI(title="今天吃什么 API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health():
    return {"status": "ok"}

app.include_router(analyze.router, prefix="/api", tags=["分析"])
app.include_router(sync.router, prefix="/api", tags=["同步"])
app.include_router(backup.router, prefix="/api", tags=["备份"])
