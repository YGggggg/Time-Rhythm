from datetime import date
from typing import List

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.models.user import User
from app.schemas.task import TaskCreate, TaskUpdate, TaskOut, TaskDecomposeRequest, TaskDecomposeOut
from app.schemas.response import Response
from app.services.auth import get_current_user
from app.services import task_service

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.post("", response_model=Response[TaskOut], status_code=status.HTTP_201_CREATED)
async def create_task(
    data: TaskCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = await task_service.create_task(db, current_user.id, data)
    return Response(success=True, data=TaskOut.model_validate(task))


@router.get("", response_model=Response[List[TaskOut]])
async def list_tasks(
    date: date,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    tasks = await task_service.get_tasks_by_date(db, current_user.id, date)
    return Response(success=True, data=[TaskOut.model_validate(t) for t in tasks])


@router.put("/{task_id}", response_model=Response[TaskOut])
async def update_task(
    task_id: str,
    data: TaskUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = await task_service.update_task(db, current_user.id, task_id, data)
    return Response(success=True, data=TaskOut.model_validate(task))


@router.delete("/{task_id}", response_model=Response[None])
async def delete_task(
    task_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await task_service.delete_task(db, current_user.id, task_id)
    return Response(success=True)


@router.post("/{task_id}/decompose", response_model=Response[TaskDecomposeOut])
async def decompose_task(
    task_id: str,
    data: TaskDecomposeRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await task_service.get_decompose_suggestions(db, current_user.id, task_id, data)
    return Response(success=True, data=result)
