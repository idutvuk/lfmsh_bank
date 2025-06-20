FROM ghcr.io/astral-sh/uv:python3.12-bookworm-slim

WORKDIR /app

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      build-essential \
      libpq-dev && \
    rm -rf /var/lib/apt/lists/* \

# no venv
ENV UV_SYSTEM_PYTHON=1
COPY pyproject.toml uv.lock ./
RUN uv sync

RUN mkdir -p /app/logs

COPY django-app/ ./
COPY entrypoint.sh ./


#CMD ["sh", "-c", "gunicorn core.wsgi:application --bind 0.0.0.0:8000 --workers 3"]
