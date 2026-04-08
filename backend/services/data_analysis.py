import pandas as pd
import numpy as np
from typing import List, Dict, Any

def load_and_clean_data(raw_data: List[Dict[str, Any]]) -> pd.DataFrame:
    """
    Loads raw list of dictionaries (from MongoDB or JSON) into a Pandas DataFrame 
    and applies standard cleaning operations.
    """
    if not raw_data:
        return pd.DataFrame()
        
    df = pd.DataFrame(raw_data)
    
    # 1. Handle missing/null values
    # Fill missing text fields with 'Unknown'
    df['category'] = df.get('category', pd.Series(dtype='str')).replace([np.nan, None], 'Unknown')
    df['location'] = df.get('location', pd.Series(dtype='str')).replace([np.nan, None], 'Unknown')
    df['status'] = df.get('status', pd.Series(dtype='str')).replace([np.nan, None], 'unknown')
    
    # Process dates, dropping rows where date is entirely unparseable/missing
    if 'date' in df.columns:
        df['date'] = pd.to_datetime(df['date'], errors='coerce')
        df.dropna(subset=['date'], inplace=True)
        
    # 2. Standardize text fields (Trim whitespace, normalize casing)
    df['category'] = df['category'].astype(str).str.strip().str.title()
    df['location'] = df['location'].astype(str).str.strip().str.title()
    df['status'] = df['status'].astype(str).str.strip().str.lower()
    
    return df

def get_top_categories(df: pd.DataFrame, top_n: int = 5) -> Dict[str, int]:
    """
    Calculates the most frequent complaint categories.
    """
    if df.empty or 'category' not in df.columns:
        return {}
    
    # Get value counts, take top N, and convert to native python dictionary
    counts = df['category'].value_counts().head(top_n)
    return counts.to_dict()

def get_area_wise_complaints(df: pd.DataFrame, top_n: int = 5) -> Dict[str, int]:
    """
    Finds the locations with the highest volume of complaints.
    """
    if df.empty or 'location' not in df.columns:
        return {}
        
    counts = df['location'].value_counts().head(top_n)
    return counts.to_dict()

def get_time_based_trends(df: pd.DataFrame, freq: str = 'D') -> Dict[str, int]:
    """
    Analyzes complaint volume over time.
    `freq` can be 'D' (daily), 'W' (weekly), 'M' (monthly).
    """
    if df.empty or 'date' not in df.columns:
        return {}
        
    # Set date as index to utilize Pandas time-series resampling
    df_temp = df.set_index('date')
    
    # Resample by frequency and count the number of complaints in each period
    trend = df_temp.resample(freq).size()
    
    # Convert Timestamp index to string formatting for JSON serialization
    trend.index = trend.index.strftime('%Y-%m-%d')
    
    return trend.to_dict()
    
def generate_full_report(raw_data: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Main wrapper function to generate a complete analytics report from raw data.
    """
    df = load_and_clean_data(raw_data)
    
    if df.empty:
        return {"error": "No valid data available to analyze"}
        
    return {
        "total_complaints": len(df),
        "top_categories": get_top_categories(df),
        "top_locations": get_area_wise_complaints(df),
        "time_trends_daily": get_time_based_trends(df, freq='D')
    }
