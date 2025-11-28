FROM python:3.12-slim

# Prevent Python from writing .pyc files and buffer logs
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Install Python dependencies for the analysis_service
COPY analysis_service/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy only the analysis_service code into the image
COPY analysis_service/ .

# (Optional) Document the default port; Render will inject $PORT
EXPOSE 8000

# main.py reads PORT from the environment (Render sets this automatically)
CMD ["python", "main.py"]
