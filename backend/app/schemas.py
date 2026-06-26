"""Pydantic 请求/响应模型"""
from pydantic import BaseModel
from typing import Optional

class AnalyzeRequest(BaseModel):
    text: str
    user_token: str = "anonymous"

class Indicator(BaseModel):
    word: str
    type: str
    weight: float

class AnalyzeResponse(BaseModel):
    is_fake: bool
    confidence: float
    indicators: list[Indicator] = []

class SyncRequest(BaseModel):
    token: str
    since: Optional[str] = None

class BackupRequest(BaseModel):
    token: str
    data_json: dict
