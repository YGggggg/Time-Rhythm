from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, Field

from app.models.task import TaskStatus


class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    start_time: datetime
    duration_minutes: int = Field(default=30, ge=5, le=480)
    color: str = Field(default="#A8B5A2", pattern=r"^#[0-9A-Fa-f]{6}$")
    energy_level: int = Field(default=2, ge=1, le=5)
    parent_id: Optional[str] = None


class TaskUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    start_time: Optional[datetime] = None
    duration_minutes: Optional[int] = Field(None, ge=5, le=480)
    color: Optional[str] = Field(None, pattern=r"^#[0-9A-Fa-f]{6}$")
    order_index: Optional[int] = None
    status: Optional[TaskStatus] = None
    energy_level: Optional[int] = Field(None, ge=1, le=5)
    parent_id: Optional[str] = None


class TaskOut(BaseModel):
    id: str
    user_id: str
    title: str
    start_time: datetime
    duration_minutes: int
    color: str
    order_index: int
    status: TaskStatus
    energy_level: int
    parent_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class SubTaskSuggestion(BaseModel):
    title: str
    duration_minutes: int = Field(..., ge=5, le=480)
    energy_level: int = Field(..., ge=1, le=5)
    color: str = Field(..., pattern=r"^#[0-9A-Fa-f]{6}$")


class TaskDecomposeRequest(BaseModel):
    hint: Optional[str] = None
    max_subtasks: int = Field(5, ge=2, le=10)


class TaskDecomposeOut(BaseModel):
    original_task_id: str
    subtasks: List[SubTaskSuggestion]
