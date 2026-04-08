from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
import json
import os

from services.data_analysis import (
    load_and_clean_data,
    get_top_categories,
    get_area_wise_complaints,
    get_time_based_trends,
    generate_full_report
)

router = APIRouter()

def get_dummy_data() -> List[Dict[str, Any]]:
    """Helper function to load dummy data from the JSON file."""
    file_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'sample_complaints.json')
    try:
        with open(file_path, 'r') as f:
            data = json.load(f)
            if not data:
                raise HTTPException(status_code=404, detail="No complaints found in the dataset.")
            return data
    except FileNotFoundError:
        raise HTTPException(status_code=500, detail="Data file not found. Ensure sample_complaints.json exists.")
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Data file contains invalid JSON.")

@router.get("/complaints", tags=["Complaints"])
async def get_all_complaints():
    """
    Retrieve all raw complaints.
    Example Response:
    {
      "count": 12,
      "data": [
        { "complaint_text": "...", "category": "Roads", ... }
      ]
    }
    """
    data = get_dummy_data()
    return {"count": len(data), "data": data}

@router.get("/insights/top-issues", tags=["Insights"])
async def get_top_issues(top_n: int = 5):
    """
    Get the most frequent municipal complaint categories.
    Example Response:
    {
      "top_issues": {
        "Roads": 3,
        "Sanitation": 2,
        "Parks & Trees": 2
      }
    }
    """
    data = get_dummy_data()
    df = load_and_clean_data(data)
    top_issues = get_top_categories(df, top_n)
    return {"top_issues": top_issues}

@router.get("/insights/area-wise", tags=["Insights"])
async def get_area_wise(top_n: int = 5):
    """
    Get the locations with the highest volume of complaints.
    Example Response:
    {
      "area_wise": {
        "Main St Intersection With 5Th Ave": 1,
        "Oakwood Drive": 1
      }
    }
    """
    data = get_dummy_data()
    df = load_and_clean_data(data)
    area_wise = get_area_wise_complaints(df, top_n)
    return {"area_wise": area_wise}

@router.get("/insights/trends", tags=["Insights"])
async def get_trends(freq: str = 'D'):
    """
    Analyze complaint volume over time.
    `freq` can be 'D' (daily), 'W' (weekly), or 'M' (monthly).
    Example Response:
    {
      "trends": {
        "2026-04-01": 1,
        "2026-04-02": 1,
        "2026-04-03": 1
      }
    }
    """
    data = get_dummy_data()
    df = load_and_clean_data(data)
    trends = get_time_based_trends(df, freq=freq)
    return {"trends": trends}

@router.get("/insights/summary", tags=["Insights"])
async def get_summary():
    """
    Get a complete summary report of all insights combined.
    """
    data = get_dummy_data()
    return generate_full_report(data)
