# ML Overview: Complaint Category Intelligence

This backend uses a lightweight, practical ML pipeline to auto-classify complaint text into municipal categories.

## Model Snapshot
- Technique: TF-IDF text features + Logistic Regression
- Library: scikit-learn (with robust fallback behavior)
- Entry point: `services/category_predictor.py`

## How It Trains
- The predictor is initialized during app startup.
- Training data is built from complaint text and category labels.
- If runtime data is too small, sample complaints are automatically used to stabilize training.
- The model is then trained on all available cleaned text-label pairs.

## Smart Reliability Features
- If scikit-learn is unavailable, the system falls back to frequency-based category prediction.
- Very short or low-signal text safely uses fallback scoring.
- Evaluation metrics (accuracy, macro precision, macro recall) are logged during startup runs when splitting is feasible.

## Prediction API
- Endpoint: `/api/v1/predict-category`
- Input: complaint text
- Output:
  - predicted category
  - confidence score
  - per-category probability scores

## Why It Matters
- Faster triage for incoming complaints
- Better routing to teams
- Consistent categorization quality, even with imperfect text input

The result is an ML layer that is lean, dependable, and built for real-world civic operations.
