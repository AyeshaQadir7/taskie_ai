"""
Tools API endpoints - HTTP interface for agent tool invocations.

Provides HTTP endpoints that the agent's tool_invoker can call.
These endpoints wrap the existing task service functionality.
"""

import logging
from typing import Any
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlmodel import Session

from src.database import get_session
from src.services import TaskService

router = APIRouter(prefix="/tools", tags=["Tools"])
logger = logging.getLogger("tools")


def get_task_service(session: Session = Depends(get_session)) -> TaskService:
    """Dependency to get TaskService instance."""
    return TaskService(session)


class ToolRequest(BaseModel):
    """Request body for tool invocations."""
    user_id: str
    arguments: dict[str, Any]


class ToolResponse(BaseModel):
    """Response from tool invocations."""
    status: str  # "success" or "error"
    result: dict[str, Any] | None = None
    error: str | None = None
    error_code: str | None = None


@router.post("/add_task", response_model=ToolResponse)
async def add_task(
    request: ToolRequest,
    service: TaskService = Depends(get_task_service),
):
    """Add a new task for the user."""
    try:
        user_id = request.user_id
        args = request.arguments

        title = args.get("title")
        description = args.get("description", "")

        if not title:
            return ToolResponse(
                status="error",
                error="Title is required",
                error_code="validation_error"
            )

        task = service.create_task(
            user_id=user_id,
            title=title,
            description=description,
        )

        return ToolResponse(
            status="success",
            result={
                "id": task.id,
                "title": task.title,
                "description": task.description,
                "status": task.status,
            }
        )
    except Exception as e:
        logger.error(f"add_task error: {e}")
        return ToolResponse(
            status="error",
            error=str(e),
            error_code="server_error"
        )


@router.post("/list_tasks", response_model=ToolResponse)
async def list_tasks(
    request: ToolRequest,
    service: TaskService = Depends(get_task_service),
):
    """List tasks for the user."""
    try:
        user_id = request.user_id
        args = request.arguments

        status_filter = args.get("status", "all")

        # Map agent status filter to database status
        # Agent uses: "all", "pending", "completed"
        # DB uses: "incomplete", "complete"
        db_status = None
        if status_filter == "pending":
            db_status = "incomplete"
        elif status_filter == "completed":
            db_status = "complete"

        tasks = service.get_tasks_for_user(
            user_id=user_id,
            status=db_status,
        )

        task_list = [
            {
                "id": task.id,
                "title": task.title,
                "description": task.description,
                "status": "completed" if task.status == "complete" else "pending",
                "priority": task.priority or "medium",
            }
            for task in tasks
        ]

        return ToolResponse(
            status="success",
            result={"tasks": task_list}
        )
    except Exception as e:
        logger.error(f"list_tasks error: {e}")
        return ToolResponse(
            status="error",
            error=str(e),
            error_code="server_error"
        )


@router.post("/complete_task", response_model=ToolResponse)
async def complete_task(
    request: ToolRequest,
    service: TaskService = Depends(get_task_service),
):
    """Mark a task as completed."""
    try:
        user_id = request.user_id
        args = request.arguments

        task_id = args.get("task_id")
        if not task_id:
            return ToolResponse(
                status="error",
                error="task_id is required",
                error_code="validation_error"
            )

        # Convert to int if string
        try:
            task_id = int(task_id)
        except (ValueError, TypeError):
            return ToolResponse(
                status="error",
                error=f"Invalid task_id: {task_id}",
                error_code="validation_error"
            )

        # Mark task as complete
        updated_task = service.mark_complete(task_id=task_id, user_id=user_id)
        if not updated_task:
            return ToolResponse(
                status="error",
                error=f"Task {task_id} not found",
                error_code="not_found"
            )

        return ToolResponse(
            status="success",
            result={
                "id": updated_task.id,
                "title": updated_task.title,
                "status": "completed",
            }
        )
    except Exception as e:
        logger.error(f"complete_task error: {e}")
        return ToolResponse(
            status="error",
            error=str(e),
            error_code="server_error"
        )


@router.post("/update_task", response_model=ToolResponse)
async def update_task(
    request: ToolRequest,
    service: TaskService = Depends(get_task_service),
):
    """Update a task's title or description."""
    try:
        user_id = request.user_id
        args = request.arguments

        task_id = args.get("task_id")
        if not task_id:
            return ToolResponse(
                status="error",
                error="task_id is required",
                error_code="validation_error"
            )

        try:
            task_id = int(task_id)
        except (ValueError, TypeError):
            return ToolResponse(
                status="error",
                error=f"Invalid task_id: {task_id}",
                error_code="validation_error"
            )

        # Update fields
        new_title = args.get("title")
        new_description = args.get("description")

        updated_task = service.update_task(
            task_id=task_id,
            user_id=user_id,
            title=new_title,
            description=new_description,
        )

        if not updated_task:
            return ToolResponse(
                status="error",
                error=f"Task {task_id} not found",
                error_code="not_found"
            )

        return ToolResponse(
            status="success",
            result={
                "id": updated_task.id,
                "title": updated_task.title,
                "description": updated_task.description,
            }
        )
    except Exception as e:
        logger.error(f"update_task error: {e}")
        return ToolResponse(
            status="error",
            error=str(e),
            error_code="server_error"
        )


@router.post("/delete_task", response_model=ToolResponse)
async def delete_task(
    request: ToolRequest,
    service: TaskService = Depends(get_task_service),
):
    """Delete a task."""
    try:
        user_id = request.user_id
        args = request.arguments

        task_id = args.get("task_id")
        if not task_id:
            return ToolResponse(
                status="error",
                error="task_id is required",
                error_code="validation_error"
            )

        try:
            task_id = int(task_id)
        except (ValueError, TypeError):
            return ToolResponse(
                status="error",
                error=f"Invalid task_id: {task_id}",
                error_code="validation_error"
            )

        # Get task first for the title
        task = service.get_task_by_id(task_id=task_id, user_id=user_id)
        if not task:
            return ToolResponse(
                status="error",
                error=f"Task {task_id} not found",
                error_code="not_found"
            )

        task_title = task.title
        deleted = service.delete_task(task_id=task_id, user_id=user_id)

        if not deleted:
            return ToolResponse(
                status="error",
                error=f"Failed to delete task {task_id}",
                error_code="server_error"
            )

        return ToolResponse(
            status="success",
            result={
                "id": task_id,
                "title": task_title,
                "deleted": True,
            }
        )
    except Exception as e:
        logger.error(f"delete_task error: {e}")
        return ToolResponse(
            status="error",
            error=str(e),
            error_code="server_error"
        )
