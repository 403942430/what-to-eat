#!/bin/sh
set -e
echo "=== Starting backend ==="
echo "Python: $(python --version)"
echo "PORT: ${PORT:-8000}"
echo "=== Starting uvicorn ==="
exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --log-level debug
