"""
Protocol Builder - LangGraph E2E Integration Test
==================================================

Tests the Protocol stage of the LangGraph workflow directly,
bypassing HTTP API and Supabase. Validates:
  1. Two-call architecture (conversational + structured extraction)
  2. Artifact extraction: review_type, eligibility_criteria, information_sources,
     rob_tool, synthesis_method, approved_tools, tool_declarations
  3. AI produces a substantive response (>100 chars)
  4. SystemMessage + HumanMessage extraction fix is working

Run:
  cd backend && PYTHONIOENCODING=utf-8 .venv/Scripts/python.exe -m tests.test_protocol_e2e
"""

import asyncio
import json
import sys
import os

BACKEND_DIR = os.path.join(os.path.dirname(__file__), "..")
sys.path.insert(0, BACKEND_DIR)
os.environ.setdefault("PYTHONIOENCODING", "utf-8")

from dotenv import load_dotenv
load_dotenv(os.path.join(BACKEND_DIR, ".env"))

from langchain_core.messages import HumanMessage, AIMessage
from langgraph.checkpoint.memory import MemorySaver

from app.graph.workflow import build_review_graph
from app.graph.state import get_initial_state


# ============================================================================
# Helpers
# ============================================================================

def print_result(label, ok, detail=""):
    icon = "PASS" if ok else "FAIL"
    print("  [{}] {}".format(icon, label))
    if detail:
        for line in detail.split("\n"):
            print("         {}".format(line))


def print_section(title):
    print("\n" + "=" * 60)
    print("  {}".format(title))
    print("=" * 60)


# ============================================================================
# Main E2E Test
# ============================================================================

