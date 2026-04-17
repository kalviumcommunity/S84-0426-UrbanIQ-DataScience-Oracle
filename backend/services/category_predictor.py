"""
Lightweight text-based complaint category prediction using scikit-learn.
Trained once on startup; no external model files required.
"""

import json
import os
from typing import Any, Dict, List, Optional
import numpy as np

try:
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.linear_model import LogisticRegression
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False


class ComplaintCategoryPredictor:
    """Simple TF-IDF + Logistic Regression model for complaint category prediction."""

    def __init__(self):
        self.vectorizer: Optional[TfidfVectorizer] = None
        self.model: Optional[LogisticRegression] = None
        self.categories: List[str] = []
        self.is_trained = False

    def train(self, texts: List[str], labels: List[str]) -> None:
        """
        Train the model on complaint texts and their categories.
        """
        if not SKLEARN_AVAILABLE:
            self.is_trained = False
            return

        if not texts or not labels or len(texts) != len(labels):
            self.is_trained = False
            return

        try:
            # TF-IDF vectorization with minimal settings to avoid overfitting
            self.vectorizer = TfidfVectorizer(
                max_features=100,
                stop_words='english',
                min_df=1,
                max_df=0.9,
                lowercase=True,
            )
            
            X = self.vectorizer.fit_transform(texts)
            
            # Logistic Regression with L2 regularization
            self.model = LogisticRegression(
                max_iter=1000,
                random_state=42,
                solver='saga',
                C=1.0,
            )
            
            self.model.fit(X, labels)
            self.categories = sorted(list(set(labels)))
            self.is_trained = True
        except Exception as e:
            print(f"Failed to train category predictor: {e}")
            self.is_trained = False

    def predict(self, text: str) -> Dict[str, Any]:
        """
        Predict category for a complaint text.
        Returns predicted category and confidence score.
        """
        if not self.is_trained or not text or not text.strip():
            return {
                'predicted_category': None,
                'confidence': None,
                'all_scores': None,
                'error': 'Model not trained or text is empty',
            }

        try:
            X = self.vectorizer.transform([text])
            pred_class = self.model.predict(X)[0]
            # Handle numpy string types by converting to regular Python string
            pred_category = str(pred_class)
            
            # Get confidence scores (probability of each class)
            proba = self.model.predict_proba(X)[0]
            confidence = float(np.max(proba))
            
            # Map all scores to categories
            all_scores = {
                cat: float(proba[i])
                for i, cat in enumerate(self.categories)
            }
            
            return {
                'predicted_category': pred_category,
                'confidence': round(confidence, 4),
                'all_scores': all_scores,
                'error': None,
            }
        except Exception as e:
            return {
                'predicted_category': None,
                'confidence': None,
                'all_scores': None,
                'error': f'Prediction failed: {str(e)}',
            }

    def get_categories(self) -> List[str]:
        """Return list of trained categories."""
        return self.categories if self.is_trained else []


# Global predictor instance - trained once on startup
_predictor = ComplaintCategoryPredictor()


def initialize_predictor(raw_complaints: List[Dict[str, Any]]) -> None:
    """
    Initialize and train the global predictor on complaint data.
    Called once during app startup.
    """
    if not raw_complaints:
        return

    texts = []
    labels = []
    
    for complaint in raw_complaints:
        text = complaint.get('complaint_text') or complaint.get('details') or ''
        category = complaint.get('category')
        
        if text.strip() and category:
            texts.append(text)
            labels.append(category)
    
    if texts and labels:
        _predictor.train(texts, labels)


def predict_category(text: str) -> Dict[str, Any]:
    """
    Public API to predict category from complaint text.
    """
    return _predictor.predict(text)


def is_predictor_ready() -> bool:
    """Check if predictor is trained and ready."""
    return _predictor.is_trained


def get_trained_categories() -> List[str]:
    """Get list of trained categories."""
    return _predictor.get_categories()
