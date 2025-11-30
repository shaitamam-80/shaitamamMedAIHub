FROM python:3.11-slim

WORKDIR /app

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create uploads directory
RUN mkdir -p uploads

# Railway provides PORT env var
ENV PORT=8000
EXPOSE 8000

# Use shell form to allow env var substitution
CMD uvicorn main:app --host 0.0.0.0 --port $PORT
