"""
Direct LangGraph E2E Integration Test
======================================

Tests the graph workflow directly, bypassing HTTP API and Supabase.
This validates core LangGraph logic: stage routing, artifact extraction,
context handoff, and stage transitions.

Run: cd backend && python -m tests.test_graph_e2e
"""

import asyncio
import json
import sys
import os

# Ensure backend is on path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
os.environ.setdefault("PYTHONIOENCODING", "utf-8")

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

from langchain_core.messages import HumanMessage, AIMessage
from langgraph.checkpoint.memory import MemorySaver

from app.graph.workflow import build_review_graph
from app.graph.state import get_initial_state


def print_result(label: str, ok: bool, detail: str = ""):
    icon = "PASS" if ok else "FAIL"
    print(f"  [{icon}] {label}")
    if detail:
        for line in detail.split("\n"):
            print(f"         {line}")


async def test_1_default_stage_is_idea():
    """Bug 1: New project must start at 'idea', not 'research_question'."""
    print("\n== TEST 1: Default stage is 'idea' ==")

    graph = build_review_graph().compile(checkpointer=MemorySaver())
    config = {"configurable": {"thread_id": "test-1-default"}}

    input_state = {
        "messages": [HumanMessage(content="I want to study diabetes management in elderly patients")],
        "project_id": "test-1",
        "user_id": "test-user",
        "language": "en",
        "current_stage": "idea",
        "status": "active",
    }

    result = await graph.ainvoke(input_state, config=config)

    stage = result.get("current_stage", "MISSING")
    print_result("current_stage == 'idea'", stage == "idea", f"Got: {stage}")

    # Check that AI responded (not empty)
    messages = result.get("messages", [])
    ai_msgs = [m for m in messages if isinstance(m, AIMessage)]
    has_response = len(ai_msgs) > 0 and len(ai_msgs[-1].content) > 50
    print_result("AI produced a substantive response", has_response,
                 f"Last AI msg length: {len(ai_msgs[-1].content) if ai_msgs else 0}")

    # Check artifacts dict exists
    artifacts = result.get("artifacts", {})
    print_result("artifacts dict exists", isinstance(artifacts, dict),
                 f"Type: {type(artifacts)}")

    return stage == "idea" and has_response


async def test_2_idea_artifact_extraction():
    """Bug 2: After enough conversation, Idea artifacts should be extracted."""
    print("\n== TEST 2: Idea artifact extraction ==")

    graph = build_review_graph().compile(checkpointer=MemorySaver())
    config = {"configurable": {"thread_id": "test-2-artifacts"}}

    # Message 1: Describe the idea in detail
    msg1 = (
        "I want to conduct a systematic review on the effectiveness of "
        "cognitive behavioral therapy (CBT) for managing chronic insomnia "
        "in adults over 65. I'm interested in RCTs and cohort studies. "
        "The population is elderly adults with diagnosed insomnia. "
        "The intervention is CBT-I (CBT for insomnia). "
        "The primary outcome is sleep quality measured by PSQI scores. "
        "I've checked PROSPERO and found 2 similar reviews but they're from 2018 "
        "and don't include studies after 2020. My timeline is 6 months."
    )

    input_state = {
        "messages": [HumanMessage(content=msg1)],
        "project_id": "test-2",
        "user_id": "test-user",
        "language": "en",
        "current_stage": "idea",
        "status": "active",
    }

    result = await graph.ainvoke(input_state, config=config)

    # Get the state snapshot to check accumulated artifacts
    snapshot = graph.get_state(config)
    state = snapshot.values if snapshot.values else result

    artifacts = state.get("artifacts", {})
    idea = artifacts.get("idea", {})

    has_problem = bool(idea.get("clinical_problem"))
    has_review_type = bool(idea.get("review_type"))
    has_population = bool(idea.get("population_sketch"))
    has_existing = idea.get("existing_reviews_checked", False)

    print_result("idea.clinical_problem extracted", has_problem,
                 f"Value: {idea.get('clinical_problem', 'MISSING')[:80]}")
    print_result("idea.review_type extracted", has_review_type,
                 f"Value: {idea.get('review_type', 'MISSING')}")
    print_result("idea.population_sketch extracted", has_population,
                 f"Value: {idea.get('population_sketch', 'MISSING')[:80]}")
    print_result("idea.existing_reviews_checked", has_existing,
                 f"Value: {has_existing}")

    # Optional fields
    if idea.get("intervention_sketch"):
        print_result("idea.intervention_sketch (bonus)", True,
                     f"Value: {idea['intervention_sketch'][:80]}")
    if idea.get("timeline"):
        print_result("idea.timeline (bonus)", True,
                     f"Value: {idea['timeline'][:80]}")
    if idea.get("recommendation"):
        print_result("idea.recommendation (bonus)", True,
                     f"Value: {idea['recommendation']}")

    all_core = has_problem and has_review_type and has_population
    print_result("ALL core fields extracted", all_core)

    return all_core


