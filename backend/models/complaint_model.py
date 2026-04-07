from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class ComplaintBase(BaseModel):
    complaint_text: str = Field(..., description="Details of the municipal grievance")
    category: str = Field(..., description="Category like Roads, Water, Sanitation, etc.")
    location: str = Field(..., description="Location/Address of the issue")
    date: datetime = Field(default_factory=datetime.utcnow, description="Date the complaint was registered")
    status: str = Field(default="pending", description="Current status: pending, in-progress, resolved")

class ComplaintCreate(ComplaintBase):
    """Schema for creating a new complaint"""
    pass

class ComplaintResponse(ComplaintBase):
    """Schema for returning a complaint, includes the MongoDB ID stringified"""
    id: str = Field(..., alias="_id")

    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
