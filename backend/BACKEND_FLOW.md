# Argus Backend Flow

A compact walkthrough of how requests move through the backend, from startup to analytics output.

## 1) Boot Sequence
- `main.py` creates the FastAPI app, applies CORS, and registers routes.
- On startup, the app connects to MongoDB via `database/connection.py`.
- It also initializes the complaint category predictor using complaint data from the JSON store.

## 2) Data Path
- Core operational data currently flows through JSON stores:
  - `data/complaints_store.json`
  - `data/users_store.json`
- If complaint storage is empty, sample rows are seeded from `data/sample_complaints.json`.
- MongoDB connectivity is prepared and available for integration-ready persistence.

## 3) Request Lifecycle
- Client calls an endpoint under `/api/v1`.
- FastAPI validates payloads using Pydantic models.
- Route handlers in `routes/auth.py` and `routes/insights.py` execute business logic.
- Service helpers in `services/data_analysis.py` and `services/category_predictor.py` process analytics and predictions.
- Standardized success/error payloads are returned to the frontend.

## 4) Key Route Groups
- Auth: `/api/v1/auth/login`, `/signup`, `/profile`
- Complaints: list, create, assign, resolve, delete, and review transition endpoints
- Insights: top issues, area-wise distribution, trends, and summary
- ML: `/api/v1/predict-category` and predictor info endpoint

## 5) Why This Flow Works
- Fast, predictable startup behavior
- Clear separation of routes, services, and storage helpers
- Analytics and ML features that plug into one unified complaint pipeline

In short: simple architecture, rapid insights, and a structure that is ready to scale.
