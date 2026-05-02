FROM python:3.11-slim

WORKDIR /app

ENV PIP_DEFAULT_TIMEOUT=120
ENV PIP_RETRIES=10

COPY requirements.txt .

RUN pip install --no-cache-dir --retries 10 --timeout 120 -r requirements.txt

COPY . .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]