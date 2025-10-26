"""
Thin entrypoint that exposes the FastAPI app from the
modularized package structure under Api/algoritmia_api/.

Run locally:
  python Api/algoritmia-api.py
"""

from algoritmia_api.app import app  # FastAPI instance

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)

