FROM python:3.11-slim

WORKDIR /app

# Create non-root user
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Copy requirements and install public dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install git (needed for pip install from private GitHub repo), then remove it
RUN apt-get update && apt-get install -y --no-install-recommends git && rm -rf /var/lib/apt/lists/*

# Install sr-skills from private GitHub repo (token passed as build arg)
ARG GH_TOKEN
RUN pip install --no-cache-dir "sr-skills @ git+https://${GH_TOKEN}@github.com/shaitamam-80/sr-skills.git@main"

# Copy application code (from backend/ since Docker context is repo root)
COPY backend/ .

# Create uploads directory with proper permissions
RUN mkdir -p uploads && chown -R appuser:appuser /app

# Railway provides PORT env var
ENV PORT=8000
EXPOSE 8000

# Switch to non-root user
USER appuser

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:${PORT}/health')"

# Use ENTRYPOINT with exec form for proper signal handling
ENTRYPOINT ["uvicorn", "main:app", "--host", "0.0.0.0"]
CMD ["--port", "8000"]
