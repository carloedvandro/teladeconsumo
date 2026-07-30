FROM python:3.12-slim

# Dependências do Playwright (Chromium headless)
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y --no-install-recommends \
    libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 \
    libdbus-1-3 libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 \
    libxrandr2 libgbm1 libasound2 libatspi2.0-0 libxshmfence1 \
    fonts-liberation wget ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt \
    && playwright install chromium

COPY . .

# storage persistente (cookies/2FA) entre runs
RUN mkdir -p /data
ENV SCRAPER_STORAGE_PATH=/data/storage.json

CMD ["python", "-m", "scraper.main"]
