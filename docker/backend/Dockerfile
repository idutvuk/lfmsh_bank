FROM python:3.13-slim-bookworm

WORKDIR /app

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      build-essential \
      libpq-dev \
      zlib1g-dev \
      libjpeg-dev \
      libpng-dev && \
    rm -rf /var/lib/apt/lists/*

COPY backend/pyproject.toml ./
RUN pip install pip --no-cache-dir --upgrade \
    && pip install --no-cache-dir .[dev] \
    && pip install --no-cache-dir .[prod] \
    && pip install --no-cache-dir .[test] \
    && pip install --no-cache-dir .[docs] \
    && pip check
RUN mkdir -p /app/logs
RUN mkdir -p /var/www/media/avatars

COPY backend/ ./

EXPOSE 8000