FROM python:3.11-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PIP_DEFAULT_TIMEOUT=300
ENV PIP_RETRIES=10
ENV HF_HOME=/root/.cache/huggingface
ENV TRANSFORMERS_CACHE=/root/.cache/huggingface/transformers

RUN pip install --no-cache-dir --upgrade pip setuptools wheel

COPY requirements.txt .

# Dépendances Python normales du backend
RUN pip install --no-cache-dir --retries 10 --timeout 300 -r requirements.txt

# Dépendances nécessaires à Torch CPU
RUN pip install --no-cache-dir --retries 10 --timeout 300 \
    sympy==1.14.0 \
    mpmath==1.3.0 \
    networkx==3.6.1 \
    jinja2==3.1.6 \
    filelock \
    fsspec \
    typing-extensions \
    MarkupSafe

# Torch CPU-only, sans CUDA/NVIDIA
RUN pip install --no-cache-dir --retries 10 --timeout 300 --no-deps \
    torch==2.3.1+cpu \
    --index-url https://download.pytorch.org/whl/cpu

COPY . .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]