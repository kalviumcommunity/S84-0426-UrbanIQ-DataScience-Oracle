from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
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


class ComplaintCreateRequest(BaseModel):
  title: str = Field(..., min_length=1)
  category: str = Field(..., min_length=1)
  area: str = Field(..., min_length=1)
  details: str = Field(..., min_length=1)
  submittedBy: str = Field(..., min_length=1)
  location: Optional[str] = None
  priority: str = Field(default="medium")
  assignedTo: str = Field(default="Unassigned")
  imageUrl: Optional[str] = None


class AssignComplaintRequest(BaseModel):
  assignedTo: str = Field(..., min_length=1)


def _complaints_store_path() -> str:
  return os.path.join(os.path.dirname(__file__), '..', 'data', 'complaints_store.json')


def _sample_complaints_path() -> str:
  return os.path.join(os.path.dirname(__file__), '..', 'data', 'sample_complaints.json')


def _iso_now() -> str:
  return datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')


def _add_history_entry(history: List[Dict[str, str]], stage: str, at: str) -> List[Dict[str, str]]:
  if any(entry.get('stage') == stage for entry in history):
    return history
  return [*history, {'stage': stage, 'at': at}]


def _build_default_history(created_at: str, status: str, resolved_at: Optional[str]) -> List[Dict[str, str]]:
  history: List[Dict[str, str]] = [
    {'stage': 'submitted', 'at': created_at},
    {'stage': 'under-review', 'at': created_at},
  ]
  if status in {'in-progress', 'resolved'}:
    history = _add_history_entry(history, 'in-progress', created_at)
  if status == 'resolved':
    history = _add_history_entry(history, 'resolved', resolved_at or _iso_now())
  return history


def _normalize_complaint(complaint: Dict[str, Any]) -> Dict[str, Any]:
  created_at = complaint.get('createdAt') or _iso_now()
  status = complaint.get('status') or 'pending'
  resolved_at = complaint.get('resolvedAt')
  status_history = complaint.get('statusHistory') or _build_default_history(created_at, status, resolved_at)

  return {
    'id': complaint.get('id'),
    'title': complaint.get('title') or 'Untitled complaint',
    'category': complaint.get('category') or 'Other',
    'area': complaint.get('area') or 'Unknown Area',
    'location': complaint.get('location') or complaint.get('area') or 'Unknown Area',
    'details': complaint.get('details') or '',
    'submittedBy': complaint.get('submittedBy') or 'Anonymous',
    'createdAt': created_at,
    'resolvedAt': resolved_at,
    'status': status,
    'priority': complaint.get('priority') or 'medium',
    'assignedTo': complaint.get('assignedTo') or 'Unassigned',
    'imageUrl': complaint.get('imageUrl'),
    'statusHistory': status_history,
  }


def _seed_from_sample() -> List[Dict[str, Any]]:
  sample_path = _sample_complaints_path()
  with open(sample_path, 'r') as sample_file:
    raw_data = json.load(sample_file)

  seeded: List[Dict[str, Any]] = []
  for index, row in enumerate(raw_data, start=1001):
    created_at = row.get('date') or _iso_now()
    status = row.get('status') or 'pending'
    resolved_at = created_at if status == 'resolved' else None
    details = row.get('complaint_text', '').strip()
    title = details.split('.')[0].strip() or f'Complaint {index}'

    seeded.append(_normalize_complaint({
      'id': f'cmp-{index}',
      'title': title,
      'category': row.get('category') or 'Other',
      'area': row.get('location') or 'Unknown Area',
      'location': row.get('location') or 'Unknown Area',
      'details': details,
      'submittedBy': 'Citizen',
      'createdAt': created_at,
      'resolvedAt': resolved_at,
      'status': status,
      'priority': 'medium',
      'assignedTo': 'Unassigned',
      'imageUrl': None,
    }))

  return seeded


