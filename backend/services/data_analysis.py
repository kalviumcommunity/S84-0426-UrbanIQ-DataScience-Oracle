import re
import pandas as pd
from typing import List, Dict, Any

# Keyword map for smart category inference and normalization.
CATEGORY_KEYWORDS: Dict[str, List[str]] = {
    "Water": ["water", "no water", "water issue", "water supply", "pipe", "leak", "sewage water"],
    "Waste": ["garbage", "waste", "trash", "bin", "litter", "dumping", "not collected"],
    "Roads": ["pothole", "road", "manhole", "zebra crossing", "traffic light", "intersection"],
    "Lighting": ["street light", "streetlight", "lamp", "lighting", "dark road"],
    "Drainage": ["drain", "drainage", "waterlogging", "overflow", "storm drain"],
    "Parks & Trees": ["tree", "park", "branch", "weeds", "green belt"],
    "Animal Control": ["stray", "dog", "animal"],
    "Noise": ["noise", "loud", "construction noise"],
}


def _normalize_text(value: Any, fallback: str = "Unknown") -> str:
    if value is None:
        return fallback
    text = str(value).strip()
    return text if text else fallback


def _infer_category_from_text(text: str) -> str:
    lowered = text.lower()
    for canonical_category, keywords in CATEGORY_KEYWORDS.items():
        if any(keyword in lowered for keyword in keywords):
            return canonical_category
    return "Other"


def _normalize_category(raw_category: Any, complaint_text: str) -> str:
    # First try direct category string normalization using keyword map.
    category_text = _normalize_text(raw_category, fallback="")
    if category_text:
        inferred_from_category = _infer_category_from_text(category_text)
        if inferred_from_category != "Other":
            return inferred_from_category

    # Mandatory smart feature: infer category from complaint text when missing/inconsistent.
    inferred_from_text = _infer_category_from_text(complaint_text)
    if inferred_from_text != "Other":
        return inferred_from_text

    # Fall back to normalized user category if present, otherwise Other.
    return category_text.title() if category_text else "Other"


def _build_issue_signature(text: str) -> str:
    # Normalize text for recurring issue grouping.
    normalized = re.sub(r"[^a-z0-9\s]", " ", text.lower())
    normalized = re.sub(r"\s+", " ", normalized).strip()
    if not normalized:
        return "unknown issue"
    tokens = [token for token in normalized.split(" ") if len(token) > 2]
    return " ".join(tokens[:6]) if tokens else normalized

def load_and_clean_data(raw_data: List[Dict[str, Any]]) -> pd.DataFrame:
    """
    Loads raw list of dictionaries (from MongoDB or JSON) into a Pandas DataFrame 
    and applies standard cleaning operations.
    """
    if not raw_data:
        return pd.DataFrame()

    df = pd.DataFrame(raw_data)

    # Handle raw text source differences and missing values.
    if 'complaint_text' not in df.columns:
        details_series = df.get('details', pd.Series([None] * len(df), dtype='object'))
        title_series = df.get('title', pd.Series([None] * len(df), dtype='object'))
        df['complaint_text'] = details_series.fillna('')
        empty_details = df['complaint_text'].astype(str).str.strip() == ''
        df.loc[empty_details, 'complaint_text'] = title_series.fillna('')

    if 'location' not in df.columns:
        df['location'] = df.get('area', pd.Series([None] * len(df), dtype='object'))

    if 'date' not in df.columns:
        df['date'] = df.get('createdAt', pd.Series([None] * len(df), dtype='object'))

    if 'status' not in df.columns:
        df['status'] = 'unknown'

    # Normalize base text fields.
    df['complaint_text'] = df['complaint_text'].apply(lambda value: _normalize_text(value, fallback='No description'))
    df['location'] = df['location'].apply(lambda value: _normalize_text(value, fallback='Unknown'))
    df['status'] = df['status'].apply(lambda value: _normalize_text(value, fallback='unknown').lower())

    # Auto-categorization + category normalization.
    raw_categories = df.get('category', pd.Series([None] * len(df), dtype='object'))
    df['category'] = [
        _normalize_category(raw_category=raw_category, complaint_text=complaint_text)
        for raw_category, complaint_text in zip(raw_categories, df['complaint_text'])
    ]

    # Robust datetime parsing; drop invalid dates to keep trend outputs correct.
    df['date'] = pd.to_datetime(df['date'], errors='coerce', utc=True)
    df.dropna(subset=['date'], inplace=True)

    # Build issue signature used by recurring issue detection.
    df['issue_signature'] = df['complaint_text'].apply(_build_issue_signature)

    return df

def get_top_categories(df: pd.DataFrame, top_n: int = 5) -> List[Dict[str, Any]]:
    """
    Calculates the most frequent complaint categories.
    """
    if df.empty or 'category' not in df.columns:
        return []

    counts = df['category'].value_counts().head(top_n)
    return [
        {'category': category, 'count': int(count)}
        for category, count in counts.items()
    ]

def get_area_wise_complaints(df: pd.DataFrame, top_n: int = 5) -> List[Dict[str, Any]]:
    """
    Finds the locations with the highest volume of complaints.
    """
    if df.empty or 'location' not in df.columns:
        return []

    counts = df['location'].value_counts().head(top_n)
    return [
        {'location': location, 'count': int(count)}
        for location, count in counts.items()
    ]

def get_time_based_trends(df: pd.DataFrame, freq: str = 'D') -> List[Dict[str, Any]]:
    """
    Analyzes complaint volume over time.
    `freq` can be 'D' (daily), 'W' (weekly), 'M' (monthly).
    """
    if df.empty or 'date' not in df.columns:
        return []

    normalized_freq = (freq or 'D').upper()
    if normalized_freq not in {'D', 'W'}:
        normalized_freq = 'D'

    df_temp = df.set_index('date')
    trend = df_temp.resample(normalized_freq).size()

    return [
        {'period': period.strftime('%Y-%m-%d'), 'count': int(count)}
        for period, count in trend.items()
    ]


def detect_recurring_issues(df: pd.DataFrame, top_n: int = 5) -> List[Dict[str, Any]]:
    """
    Detect recurring complaint themes by grouping normalized issue signatures.
    """
    if df.empty or 'issue_signature' not in df.columns:
        return []

    recurring = (
        df.groupby(['issue_signature', 'category'])
        .size()
        .reset_index(name='count')
        .sort_values('count', ascending=False)
    )
    recurring = recurring[recurring['count'] > 1].head(top_n)

    return [
        {
            'issue': str(row['issue_signature']),
            'category': str(row['category']),
            'count': int(row['count']),
        }
        for _, row in recurring.iterrows()
    ]
    
def generate_full_report(raw_data: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Main wrapper function to generate a complete analytics report from raw data.
    """
    df = load_and_clean_data(raw_data)

    if df.empty:
        return {
            "total_complaints": 0,
            "top_issues": [],
            "area_wise": [],
            "time_trends": {
                "daily": [],
                "weekly": [],
            },
            "recurring_issues": [],
        }

    return {
        "total_complaints": int(len(df)),
        "top_issues": get_top_categories(df),
        "area_wise": get_area_wise_complaints(df),
        "time_trends": {
            "daily": get_time_based_trends(df, freq='D'),
            "weekly": get_time_based_trends(df, freq='W'),
        },
        "recurring_issues": detect_recurring_issues(df),
    }
