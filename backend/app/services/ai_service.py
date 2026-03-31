from __future__ import annotations

from typing import List, Optional, TypedDict

from langchain_openai import ChatOpenAI
from langgraph.graph import END, START, StateGraph
from pydantic import BaseModel, Field

from app.config import settings


MORANDI_COLORS = [
    "#A8B5A2", "#B5A8B0", "#A8B0B5", "#B5B3A8", "#B5A8A8", "#A8B5B3",
]


class _SubTask(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    duration_minutes: int = Field(..., ge=5, le=480)
    energy_level: int = Field(..., ge=1, le=5)
    color: str = Field(..., pattern=r"^#[0-9A-Fa-f]{6}$")


class _Plan(BaseModel):
    subtasks: List[_SubTask]


class _PlanState(TypedDict):
    objective: str
    duration_minutes: int
    hint: Optional[str]
    max_subtasks: int
    subtasks: List[_SubTask]


def _build_decompose_graph(llm: ChatOpenAI):
    structured_llm = llm.with_structured_output(_Plan)

    def planner_node(state: _PlanState) -> dict:
        colors_str = "、".join(MORANDI_COLORS)
        hint_line = f"\n用户补充说明：{state['hint']}" if state.get("hint") else ""
        prompt = (
            f"你是一个专业的任务拆解助手，帮助有执行困难的用户把大任务分解为低心理阻力的小步骤。\n"
            f"将以下任务拆解为 {state['max_subtasks']} 个以内的子任务，总时长约 {state['duration_minutes']} 分钟。"
            f"{hint_line}\n\n"
            f"任务：{state['objective']}\n\n"
            f"要求：\n"
            f"- 每个子任务标题简短具体、可立即执行（避免抽象空话）\n"
            f"- duration_minutes 在 5-120 之间，所有子任务时长之和约等于总时长\n"
            f"- energy_level 1-5（1最轻松，5最耗力），合理分配避免连续高能耗\n"
            f"- color 必须从以下颜色中选择：{colors_str}\n"
            f"- 优先生成 15-30 分钟的小任务"
        )
        result = structured_llm.invoke(prompt)
        return {"subtasks": result.subtasks}

    builder = StateGraph(_PlanState)
    builder.add_node("planner", planner_node)
    builder.add_edge(START, "planner")
    builder.add_edge("planner", END)
    return builder.compile()


_graph = None


def _get_graph():
    global _graph
    if _graph is None:
        llm = ChatOpenAI(
            api_key=settings.ai_api_key,
            base_url=settings.ai_base_url,
            model=settings.ai_model,
            temperature=0.7,
            extra_body={"enable_thinking": False},
        )
        _graph = _build_decompose_graph(llm)
    return _graph


async def decompose_task_with_ai(
    objective: str,
    duration_minutes: int,
    hint: Optional[str],
    max_subtasks: int,
) -> List[_SubTask]:
    graph = _get_graph()
    result = await graph.ainvoke({
        "objective": objective,
        "duration_minutes": duration_minutes,
        "hint": hint,
        "max_subtasks": max_subtasks,
        "subtasks": [],
    })
    return result["subtasks"]