def _read_complaints_store() -> List[Dict[str, Any]]:
  store_path = _complaints_store_path()
  if not os.path.exists(store_path):
    seeded = _seed_from_sample()
    _write_complaints_store(seeded)
    return seeded

  with open(store_path, 'r') as store_file:
    data = json.load(store_file)

  if not isinstance(data, list):
    seeded = _seed_from_sample()
    _write_complaints_store(seeded)
    return seeded

  return [_normalize_complaint(item) for item in data]


def _write_complaints_store(complaints: List[Dict[str, Any]]) -> None:
  store_path = _complaints_store_path()
  with open(store_path, 'w') as store_file:
    json.dump(complaints, store_file, indent=2)


def _sorted_complaints_desc(complaints: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
  return sorted(complaints, key=lambda complaint: complaint.get('createdAt', ''), reverse=True)


def _get_dashboard_metrics(complaints: List[Dict[str, Any]]) -> Dict[str, Any]:
  total = len(complaints)
  resolved = len([c for c in complaints if c.get('status') == 'resolved'])
  pending = len([c for c in complaints if c.get('status') == 'pending'])
  in_progress = len([c for c in complaints if c.get('status') == 'in-progress'])
  resolution_rate = round((resolved / total) * 100) if total else 0

  resolved_with_time = []
  for complaint in complaints:
    if complaint.get('status') != 'resolved' or not complaint.get('resolvedAt'):
      continue
    try:
      opened_at = datetime.fromisoformat(complaint['createdAt'].replace('Z', '+00:00'))
      closed_at = datetime.fromisoformat(complaint['resolvedAt'].replace('Z', '+00:00'))
      days = max((closed_at - opened_at).total_seconds() / (60 * 60 * 24), 0)
      resolved_with_time.append(days)
    except Exception:
      continue

  avg_days = (sum(resolved_with_time) / len(resolved_with_time)) if resolved_with_time else 0

  return {
    'total': total,
    'resolved': resolved,
    'pending': pending,
    'inProgress': in_progress,
    'resolutionRate': resolution_rate,
    'averageResolutionTime': f'{avg_days:.1f} days',
  }


def _group_monthly(complaints: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
  month_names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  buckets = [{'month': month, 'value': 0} for month in month_names]

  for complaint in complaints:
    try:
      date_obj = datetime.fromisoformat(complaint.get('createdAt', '').replace('Z', '+00:00'))
      buckets[date_obj.month - 1]['value'] += 1
    except Exception:
      continue

  return buckets


def _group_categories(complaints: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
  palette = ['#2ca8a1', '#2d9bd0', '#f2ac24', '#30b27a', '#7a5ac8', '#9ca3af']
  category_counts: Dict[str, int] = {}
  for complaint in complaints:
    category = complaint.get('category') or 'Other'
    category_counts[category] = category_counts.get(category, 0) + 1

  grouped: List[Dict[str, Any]] = []
  for index, (name, value) in enumerate(category_counts.items()):
    grouped.append({'name': name, 'value': value, 'fill': palette[index % len(palette)]})
  return grouped


def _success_response(message: str, data: Any) -> Dict[str, Any]:
  return {
    'status': 'success',
    'message': message,
    'data': data,
  }


def _insights_source_data() -> List[Dict[str, Any]]:
  # Use the same JSON complaint flow used by operational complaint routes.
  complaints = _read_complaints_store()
  return [
    {
      'complaint_text': complaint.get('details') or complaint.get('title') or '',
      'category': complaint.get('category'),
      'location': complaint.get('location') or complaint.get('area'),
      'date': complaint.get('createdAt'),
      'status': complaint.get('status'),
    }
    for complaint in complaints
  ]


def _insights_analysis_source_data() -> List[Dict[str, Any]]:
  complaints = _read_complaints_store()
  return [
    {
      'complaint_text': complaint.get('details') or complaint.get('title') or '',
      'category': complaint.get('category'),
      'area': complaint.get('area') or complaint.get('location'),
      'location': complaint.get('location') or complaint.get('area'),
      'date': complaint.get('createdAt'),
      'createdAt': complaint.get('createdAt'),
      'resolvedAt': complaint.get('resolvedAt'),
      'status': complaint.get('status'),
    }
    for complaint in complaints
  ]


@router.get('/dashboard', tags=['Dashboard'])
async def get_dashboard_data():
  complaints = _sorted_complaints_desc(_read_complaints_store())
  return {
    'metrics': _get_dashboard_metrics(complaints),
    'monthlyTrend': _group_monthly(complaints),
    'categoryBreakdown': _group_categories(complaints),
    'allComplaints': complaints,
    'recentComplaints': complaints[:6],
  }


@router.get('/complaints', tags=['Complaints'])
async def get_complaints():
  complaints = _sorted_complaints_desc(_read_complaints_store())
  return {'count': len(complaints), 'data': complaints}


@router.post('/complaints', tags=['Complaints'])
async def create_complaint(payload: ComplaintCreateRequest):
  complaints = _read_complaints_store()
  created_at = _iso_now()
  complaint = _normalize_complaint({
    'id': f'cmp-{int(datetime.now(timezone.utc).timestamp() * 1000)}',
    'title': payload.title.strip(),
    'category': payload.category.strip(),
    'area': payload.area.strip(),
    'location': (payload.location or payload.area).strip(),
    'details': payload.details.strip(),
    'submittedBy': payload.submittedBy.strip(),
    'createdAt': created_at,
    'status': 'pending',
    'priority': payload.priority,
    'assignedTo': payload.assignedTo,
    'imageUrl': payload.imageUrl,
    'statusHistory': [
      {'stage': 'submitted', 'at': created_at},
      {'stage': 'under-review', 'at': created_at},
    ],
  })

  next_complaints = [complaint, *complaints]
  _write_complaints_store(next_complaints)
  return complaint


@router.patch('/complaints/{complaint_id}/resolve', tags=['Complaints'])
async def resolve_complaint(complaint_id: str):
  complaints = _read_complaints_store()
  resolved_at = _iso_now()
  updated = None
  next_complaints: List[Dict[str, Any]] = []

  for complaint in complaints:
    if complaint.get('id') != complaint_id:
      next_complaints.append(complaint)
      continue

    history = complaint.get('statusHistory') or _build_default_history(
      complaint.get('createdAt') or resolved_at,
      complaint.get('status') or 'pending',
      complaint.get('resolvedAt'),
    )
    history = _add_history_entry(history, 'in-progress', resolved_at)
    history = _add_history_entry(history, 'resolved', resolved_at)

    updated = _normalize_complaint({
      **complaint,
      'status': 'resolved',
      'resolvedAt': resolved_at,
      'statusHistory': history,
    })
    next_complaints.append(updated)

  if not updated:
    raise HTTPException(status_code=404, detail='Complaint not found')

  _write_complaints_store(next_complaints)
  return updated


@router.patch('/complaints/{complaint_id}/assign', tags=['Complaints'])
async def assign_complaint(complaint_id: str, payload: AssignComplaintRequest):
  complaints = _read_complaints_store()
  updated = None
  next_complaints: List[Dict[str, Any]] = []

  for complaint in complaints:
    if complaint.get('id') != complaint_id:
      next_complaints.append(complaint)
      continue

    updated = _normalize_complaint({
      **complaint,
      'assignedTo': payload.assignedTo,
    })
    next_complaints.append(updated)

  if not updated:
    raise HTTPException(status_code=404, detail='Complaint not found')

  _write_complaints_store(next_complaints)
  return updated


@router.patch('/complaints/actions/review-pending', tags=['Complaints'])
async def mark_pending_as_reviewed():
  complaints = _read_complaints_store()
  reviewed_at = _iso_now()
  updated_count = 0
  next_complaints: List[Dict[str, Any]] = []

  for complaint in complaints:
    if complaint.get('status') != 'pending':
      next_complaints.append(complaint)
      continue

    updated_count += 1
    history = complaint.get('statusHistory') or _build_default_history(
      complaint.get('createdAt') or reviewed_at,
      complaint.get('status') or 'pending',
      complaint.get('resolvedAt'),
    )
    history = _add_history_entry(history, 'in-progress', reviewed_at)

    next_complaints.append(_normalize_complaint({
      **complaint,
      'status': 'in-progress',
      'statusHistory': history,
    }))

  _write_complaints_store(next_complaints)
  return {'updatedCount': updated_count}


@router.delete('/complaints/{complaint_id}', tags=['Complaints'])
async def delete_complaint(complaint_id: str):
  complaints = _read_complaints_store()
  next_complaints = [complaint for complaint in complaints if complaint.get('id') != complaint_id]
  if len(next_complaints) == len(complaints):
    raise HTTPException(status_code=404, detail='Complaint not found')

  _write_complaints_store(next_complaints)
  return {'success': True, 'id': complaint_id}

def get_dummy_data() -> List[Dict[str, Any]]:
  """Legacy helper retained for compatibility; now delegates to unified JSON complaint flow."""
  data = _insights_source_data()
  if not data:
    raise HTTPException(status_code=404, detail="No complaints found in the dataset.")
  return data

@router.get("/insights/raw-complaints", tags=["Insights"])
async def get_all_raw_complaints():
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
    try:
      data = get_dummy_data()
      return _success_response(
        "Raw complaints fetched successfully.",
        {"count": len(data), "items": data},
      )
    except HTTPException:
      raise
    except Exception as exc:
      raise HTTPException(status_code=500, detail=f"Failed to fetch raw complaints: {str(exc)}")

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
    try:
      data = get_dummy_data()
      df = load_and_clean_data(data)
      if df.empty:
        raise HTTPException(status_code=404, detail="No valid data available to analyze.")

      top_issues = get_top_categories(df, top_n)
      return _success_response(
        "Top issues generated successfully.",
        {"top_issues": top_issues},
      )
    except HTTPException:
      raise
    except Exception as exc:
      raise HTTPException(status_code=500, detail=f"Failed to generate top issues: {str(exc)}")

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
    try:
      data = get_dummy_data()
      df = load_and_clean_data(data)
      if df.empty:
        raise HTTPException(status_code=404, detail="No valid data available to analyze.")

      area_wise = get_area_wise_complaints(df, top_n)
      return _success_response(
        "Area-wise analysis generated successfully.",
        {"area_wise": area_wise},
      )
    except HTTPException:
      raise
    except Exception as exc:
      raise HTTPException(status_code=500, detail=f"Failed to generate area-wise analysis: {str(exc)}")

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
    try:
      data = get_dummy_data()
      df = load_and_clean_data(data)
      if df.empty:
        raise HTTPException(status_code=404, detail="No valid data available to analyze.")

      normalized_freq = (freq or 'D').upper()
      if normalized_freq not in {'D', 'W', 'M'}:
        raise HTTPException(status_code=400, detail="Invalid freq. Use 'D' for daily, 'W' for weekly, or 'M' for monthly.")

      trends = get_time_based_trends(df, freq=normalized_freq)
      label = 'daily' if normalized_freq == 'D' else 'weekly' if normalized_freq == 'W' else 'monthly'
      return _success_response(
        f"{label.title()} trend generated successfully.",
        {"frequency": normalized_freq, "trends": trends},
      )
    except HTTPException:
      raise
    except Exception as exc:
      raise HTTPException(status_code=500, detail=f"Failed to generate trends: {str(exc)}")

@router.get("/insights/summary", tags=["Insights"])
async def get_summary():
    """
    Get a complete summary report of all insights combined.
    """
    try:
      data = _insights_analysis_source_data()
      report = generate_full_report(data)
      return _success_response(
        "Insights summary generated successfully.",
        report,
      )
    except HTTPException:
      raise
    except Exception as exc:
      raise HTTPException(status_code=500, detail=f"Failed to generate summary: {str(exc)}")
