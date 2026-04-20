"""
Lightweight text-based complaint category prediction using scikit-learn.
Trained once on startup; no external model files required.
"""

import json
import logging
import os
from collections import Counter
from typing import Any, Dict, List, Optional, Tuple
import numpy as np

try:
    from sklearn.metrics import accuracy_score, precision_recall_fscore_support
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.linear_model import LogisticRegression
    from sklearn.model_selection import train_test_split
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False


logger = logging.getLogger(__name__)


class ComplaintCategoryPredictor:
    """Simple TF-IDF + Logistic Regression model for complaint category prediction."""

    def __init__(self):
        self.vectorizer: Optional[TfidfVectorizer] = None
        self.model: Optional[LogisticRegression] = None
        self.categories: List[str] = []
        self.fallback_category: Optional[str] = None
        self.fallback_scores: Dict[str, float] = {}
        self.is_trained = False

    def _set_frequency_fallback(self, labels: List[str]) -> None:
        counts = Counter(str(label) for label in labels if str(label).strip())
        total = sum(counts.values())
        self.fallback_category = counts.most_common(1)[0][0] if counts else None
        self.fallback_scores = {
            str(category): float(count / total)
            for category, count in counts.items()
        } if total else {}

    def _fallback_prediction(self) -> Dict[str, Any]:
        confidence = None
        if self.fallback_category and self.fallback_scores:
            confidence = float(self.fallback_scores.get(self.fallback_category, 0.0))

        return {
            'predicted_category': self.fallback_category,
            'confidence': round(confidence, 4) if confidence is not None else None,
            'all_scores': self.fallback_scores or None,
            'error': None,
        }

    def train(self, texts: List[str], labels: List[str]) -> None:
        """
        Train the model on complaint texts and their categories.
        """
        if not texts or not labels or len(texts) != len(labels):
            self.is_trained = False
            return

        cleaned_pairs: List[Tuple[str, str]] = []
        for text, label in zip(texts, labels):
            normalized_text = str(text or '').strip()
            normalized_label = str(label or '').strip()
            if normalized_text and normalized_label:
                cleaned_pairs.append((normalized_text, normalized_label))

        if not cleaned_pairs:
            self.is_trained = False
            return

        clean_texts = [text for text, _ in cleaned_pairs]
        clean_labels = [label for _, label in cleaned_pairs]
        self.categories = sorted(list(set(clean_labels)))
        self._set_frequency_fallback(clean_labels)

        # Always keep at least frequency-based fallback active for stability.
        self.is_trained = bool(self.fallback_category)

        if not SKLEARN_AVAILABLE:
            logger.warning("scikit-learn unavailable; using frequency fallback category predictor.")
            return

        try:
            unique_labels = set(clean_labels)
            label_counts = Counter(clean_labels)
            sample_count = len(clean_texts)

            can_split = sample_count >= 4 and len(unique_labels) >= 2
            can_stratify = all(count >= 2 for count in label_counts.values())

            if can_split:
                test_size = max(1, int(round(sample_count * 0.2)))
                if test_size >= sample_count:
                    test_size = sample_count - 1

                stratify_labels = clean_labels if can_stratify and test_size >= len(unique_labels) else None
                X_train, X_test, y_train, y_test = train_test_split(
                    clean_texts,
                    clean_labels,
                    test_size=test_size,
                    random_state=42,
                    stratify=stratify_labels,
                )

                eval_vectorizer = TfidfVectorizer(
                    max_features=300,
                    stop_words='english',
                    min_df=1,
                    max_df=0.95,
                    lowercase=True,
                )
                X_train_vec = eval_vectorizer.fit_transform(X_train)
                X_test_vec = eval_vectorizer.transform(X_test)

                eval_model = LogisticRegression(
                    max_iter=1000,
                    random_state=42,
                    solver='saga',
                )
                eval_model.fit(X_train_vec, y_train)

                y_pred = eval_model.predict(X_test_vec)
                accuracy = float(accuracy_score(y_test, y_pred))
                precision, recall, _, _ = precision_recall_fscore_support(
                    y_test,
                    y_pred,
                    average='macro',
                    zero_division=0,
                )

                # Evaluation is logged only; API payloads remain unchanged.
                logger.info(
                    "Category predictor evaluation | samples=%d train=%d test=%d accuracy=%.4f precision_macro=%.4f recall_macro=%.4f",
                    sample_count,
                    len(y_train),
                    len(y_test),
                    accuracy,
                    float(precision),
                    float(recall),
                )
            else:
                logger.info(
                    "Category predictor evaluation skipped due to small dataset | samples=%d classes=%d",
                    sample_count,
                    len(unique_labels),
                )

            # Train production model on all available data after evaluation.
            self.vectorizer = TfidfVectorizer(
                max_features=300,
                stop_words='english',
                min_df=1,
                max_df=0.95,
                lowercase=True,
            )
            X_all = self.vectorizer.fit_transform(clean_texts)

            self.model = LogisticRegression(
                max_iter=1000,
                random_state=42,
                solver='saga',
            )
            self.model.fit(X_all, clean_labels)
            self.is_trained = True
        except Exception as e:
            logger.exception("Failed to train sklearn model, falling back to frequency predictor: %s", e)
            self.vectorizer = None
            self.model = None
            self.is_trained = bool(self.fallback_category)

    def predict(self, text: str) -> Dict[str, Any]:
        """
        Predict category for a complaint text.
        Returns predicted category and confidence score.
        """
        if not self.is_trained:
            return {
                'predicted_category': None,
                'confidence': None,
                'all_scores': None,
                'error': 'Model not trained',
            }

        cleaned_text = str(text or '').strip()
        if not cleaned_text:
            return self._fallback_prediction()

        # Very short inputs are often too sparse for meaningful TF-IDF signals.
        if len(cleaned_text) < 3:
            return self._fallback_prediction()

        if self.vectorizer is None or self.model is None:
            return self._fallback_prediction()

        try:
            X = self.vectorizer.transform([cleaned_text])
            pred_class = self.model.predict(X)[0]
            pred_category = str(pred_class)

            proba = self.model.predict_proba(X)[0]

            if proba is None or len(proba) == 0 or np.isnan(np.sum(proba)):
                return self._fallback_prediction()

            confidence = float(np.max(proba))
            all_scores = {
                str(cat): float(proba[i])
                for i, cat in enumerate(self.categories)
                if i < len(proba)
            }

            if pred_category not in all_scores and self.fallback_category:
                return self._fallback_prediction()
            
            return {
                'predicted_category': pred_category,
                'confidence': round(confidence, 4),
                'all_scores': all_scores or None,
                'error': None,
            }
        except Exception as e:
            logger.warning("Prediction failed, returning fallback category: %s", e)
            return self._fallback_prediction()

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
    def _extract_pairs(complaints: List[Dict[str, Any]]) -> List[Tuple[str, str]]:
        pairs: List[Tuple[str, str]] = []
        for complaint in complaints:
            text = str(complaint.get('complaint_text') or complaint.get('details') or '').strip()
            category = str(complaint.get('category') or '').strip()
            if text and category:
                pairs.append((text, category))
        return pairs

    training_pairs = _extract_pairs(raw_complaints or [])

    # If runtime complaint store is too small, backfill with sample data for stable startup.
    if len(training_pairs) < 4:
        sample_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'sample_complaints.json')
        try:
            with open(sample_path, 'r', encoding='utf-8') as sample_file:
                sample_rows = json.load(sample_file)
            training_pairs.extend(_extract_pairs(sample_rows))
        except Exception as e:
            logger.warning("Could not load sample complaints for predictor backfill: %s", e)

    if not training_pairs:
        return

    texts, labels = zip(*training_pairs)
    _predictor.train(list(texts), list(labels))


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
