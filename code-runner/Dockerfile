FROM python:3.11-slim

# Install system dependencies (compilers, nodejs, java, iptables for network isolation, octave for matlab)
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    nodejs \
    default-jdk \
    iptables \
    sqlite3 \
    octave \
    ghostscript \
    gnuplot-nox \
    curl \
    dotnet-sdk-8.0 \
    && rm -rf /var/lib/apt/lists/*

# Go — official binary (lean, current version)
RUN curl -fsSL https://go.dev/dl/go1.22.3.linux-amd64.tar.gz | tar -C /usr/local -xz
ENV PATH="/usr/local/go/bin:${PATH}"

WORKDIR /app

# Pre-scaffold C# console project during build
RUN dotnet new console -n Solution -o /app/csharp-template --no-restore \
    && dotnet restore /app/csharp-template

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Create a non-root sandbox user for code execution (NOT for the server)
RUN useradd -m -s /bin/false -u 1001 sandbox

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
