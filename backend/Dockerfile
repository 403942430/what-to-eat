FROM python:3.10-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN python -c "import jieba; jieba.initialize()"
COPY . .
RUN mkdir -p data
ENV PORT=8000
EXPOSE 8000
CMD ["sh", "-c", "echo 'Starting...' && uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --log-level info"]
