"""应用配置"""

import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./data/what_to_eat.db")
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*").split(",")
MODEL_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
VECTORIZER_PATH = os.path.join(MODEL_DIR, "tfidf_vectorizer.pkl")
CLASSIFIER_PATH = os.path.join(MODEL_DIR, "lr_classifier.pkl")