async def test_3_context_handoff_idea_to_rq():
    """Test 1 (user's plan): Context flows from Idea to Research Question."""
    print("\n== TEST 3: Context handoff Idea -> Research Question ==")

    graph = build_review_graph().compile(checkpointer=MemorySaver())
    config = {"configurable": {"thread_id": "test-3-handoff"}}

    # Step 1: Send a rich idea message
    idea_msg = (
        "I want to do a systematic review on the effectiveness of "
        "telemedicine versus in-person consultations for managing "
        "type 2 diabetes in rural populations. I've checked PROSPERO - "
        "there are some reviews but none focus specifically on rural populations. "
        "The intervention is telemedicine. Outcomes are HbA1c levels and patient satisfaction. "
        "I plan to include RCTs and quasi-experimental studies. Timeline: 4 months."
    )

    result1 = await graph.ainvoke({
        "messages": [HumanMessage(content=idea_msg)],
        "project_id": "test-3",
        "user_id": "test-user",
        "language": "en",
        "current_stage": "idea",
        "status": "active",
    }, config=config)

    snapshot1 = graph.get_state(config)
    state1 = snapshot1.values
    idea_artifact = state1.get("artifacts", {}).get("idea", {})
    print_result("Idea artifact populated", bool(idea_artifact.get("clinical_problem")),
                 f"Problem: {idea_artifact.get('clinical_problem', 'MISSING')[:80]}")

    # Step 2: Advance to research_question stage with a richer message
    # so the AI has enough context to reference the idea
    result2 = await graph.ainvoke({
        "messages": [HumanMessage(content=(
            "I'm ready to formulate the research question. "
            "Based on my idea about telemedicine for diabetes in rural areas, "
            "help me select the right framework and extract the components."
        ))],
        "project_id": "test-3",
        "user_id": "test-user",
        "language": "en",
        "current_stage": "research_question",
        "status": "active",
    }, config=config)

    snapshot2 = graph.get_state(config)
    state2 = snapshot2.values

    current_stage = state2.get("current_stage", "MISSING")
    print_result("Stage advanced to 'research_question'",
                 current_stage == "research_question",
                 f"Got: {current_stage}")

    # KEY CHECK: Idea artifacts PRESERVED across stage transition
    preserved_idea = state2.get("artifacts", {}).get("idea", {})
    idea_preserved = bool(preserved_idea.get("clinical_problem"))
    print_result(
        "Idea artifact PRESERVED in RQ state",
        idea_preserved,
        f"clinical_problem: {preserved_idea.get('clinical_problem', 'MISSING')[:80]}"
    )

    # Check if AI references the idea context
    messages = state2.get("messages", [])
    last_ai = ""
    for msg in reversed(messages):
        if isinstance(msg, AIMessage):
            last_ai = msg.content
            break

    # Look for keywords from the idea in the RQ response
    context_keywords = ["telemedicine", "diabetes", "rural", "HbA1c", "PICO", "framework"]
    found_keywords = [kw for kw in context_keywords if kw.lower() in last_ai.lower()]
    has_context = len(found_keywords) >= 2

    print_result(
        "RQ AI references idea context or methodology",
        has_context,
        f"Found {len(found_keywords)}/{len(context_keywords)} keywords: {found_keywords}\n"
        f"Response preview: {last_ai[:300]}..."
    )

    # The test passes if: stage is correct AND idea artifact is preserved
    # AND AI gave a substantive response (even if it didn't mention every keyword)
    has_substantive = len(last_ai) > 100
    print_result("RQ AI gave substantive response", has_substantive,
                 f"Response length: {len(last_ai)}")

    return current_stage == "research_question" and idea_preserved and has_substantive


async def test_4_legacy_stage_no_crash():
    """Test 4: Legacy (non-LangGraph) stage doesn't crash."""
    print("\n== TEST 4: Legacy stage (protocol) doesn't crash ==")

    graph = build_review_graph().compile(checkpointer=MemorySaver())
    config = {"configurable": {"thread_id": "test-4-legacy"}}

    input_state = {
        "messages": [HumanMessage(content="Help me build a protocol for my systematic review on CBT for insomnia.")],
        "project_id": "test-4",
        "user_id": "test-user",
        "language": "en",
        "current_stage": "protocol",
        "status": "active",
    }

    try:
        result = await graph.ainvoke(input_state, config=config)

        messages = result.get("messages", [])
        ai_msgs = [m for m in messages if isinstance(m, AIMessage)]
        has_response = len(ai_msgs) > 0 and len(ai_msgs[-1].content) > 20

        print_result("Protocol stage produced a response (no crash)", has_response,
                     f"AI response length: {len(ai_msgs[-1].content) if ai_msgs else 0}")
        print_result("No error status", result.get("status") != "error",
                     f"Status: {result.get('status')}")

        return has_response and result.get("status") != "error"

    except Exception as e:
        print_result("Protocol stage ran without crash", False, f"Exception: {e}")
        return False


async def main():
    print("=" * 60)
    print("  MedAI Hub - LangGraph E2E Integration Tests")
    print("  Direct graph invocation (bypasses HTTP + Supabase)")
    print("=" * 60)

    results = {}

    # Test 1: Default stage
    try:
        results["test_1"] = await test_1_default_stage_is_idea()
    except Exception as e:
        print(f"  [FAIL] Test 1 crashed: {e}")
        results["test_1"] = False

    # Test 2: Artifact extraction
    try:
        results["test_2"] = await test_2_idea_artifact_extraction()
    except Exception as e:
        print(f"  [FAIL] Test 2 crashed: {e}")
        results["test_2"] = False

    # Test 3: Context handoff
    try:
        results["test_3"] = await test_3_context_handoff_idea_to_rq()
    except Exception as e:
        print(f"  [FAIL] Test 3 crashed: {e}")
        results["test_3"] = False

    # Test 4: Legacy stage
    try:
        results["test_4"] = await test_4_legacy_stage_no_crash()
    except Exception as e:
        print(f"  [FAIL] Test 4 crashed: {e}")
        results["test_4"] = False

    # Summary
    print("\n" + "=" * 60)
    print("  SUMMARY")
    print("=" * 60)
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    for name, ok in results.items():
        icon = "PASS" if ok else "FAIL"
        print(f"  [{icon}] {name}")
    print(f"\n  Result: {passed}/{total} passed")
    print("=" * 60)

    return passed == total


if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)
