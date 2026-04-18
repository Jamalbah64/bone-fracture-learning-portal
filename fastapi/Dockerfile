FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt 
RUN pip install --no-cache-dir torch torchvision --index-url https://download.pytorch.org/whl/cpu
RUN pip install --no-cache-dir ultralytics
RUN pip install --no-cache-dir dill
COPY . .

EXPOSE 8000

CMD ["uvicorn", "mock_api:app", "--host", "127.0.0.1", "--port", "8000"]
