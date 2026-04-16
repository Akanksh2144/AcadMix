FROM python:3.11-slim

# Install system dependencies (compilers, nodejs, java, iptables for network isolation)
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    nodejs \
    default-jdk \
    iptables \
    sqlite3 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Create a non-root sandbox user for code execution (NOT for the server)
RUN useradd -m -s /bin/false -u 1001 sandbox

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