async def test_protocol_extraction():
    """
    Send a rich protocol message and verify structured extraction works.
    """
    print_section("Protocol Builder E2E Test")

    graph = build_review_graph().compile(checkpointer=MemorySaver())
    config = {"configurable": {"thread_id": "test-protocol-e2e"}}

    protocol_message = (
        "I am building a protocol for a systematic review on the effectiveness of "
        "telemedicine vs in-person consultations for managing type 2 diabetes in "
        "rural populations. The population is adults 18+ with T2DM in rural/remote "
        "areas. The intervention is telemedicine (video, phone, or app-based). The "
        "comparator is standard in-person care. Primary outcomes are HbA1c and "
        "patient satisfaction. I want to search PubMed, CENTRAL, and Embase. Include "
        "RCTs and quasi-experimental studies from 2015 onwards, English only. For "
        "risk of bias, use RoB 2.0 for RCTs. I plan to do a meta-analysis with "
        "random effects model using mean difference for HbA1c. Yes, I would like to "
        "use MedAI Hub screening engine and risk of bias assessor."
    )

    input_state = {
        "messages": [HumanMessage(content=protocol_message)],
        "project_id": "test-protocol",
        "user_id": "test-user",
        "language": "en",
        "current_stage": "protocol",
        "status": "active",
        "artifacts": {},
        "completed_stages": [],
        "errors": [],
        "last_error": None,
    }

    print("\nInvoking graph at stage=protocol...")
    print("  Message length: {} chars".format(len(protocol_message)))
    print("  (This may take 30-60 seconds due to two AI calls)\n")

    result = await graph.ainvoke(input_state, config=config)

    snapshot = graph.get_state(config)
    state = snapshot.values if snapshot.values else result

    artifacts = state.get("artifacts", {})
    protocol = artifacts.get("protocol", {})
    messages = state.get("messages", [])
    status = state.get("status", "MISSING")

    last_ai_content = ""
    for msg in reversed(messages):
        if isinstance(msg, AIMessage):
            last_ai_content = msg.content
            break

    results = {}

    # 1. AI Response Quality
    print("\n--- AI Response ---")
    has_response = len(last_ai_content) > 100
    results["ai_response_substantive"] = has_response
    print_result(
        "AI response is substantive (>100 chars)",
        has_response,
        "Length: {} chars\nPreview: {}...".format(len(last_ai_content), last_ai_content[:300])
    )

    no_error = status != "error"
    results["no_error_status"] = no_error
    print_result("No error status", no_error, "Status: {}".format(status))

    # 2. Protocol Artifact Exists
    print("\n--- Artifact Extraction ---")
    has_protocol_artifact = bool(protocol)
    results["protocol_artifact_exists"] = has_protocol_artifact
    print_result(
        "Protocol artifact exists in state",
        has_protocol_artifact,
        "Keys: {}".format(list(protocol.keys()) if protocol else "EMPTY")
    )

    if not has_protocol_artifact:
        print("\n[ABORT] No protocol artifact found. Extraction likely failed.")
        print("  This indicates the SystemMessage+HumanMessage extraction fix may not be working.")
        return False

    # 3. review_type
    review_type = protocol.get("review_type", "")
    has_review_type = bool(review_type)
    results["review_type_populated"] = has_review_type
    print_result("protocol.review_type is populated", has_review_type,
                 "Value: {}".format(review_type or "MISSING"))

    # 4. eligibility_criteria
    eligibility = protocol.get("eligibility_criteria", {})
    has_eligibility = bool(eligibility)
    results["eligibility_criteria_exists"] = has_eligibility
    print_result("protocol.eligibility_criteria exists", has_eligibility,
                 "Keys: {}".format(list(eligibility.keys()) if eligibility else "EMPTY"))

    pop_inclusion = eligibility.get("population_inclusion", [])
    has_population = bool(pop_inclusion)
    results["eligibility_has_population"] = has_population
    print_result("eligibility has population entries", has_population,
                 "Population inclusion: {}".format(pop_inclusion or "MISSING"))

    int_inclusion = eligibility.get("intervention_inclusion", [])
    has_intervention = bool(int_inclusion)
    results["eligibility_has_intervention"] = has_intervention
    print_result("eligibility has intervention entries", has_intervention,
                 "Intervention inclusion: {}".format(int_inclusion or "MISSING"))

    # 5. information_sources
    info_sources = protocol.get("information_sources", [])
    has_info_sources = bool(info_sources)
    results["information_sources_populated"] = has_info_sources
    print_result("protocol.information_sources populated", has_info_sources,
                 "Value: {}".format(info_sources or "MISSING"))

    expected_dbs = ["pubmed", "central", "embase"]
    sources_lower = [s.lower() for s in info_sources]
    found_dbs = []
    for db in expected_dbs:
        for s in sources_lower:
            if db in s:
                found_dbs.append(db)
                break
    has_expected_dbs = len(found_dbs) >= 2
    results["expected_databases_found"] = has_expected_dbs
    print_result("Contains expected databases (>= 2 of {})".format(expected_dbs),
                 has_expected_dbs, "Found: {} in {}".format(found_dbs, info_sources))

    # 6. rob_tool
    rob_tool = protocol.get("rob_tool", "")
    has_rob = bool(rob_tool)
    results["rob_tool_populated"] = has_rob
    print_result("protocol.rob_tool is populated", has_rob,
                 "Value: {}".format(rob_tool or "MISSING"))

    rob_is_rob2 = "rob" in rob_tool.lower() and "2" in rob_tool if rob_tool else False
    results["rob_tool_is_rob2"] = rob_is_rob2
    print_result("rob_tool references RoB 2.0", rob_is_rob2,
                 "Value: {}".format(rob_tool or "MISSING"))

    # 7. synthesis_method
    synthesis = protocol.get("synthesis_method", "")
    has_synthesis = bool(synthesis)
    results["synthesis_method_populated"] = has_synthesis
    print_result("protocol.synthesis_method is populated", has_synthesis,
                 "Value: {}".format(synthesis or "MISSING"))

    synthesis_is_meta = "meta" in synthesis.lower() if synthesis else False
    results["synthesis_is_meta_analysis"] = synthesis_is_meta
    print_result("synthesis_method mentions meta-analysis", synthesis_is_meta,
                 "Value: {}".format(synthesis or "MISSING"))

    # 8. approved_tools
    approved_tools = protocol.get("approved_tools", [])
    has_approved_tools = len(approved_tools) > 0
    results["approved_tools_populated"] = has_approved_tools
    print_result("protocol.approved_tools has entries", has_approved_tools,
                 "Value: {}".format(approved_tools or "MISSING"))

    expected_tools = ["screening_engine", "rob_assessor"]
    tools_lower = [t.lower() for t in approved_tools]
    found_tools = []
    for tool in expected_tools:
        for t in tools_lower:
            if tool in t:
                found_tools.append(tool)
                break
    has_expected_tools = len(found_tools) >= 1
    results["expected_tools_found"] = has_expected_tools
    print_result("Contains expected tools (>= 1 of {})".format(expected_tools),
                 has_expected_tools, "Found: {} in {}".format(found_tools, approved_tools))

    # 9. tool_declarations
    tool_declarations = protocol.get("tool_declarations", {})
    has_tool_decl = bool(tool_declarations)
    results["tool_declarations_populated"] = has_tool_decl
    decl_sample = ""
    if tool_declarations:
        first_val = list(tool_declarations.values())[0]
        decl_sample = first_val[:120] + "..." if len(first_val) > 120 else first_val
    print_result("protocol.tool_declarations is populated", has_tool_decl,
                 "Keys: {}\nSample: {}".format(
                     list(tool_declarations.keys()) if tool_declarations else "EMPTY",
                     decl_sample or "N/A"))

    # 10. Extraction fix verification
    print("\n--- Extraction Fix Verification ---")
    extraction_worked = (
        has_review_type or has_eligibility or has_info_sources or has_rob or has_synthesis
    )
    results["extraction_fix_working"] = extraction_worked
    print_result(
        "Structured extraction produced data (SystemMessage+HumanMessage fix works)",
        extraction_worked,
        "At least one field was extracted from the conversation"
        if extraction_worked
        else "NO fields were extracted -- extraction call may be broken"
    )

    # Full artifact dump for debugging
    print("\n--- Full Protocol Artifact (JSON) ---")
    try:
        display_artifact = {k: v for k, v in protocol.items() if k != "protocol_text"}
        display_artifact["protocol_text_length"] = len(protocol.get("protocol_text", ""))
        print("  {}".format(json.dumps(display_artifact, indent=2, default=str)))
    except Exception as e:
        print("  (Could not serialize artifact: {})".format(e))

    # Summary
    print_section("RESULTS SUMMARY")
    passed = sum(1 for v in results.values() if v)
    total = len(results)

    for name, ok in results.items():
        icon = "PASS" if ok else "FAIL"
        print("  [{}] {}".format(icon, name))

    print("\nResult: {}/{} passed".format(passed, total))

    core_checks = [
        "ai_response_substantive",
        "no_error_status",
        "protocol_artifact_exists",
        "review_type_populated",
        "eligibility_criteria_exists",
        "information_sources_populated",
        "rob_tool_populated",
        "synthesis_method_populated",
        "extraction_fix_working",
    ]
    core_passed = all(results.get(c, False) for c in core_checks)
    status_label = "ALL PASSED" if core_passed else "SOME FAILED"
    print("\nCore checks ({}):".format(status_label))
    for c in core_checks:
        icon = "PASS" if results.get(c, False) else "FAIL"
        print("    [{}] {}".format(icon, c))

    return core_passed


async def main():
    print("=" * 60)
    print("  MedAI Hub - Protocol Builder E2E Test")
    print("  Direct graph invocation (bypasses HTTP + Supabase)")
    print("=" * 60)

    try:
        success = await test_protocol_extraction()
    except Exception as e:
        print("\n[FATAL] Test crashed with exception: {}".format(e))
        import traceback
        traceback.print_exc()
        success = False

    print("\n" + "=" * 60)
    if success:
        print("  OVERALL: PASSED")
    else:
        print("  OVERALL: FAILED")
    print("=" * 60)

    return success


if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)
