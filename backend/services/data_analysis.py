import re
from typing import Any, Dict, List

import pandas as pd

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


def _parse_datetime_series(series: pd.Series) -> pd.Series:
    return pd.to_datetime(series, errors='coerce', utc=True)


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

    if 'area' not in df.columns:
        df['area'] = df.get('location', pd.Series([None] * len(df), dtype='object'))

    if 'date' not in df.columns:
        df['date'] = df.get('createdAt', pd.Series([None] * len(df), dtype='object'))

    if 'createdAt' not in df.columns:
        df['createdAt'] = df['date']

    if 'resolvedAt' not in df.columns:
        df['resolvedAt'] = pd.Series([None] * len(df), dtype='object')

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
    df['date'] = _parse_datetime_series(df['date'])
    df['createdAt'] = _parse_datetime_series(df['createdAt'])
    df['resolvedAt'] = _parse_datetime_series(df['resolvedAt'])

    missing_date_rows = df['date'].isna() & df['createdAt'].notna()
    if missing_date_rows.any():
        df.loc[missing_date_rows, 'date'] = df.loc[missing_date_rows, 'createdAt']

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


def get_area_wise_density(df: pd.DataFrame, top_n: int = 5) -> List[Dict[str, Any]]:
    """
    Calculates area-wise complaint density as a share of total complaints.
    """
    if df.empty or 'location' not in df.columns:
        return []

    total = len(df)
    counts = df['location'].value_counts().head(top_n)
    return [
        {
            'location': location,
            'count': int(count),
            'density_percent': round((count / total) * 100, 2) if total else 0.0,
        }
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
    if normalized_freq not in {'D', 'W', 'M'}:
        normalized_freq = 'D'

    df_temp = df.set_index('date')
    if normalized_freq == 'M':
        trend = df_temp.resample('MS').size()
        return [
            {'period': period.strftime('%Y-%m'), 'count': int(count)}
            for period, count in trend.items()
        ]

    trend = df_temp.resample(normalized_freq).size()

    return [
        {'period': period.strftime('%Y-%m-%d'), 'count': int(count)}
        for period, count in trend.items()
    ]


def get_monthly_complaint_trends(df: pd.DataFrame) -> List[Dict[str, Any]]:
    """
    Returns month-level complaint totals for dashboard charts.
    """
    if df.empty or 'date' not in df.columns:
        return []

    monthly = df.set_index('date').sort_index().resample('MS').size()
    return [
        {'month': period.strftime('%Y-%m'), 'count': int(count)}
        for period, count in monthly.items()
    ]


def get_resolution_metrics(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Computes resolution rate and average resolution time in days.
    """
    if df.empty or 'status' not in df.columns:
        return {
            'total_complaints': 0,
            'resolved_complaints': 0,
            'resolution_rate': 0.0,
            'average_resolution_time_days': 0.0,
        }

    total = int(len(df))
    resolved_mask = df['status'].fillna('').astype(str).str.lower().eq('resolved')
    resolved_count = int(resolved_mask.sum())
    resolution_rate = round((resolved_count / total) * 100, 2) if total else 0.0

    average_resolution_time_days = 0.0
    if {'createdAt', 'resolvedAt'}.issubset(df.columns):
        resolved_rows = df.loc[resolved_mask, ['createdAt', 'resolvedAt']].dropna(subset=['createdAt', 'resolvedAt'])
        if not resolved_rows.empty:
            durations = (resolved_rows['resolvedAt'] - resolved_rows['createdAt']).dt.total_seconds() / (60 * 60 * 24)
            durations = durations[durations >= 0]
            if not durations.empty:
                average_resolution_time_days = round(float(durations.mean()), 2)

    return {
        'total_complaints': total,
        'resolved_complaints': resolved_count,
        'resolution_rate': resolution_rate,
        'average_resolution_time_days': average_resolution_time_days,
    }


def _get_grouping_column(df: pd.DataFrame) -> str:
    if 'area' in df.columns:
        return 'area'
    if 'location' in df.columns:
        return 'location'
    return ''


def _monthly_count_frame(df: pd.DataFrame) -> pd.DataFrame:
    if df.empty or 'date' not in df.columns:
        return pd.DataFrame(columns=['month', 'count'])

    monthly = (
        df.assign(month=_month_start_series(df['date']))
        .groupby('month')
        .size()
        .reset_index(name='count')
        .sort_values('month')
    )
    return monthly


def _month_over_month_change(previous_count: int, current_count: int) -> float:
    if previous_count <= 0:
        return 0.0
    return round(((current_count - previous_count) / previous_count) * 100, 2)


def _month_start_series(series: pd.Series) -> pd.Series:
    normalized = series
    if getattr(normalized.dt, 'tz', None) is not None:
        normalized = normalized.dt.tz_convert('UTC').dt.tz_localize(None)
    return normalized.dt.to_period('M').dt.to_timestamp()


def _build_alert_messages(df: pd.DataFrame, resolution_threshold: float = 50.0) -> List[str]:
    alerts: List[str] = []
    if df.empty:
        return alerts

    resolution_metrics = get_resolution_metrics(df)
    overall_resolution_rate = float(resolution_metrics.get('resolution_rate', 0.0))
    if overall_resolution_rate < resolution_threshold:
        alerts.append(
            f"Resolution rate dropped below threshold ({resolution_threshold:.0f}%) at {overall_resolution_rate:.2f}%"
        )

    grouping_column = _get_grouping_column(df)
    if grouping_column:
        unresolved_mask = df['status'].fillna('').astype(str).str.lower() != 'resolved'
        unresolved_by_group = (
            df.loc[unresolved_mask]
            .groupby(grouping_column)
            .size()
            .sort_values(ascending=False)
        )
        if not unresolved_by_group.empty:
            top_group = unresolved_by_group.index[0]
            top_count = int(unresolved_by_group.iloc[0])
            alerts.append(f"{top_group} has the highest unresolved complaints ({top_count}).")

        monthly_counts = _monthly_count_frame(df)
        if len(monthly_counts) >= 2:
            previous_count = int(monthly_counts.iloc[-2]['count'])
            current_count = int(monthly_counts.iloc[-1]['count'])
            if previous_count > 0 and current_count > max(1, int(previous_count * 1.5)):
                growth = _month_over_month_change(previous_count, current_count)
                latest_month = pd.Timestamp(monthly_counts.iloc[-1]['month']).strftime('%Y-%m')
                alerts.append(
                    f"Overall complaints increased by {growth:.2f}% in {latest_month} compared to the previous month."
                )

        category_monthly = (
            df.assign(month=_month_start_series(df['date']))
            .groupby([grouping_column, 'category', 'month'])
            .size()
            .reset_index(name='count')
            .sort_values(['month', grouping_column, 'category'])
        )
        if not category_monthly.empty:
            latest_month = category_monthly['month'].max()
            previous_month = (pd.Timestamp(latest_month) - pd.offsets.MonthBegin(1)).to_pydatetime()
            previous_month_ts = pd.Timestamp(previous_month).to_period('M').to_timestamp()

            current_slice = category_monthly[category_monthly['month'] == latest_month]
            previous_slice = category_monthly[category_monthly['month'] == previous_month_ts]
            if not current_slice.empty:
                merged = current_slice.merge(
                    previous_slice,
                    on=[grouping_column, 'category'],
                    how='left',
                    suffixes=('_current', '_previous'),
                )
                for _, row in merged.iterrows():
                    current_count = int(row['count_current'])
                    previous_count = int(row['count_previous']) if not pd.isna(row['count_previous']) else 0
                    if previous_count <= 0:
                        if current_count >= 3:
                            alerts.append(
                                f"{row['category']} complaints spiked in {row[grouping_column]} with {current_count} complaints this month."
                            )
                        continue
                    if current_count > max(previous_count, int(previous_count * 1.5)):
                        growth = _month_over_month_change(previous_count, current_count)
                        alerts.append(
                            f"{row['category']} complaints increased by {growth:.2f}% in {row[grouping_column]} compared to last month."
                        )

    return list(dict.fromkeys(alerts))


def _build_priority_areas(df: pd.DataFrame, top_n: int = 3) -> List[Dict[str, Any]]:
    if df.empty:
        return []

    grouping_column = _get_grouping_column(df)
    if not grouping_column:
        return []

    area_rows: List[Dict[str, Any]] = []
    for area_name, group in df.groupby(grouping_column):
        total_count = int(len(group))
        if total_count <= 0:
            continue

        unresolved_mask = group['status'].fillna('').astype(str).str.lower() != 'resolved'
        unresolved_count = int(unresolved_mask.sum())
        resolved_count = total_count - unresolved_count
        resolution_rate = round((resolved_count / total_count) * 100, 2) if total_count else 0.0
        avg_resolution_days = 0.0
        if {'createdAt', 'resolvedAt'}.issubset(group.columns):
            resolved_rows = group.loc[
                group['status'].fillna('').astype(str).str.lower().eq('resolved'),
                ['createdAt', 'resolvedAt'],
            ].dropna(subset=['createdAt', 'resolvedAt'])
            if not resolved_rows.empty:
                durations = (resolved_rows['resolvedAt'] - resolved_rows['createdAt']).dt.total_seconds() / (60 * 60 * 24)
                durations = durations[durations >= 0]
                if not durations.empty:
                    avg_resolution_days = round(float(durations.mean()), 2)

        unresolved_share = round((unresolved_count / total_count) * 100, 2) if total_count else 0.0
        severity_score = round(
            (total_count * 0.65)
            + (unresolved_count * 0.85)
            + max(0.0, 60.0 - resolution_rate) * 0.25
            + max(0.0, avg_resolution_days - 7.0) * 0.15,
            2,
        )

        area_rows.append(
            {
                'area': str(area_name),
                'complaint_count': total_count,
                'unresolved_count': unresolved_count,
                'resolved_count': resolved_count,
                'resolution_rate': resolution_rate,
                'unresolved_share_percent': unresolved_share,
                'average_resolution_time_days': avg_resolution_days,
                'severity_score': severity_score,
            }
        )

    area_rows.sort(
        key=lambda row: (
            row['severity_score'],
            row['unresolved_count'],
            row['complaint_count'],
            -row['resolution_rate'],
        ),
        reverse=True,
    )
    return area_rows[:top_n]


def _build_performance_flags(df: pd.DataFrame) -> List[str]:
    flags: List[str] = []
    if df.empty:
        return flags

    resolution_metrics = get_resolution_metrics(df)
    resolution_rate = float(resolution_metrics.get('resolution_rate', 0.0))
    avg_resolution_days = float(resolution_metrics.get('average_resolution_time_days', 0.0))
    resolved_count = int(resolution_metrics.get('resolved_complaints', 0))
    total_count = int(resolution_metrics.get('total_complaints', 0))
    unresolved_count = max(total_count - resolved_count, 0)

    if resolution_rate < 50.0:
        flags.append('slow resolution')
    if unresolved_count > resolved_count:
        flags.append('high backlog')
    if avg_resolution_days >= 7.0:
        flags.append('slow resolution time')

    monthly_counts = _monthly_count_frame(df)
    if len(monthly_counts) >= 2:
        previous_count = int(monthly_counts.iloc[-2]['count'])
        current_count = int(monthly_counts.iloc[-1]['count'])
        if previous_count > 0 and current_count > max(1, int(previous_count * 1.5)):
            flags.append('complaint surge')

    return list(dict.fromkeys(flags))


def generate_decision_support_intelligence(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Builds a small decision-support layer on top of the existing analytics outputs.
    """
    if df.empty:
        return {
            'alerts': [],
            'priority_areas': [],
            'performance_flags': [],
        }

    return {
        'alerts': _build_alert_messages(df),
        'priority_areas': _build_priority_areas(df),
        'performance_flags': _build_performance_flags(df),
    }


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
            "area_wise_density": [],
            "monthly_trends": [],
            "resolution_metrics": {
                "total_complaints": 0,
                "resolved_complaints": 0,
                "resolution_rate": 0.0,
                "average_resolution_time_days": 0.0,
            },
            "alerts": [],
            "priority_areas": [],
            "performance_flags": [],
            "time_trends": {
                "daily": [],
                "weekly": [],
                "monthly": [],
            },
            "recurring_issues": [],
        }

    return {
        "total_complaints": int(len(df)),
        "top_issues": get_top_categories(df),
        "area_wise": get_area_wise_complaints(df),
        "area_wise_density": get_area_wise_density(df),
        "monthly_trends": get_monthly_complaint_trends(df),
        "resolution_metrics": get_resolution_metrics(df),
        **generate_decision_support_intelligence(df),
        "time_trends": {
            "daily": get_time_based_trends(df, freq='D'),
            "weekly": get_time_based_trends(df, freq='W'),
            "monthly": get_time_based_trends(df, freq='M'),
        },
        "recurring_issues": detect_recurring_issues(df),
    }
