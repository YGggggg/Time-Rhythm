from typing import List, Optional
from datetime import date, datetime, timedelta

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from fastapi import HTTPException, status

from app.models.task import Task
from app.schemas.task import TaskCreate, TaskUpdate, TaskDecomposeRequest, TaskDecomposeOut, SubTaskSuggestion
from app.services import ai_service


async def _check_conflict(
    db: AsyncSession,
    user_id: str,
    start_time: datetime,
    duration_minutes: int,
    exclude_id: Optional[str] = None,
) -> None:
    """Raise 409 if any top-level task overlaps with [start_time, end_time)."""
    end_time = start_time + timedelta(minutes=duration_minutes)
    task_date = start_time.date()
    day_start = datetime.combine(task_date, datetime.min.time())
    day_end = datetime.combine(task_date, datetime.max.time())

    result = await db.execute(
        select(Task).where(
            and_(
                Task.user_id == user_id,
                Task.parent_id.is_(None),
                Task.start_time >= day_start,
                Task.start_time <= day_end,
            )
        )
    )
    existing = result.scalars().all()
    for t in existing:
        if exclude_id and t.id == exclude_id:
            continue
        t_end = t.start_time + timedelta(minutes=t.duration_minutes)
        if start_time < t_end and end_time > t.start_time:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"时间冲突：与任务「{t.title}」重叠",
            )


async def create_task(db: AsyncSession, user_id: str, data: TaskCreate) -> Task:
    # Conflict check (top-level tasks only)
    if not data.parent_id:
        await _check_conflict(db, user_id, data.start_time, data.duration_minutes)

    # Assign order_index as max + 1 for that day
    task_date = data.start_time.date()
    day_start = datetime.combine(task_date, datetime.min.time())
    day_end = datetime.combine(task_date, datetime.max.time())

    result = await db.execute(
        select(Task)
        .where(and_(Task.user_id == user_id, Task.start_time >= day_start, Task.start_time <= day_end))
        .order_by(Task.order_index.desc())
        .limit(1)
    )
    last_task = result.scalar_one_or_none()
    order_index = (last_task.order_index + 1) if last_task else 0

    task = Task(
        user_id=user_id,
        title=data.title,
        start_time=data.start_time,
        duration_minutes=data.duration_minutes,
        color=data.color,
        order_index=order_index,
        energy_level=data.energy_level,
        parent_id=data.parent_id,
    )
    db.add(task)
    await db.flush()
    await db.refresh(task)
    return task


async def get_tasks_by_date(db: AsyncSession, user_id: str, task_date: date) -> List[Task]:
    day_start = datetime.combine(task_date, datetime.min.time())
    day_end = datetime.combine(task_date, datetime.max.time())

    # Fetch top-level tasks for the day
    top_result = await db.execute(
        select(Task)
        .where(and_(
            Task.user_id == user_id,
            Task.parent_id.is_(None),
            Task.start_time >= day_start,
            Task.start_time <= day_end,
        ))
    )
    top_tasks = list(top_result.scalars().all())

    # Fetch all child tasks of those top-level tasks (may span midnight)
    child_tasks: List[Task] = []
    if top_tasks:
        top_ids = [t.id for t in top_tasks]
        child_result = await db.execute(
            select(Task).where(and_(
                Task.user_id == user_id,
                Task.parent_id.in_(top_ids),
            ))
        )
        child_tasks = list(child_result.scalars().all())

    all_tasks = top_tasks + child_tasks
    all_tasks.sort(key=lambda t: t.start_time)
    return all_tasks


async def update_task(db: AsyncSession, user_id: str, task_id: str, data: TaskUpdate) -> Task:
    result = await db.execute(select(Task).where(and_(Task.id == task_id, Task.user_id == user_id)))
    task = result.scalar_one_or_none()
    if task is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    update_data = data.model_dump(exclude_unset=True)

    # Re-validate cross-midnight if time fields are updated
    new_start = update_data.get("start_time", task.start_time)
    new_duration = update_data.get("duration_minutes", task.duration_minutes)

    # Conflict check for top-level tasks
    if task.parent_id is None and ('start_time' in update_data or 'duration_minutes' in update_data):
        await _check_conflict(db, user_id, new_start, new_duration, exclude_id=task_id)

    for field, value in update_data.items():
        setattr(task, field, value)

    await db.flush()
    await db.refresh(task)
    return task


async def delete_task(db: AsyncSession, user_id: str, task_id: str) -> None:
    result = await db.execute(select(Task).where(and_(Task.id == task_id, Task.user_id == user_id)))
    task = result.scalar_one_or_none()
    if task is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    await db.delete(task)


async def get_decompose_suggestions(
    db: AsyncSession,
    user_id: str,
    task_id: str,
    data: TaskDecomposeRequest,
) -> TaskDecomposeOut:
    result = await db.execute(select(Task).where(and_(Task.id == task_id, Task.user_id == user_id)))
    task = result.scalar_one_or_none()
    if task is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    subtasks = await ai_service.decompose_task_with_ai(
        objective=task.title,
        duration_minutes=task.duration_minutes,
        hint=data.hint,
        max_subtasks=data.max_subtasks,
    )
    return TaskDecomposeOut(
        original_task_id=task_id,
        subtasks=[
            SubTaskSuggestion(
                title=s.title,
                duration_minutes=s.duration_minutes,
                energy_level=s.energy_level,
                color=s.color,
            )
            for s in subtasks
        ],
    )
