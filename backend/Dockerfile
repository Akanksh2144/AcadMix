FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends gcc curl && \
    rm -rf /var/lib/apt/lists/*

# Install Python dependencies (cached layer)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Health check
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD curl -f http://localhost:${PORT:-8000}/api/health || exit 1

# Default environment
ENV PORT=8000
ENV WEB_CONCURRENCY=4
ENV LOG_LEVEL=info

# Production entrypoint — multi-worker via Gunicorn
CMD ["gunicorn", "app.main:app", "-c", "gunicorn.conf.py"]
