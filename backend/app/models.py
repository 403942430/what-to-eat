"""数据库模型"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, JSON, Text
from app.database import Base

class SyncLog(Base):
    __tablename__ = "sync_log"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_token = Column(String(64), index=True)
    text = Column(Text)
    is_fake = Column(Boolean)
    confidence = Column(Float)
    indicators = Column(JSON)
    analyzed_at = Column(DateTime, default=datetime.utcnow)
    synced = Column(Boolean, default=False)

class UserBackup(Base):
    __tablename__ = "user_backups"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_token = Column(String(64), index=True)
    data_json = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
