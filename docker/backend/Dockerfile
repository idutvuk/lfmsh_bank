FROM ghcr.io/astral-sh/uv:python3.13-bookworm-slim

WORKDIR /app

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      build-essential \
      libpq-dev && \
    rm -rf /var/lib/apt/lists/*

# no venv
ENV UV_SYSTEM_PYTHON=1
COPY backend/pyproject.toml backend/uv.lock ./
RUN uv sync
RUN mkdir -p /app/logs

COPY backend/ ./

EXPOSE 8000

CMD ["uv", "run", "--system", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]