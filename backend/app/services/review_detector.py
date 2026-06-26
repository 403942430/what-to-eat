"""NLP 虚假评论检测服务"""
import os
import pickle
import re
import jieba
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from app.config import VECTORIZER_PATH, CLASSIFIER_PATH


class ReviewDetector:
    """虚假评论检测器 — jieba + TF-IDF + Logistic Regression"""

    # 种子训练样本（如果模型文件不存在则用它训练）
    SEED_SAMPLES = [
        ("好评返现五元五星好评有红包", 1),
        ("加微信领红包五星好评", 1),
        ("姐妹们冲啊闭眼入绝绝子", 1),
        ("亲测有效赶紧冲限时优惠", 1),
        ("无限回购不踩雷强烈推荐试试看吧", 1),
        ("收藏店铺关注有礼扫码领红包", 1),
        ("真的太好吃了分量很足价格实惠", 0),
        ("比实体店便宜良心商家值得信赖", 0),
        ("第二次买了朋友推荐确实不错", 0),
        ("味道一般般没什么特别的", 0),
        ("送餐很快包装完好服务态度好", 0),
        ("今天点的鸡排饭外酥里嫩很好吃", 0),
        ("第二次回购味道依然很棒", 0),
        ("这家店的东西物超所值强烈推荐大家购买", 1),
        ("买过好几次了每次都很满意", 0),
        ("客服小姐姐态度很好很耐心", 1),
        ("味道还行价格适中会再来的", 0),
        ("第一次尝试感觉还不错下次还会点", 0),
        ("居然这么好吃太意外了无限回购", 1),
        ("踩雷了千万别买浪费钱", 0),
    ]

    HIGH_RISK_PATTERNS = [
        (r"好评返现|五星好评.*红包|有红包", "刷单特征", 0.9),
        (r"加微信|扫码领|关注有礼|收藏店铺", "引流特征", 0.8),
        (r"绝绝子|yyds|姐妹们冲|闭眼入", "流行语模板", 0.7),
        (r"亲测有效|赶紧冲|限时优惠|不踩雷", "促销诱导", 0.7),
        (r"无限回购|回购无数次|居然这么好吃", "刷单嫌疑", 0.6),
        (r"客服小姐姐|物超所值|强烈推荐", "模板话术", 0.5),
    ]

    @staticmethod
    def _tokenize(text: str) -> list[str]:
        """jieba 分词（模块级函数，可 pickle）"""
        return jieba.lcut(text)

    def __init__(self):
        self.vectorizer: TfidfVectorizer | None = None
        self.classifier: LogisticRegression | None = None
        self._load_or_train()

    def _load_or_train(self):
        if os.path.exists(VECTORIZER_PATH) and os.path.exists(CLASSIFIER_PATH):
            with open(VECTORIZER_PATH, "rb") as f:
                self.vectorizer = pickle.load(f)
            with open(CLASSIFIER_PATH, "rb") as f:
                self.classifier = pickle.load(f)
        else:
            self._train_seed()

    def _train_seed(self):
        texts = [s[0] for s in self.SEED_SAMPLES]
        labels = [s[1] for s in self.SEED_SAMPLES]

        self.vectorizer = TfidfVectorizer(
            tokenizer=ReviewDetector._tokenize,
            max_features=500,
            ngram_range=(1, 2),
        )
        X = self.vectorizer.fit_transform(texts)
        self.classifier = LogisticRegression(max_iter=200, random_state=42)
        self.classifier.fit(X, labels)

        os.makedirs(os.path.dirname(VECTORIZER_PATH), exist_ok=True)
        with open(VECTORIZER_PATH, "wb") as f:
            pickle.dump(self.vectorizer, f)
        with open(CLASSIFIER_PATH, "wb") as f:
            pickle.dump(self.classifier, f)

    def analyze(self, text: str) -> dict:
        """分析评论文本，返回 {is_fake, confidence, indicators}"""
        # 1. ML 预测
        X = self.vectorizer.transform([text])
        proba = self.classifier.predict_proba(X)[0]
        is_fake = bool(proba[1] > 0.5)
        confidence = float(max(proba))

        # 2. 提取 indicators（命中关键词）
        indicators = []
        for pattern, ptype, weight in self.HIGH_RISK_PATTERNS:
            if re.search(pattern, text):
                indicators.append({"word": pattern, "type": ptype, "weight": weight})

        return {
            "is_fake": is_fake,
            "confidence": round(confidence, 4),
            "indicators": indicators,
        }

# 全局单例
detector = ReviewDetector()
