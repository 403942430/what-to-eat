"""Pydantic 请求/响应模型"""
from pydantic import BaseModel, Field
from typing import Optional

class AnalyzeRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=2000, description="评论文本")
    user_token: str = Field("anonymous", max_length=64)

class Indicator(BaseModel):
    word: str
    type: str
    weight: float

class AnalyzeResponse(BaseModel):
    is_fake: bool
    confidence: float = Field(..., ge=0.0, le=1.0)
    indicators: list[Indicator] = []

class SyncRequest(BaseModel):
    token: str = Field(..., max_length=64)
    since: Optional[str] = None  # ISO 8601

class BackupRequest(BaseModel):
    token: str = Field(..., max_length=64)
    data_json: dict
