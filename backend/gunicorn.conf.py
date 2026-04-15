"""Gunicorn config for production multi-worker deployment.

Usage:
    gunicorn app.main:app -c gunicorn.conf.py

Environment variables:
    WEB_CONCURRENCY  — number of worker processes (default: 2*CPU+1)
    PORT             — bind port (default: 8000)
    LOG_LEVEL        — logging level (default: info)
"""
import multiprocessing
import os

# Worker config
workers = int(os.getenv("WEB_CONCURRENCY", multiprocessing.cpu_count() * 2 + 1))
worker_class = "uvicorn.workers.UvicornWorker"
bind = f"0.0.0.0:{os.getenv('PORT', '8000')}"

# Timeouts
timeout = 120          # Kill worker if request takes >120s (LLM calls can be long)
graceful_timeout = 30  # Grace period for in-flight requests on shutdown
keepalive = 5          # Keep-alive between requests

# Logging
accesslog = "-"        # stdout
errorlog = "-"         # stdout
loglevel = os.getenv("LOG_LEVEL", "info")

# Connection handling
max_requests = 1000        # Restart worker after 1000 requests (prevents memory leaks)
max_requests_jitter = 50   # Stagger restarts to avoid thundering herd


# Lifecycle hooks
def on_starting(server):
    server.log.info("Gunicorn starting with %d workers on %s", workers, bind)


def post_fork(server, worker):
    server.log.info("Worker spawned (pid: %s)", worker.pid)
