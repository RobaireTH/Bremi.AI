FROM python:3.12-slim

# Prevent Python from writing .pyc files and buffer logs
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app


COPY analysis_service/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt


COPY analysis_service/ .

# Document the default port; Render will inject $PORT
EXPOSE 8000

CMD ["python", "main.py"]
