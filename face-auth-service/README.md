# Face Auth Service

Backend service for the Face Recognition Attendance System.

This directory contains the FastAPI application, database helpers, and authentication utilities.

## Deployment

For Railway, run the service from this directory and use:

```bash
python -m uvicorn main:app --host 0.0.0.0 --port $PORT
```

The app expects its environment variables to be set in Railway and will bind to Railway's injected `PORT`.

For local development, set `APP_PORT` in your local `.env` if you want to run `python main.py` directly.
