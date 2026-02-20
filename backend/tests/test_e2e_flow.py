"""
E2E API-level test for the Idea → Research Question flow.
Tests: default stage, SSE streaming, artifact extraction, state persistence.
Run: python tests/test_e2e_flow.py
"""

import asyncio
import json
import httpx
import sys
import os

# Add parent dir to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

BASE = "http://localhost:8002/api/v1"


async def main():
    # In DEBUG mode, backend returns dev user (id=000...000) when no auth header
    headers = {
        "Content-Type": "application/json",
    }

    results = []

    async with httpx.AsyncClient(timeout=30, follow_redirects=True) as client:
        # ── Create test project ──────────────────────────────────
        print("=" * 60)
        print("Creating test project...")
        resp = await client.post(
            f"{BASE}/projects",
            headers=headers,
            json={
                "title": "E2E Test - Ketogenic Diet and Migraine",
                "review_type": "systematic_intervention",
                "framework": "PICO",
            },
        )
        if resp.status_code not in (200, 201):
            print(f"FAIL: Cannot create project: {resp.status_code} {resp.text}")
            return
        project = resp.json()
        project_id = project["id"]
        print(f"Project created: {project_id}")
        print()

        try:
            # ── TEST 1: Default stage = idea ─────────────────────
            print("TEST 1: Default stage should be 'idea'")
            resp = await client.get(
                f"{BASE}/review/state/{project_id}", headers=headers
            )
            state = resp.json()
            stage = state["current_stage"]
            passed = stage == "idea"
            status = "PASS" if passed else "FAIL"
            print(f"  {status}: current_stage = '{stage}'")
            results.append(("Default stage = idea", passed))
            print()

            # ── TEST 2: SSE streaming + artifact extraction ──────
            print("TEST 2: SSE streaming + artifact extraction")
            content_chunks = []
            state_update = None
            error_msg = None

            try:
                async with client.stream(
                    "POST",
                    f"{BASE}/review/stream",
                    headers=headers,
                    json={
                        "project_id": project_id,
                        "message": "I want to study the effect of ketogenic diet on migraine frequency in adults. I've checked PROSPERO and found no existing reviews on this specific topic.",
                        "language": "he",
                    },
                    timeout=120,
                ) as response:
                    print(f"  Stream status: {response.status_code}")

                    async for line in response.aiter_lines():
                        if line.startswith("data: "):
                            data = line[6:]
                            if data == "[DONE]":
                                continue
                            try:
                                parsed = json.loads(data)
                                if parsed.get("type") == "state_update":
                                    state_update = parsed
                                elif parsed.get("content"):
                                    content_chunks.append(parsed["content"])
                                elif parsed.get("error"):
                                    error_msg = parsed["error"]
                            except json.JSONDecodeError:
                                pass
            except Exception as e:
                error_msg = str(e)

            full_response = "".join(content_chunks)
            print(f"  Streamed {len(content_chunks)} chunks, {len(full_response)} chars")

            # Check streaming worked
            streaming_ok = len(full_response) > 50 and not error_msg
            print(
                f"  {'PASS' if streaming_ok else 'FAIL'}: Streaming response"
                + (f" (error: {error_msg})" if error_msg else "")
            )
            results.append(("SSE streaming works", streaming_ok))

            # Check state_update received
            state_update_ok = state_update is not None
            if state_update:
                print(
                    f"  PASS: state_update received (stage={state_update['current_stage']})"
                )
                idea = state_update.get("artifacts", {}).get("idea", {})
                has_problem = bool(idea.get("clinical_problem"))
                has_type = bool(idea.get("review_type"))
                has_pop = bool(idea.get("population_sketch"))
                print(
                    f"  Artifacts: clinical_problem={'YES' if has_problem else 'no'}, "
                    f"review_type={'YES' if has_type else 'no'}, "
                    f"population={'YES' if has_pop else 'no'}"
                )
                if has_problem:
                    print(f"    -> {idea['clinical_problem'][:120]}")
            else:
                print("  FAIL: No state_update event received")
            results.append(("state_update received", state_update_ok))
            print()

            # ── TEST 3: State persistence ────────────────────────
            print("TEST 3: State persisted after message")
            resp = await client.get(
                f"{BASE}/review/state/{project_id}", headers=headers
            )
            state2 = resp.json()
            has_artifacts = bool(state2.get("artifacts", {}).get("idea"))
            has_messages = state2.get("message_count", 0) > 0
            print(
                f"  Stage: {state2['current_stage']} | "
                f"Messages: {state2.get('message_count', 0)} | "
                f"Artifacts: {list(state2.get('artifacts', {}).keys())}"
            )
            print(f"  {'PASS' if has_messages else 'FAIL'}: Messages persisted")
            results.append(("Messages persisted", has_messages))
            print()

            # ── TEST 4: Legacy chat endpoint still works ─────────
            print("TEST 4: Legacy chat endpoint (non-LangGraph)")
            try:
                async with client.stream(
                    "POST",
                    f"{BASE}/chat",
                    headers={
                        **headers,
                        "Accept": "text/event-stream",
                    },
                    json={
                        "messages": [
                            {"role": "user", "content": "Help me build a protocol"}
                        ],
                        "skillName": "protocol-builder",
                        "language": "he",
                    },
                    timeout=60,
                ) as response:
                    legacy_ok = response.status_code == 200
                    legacy_chunks = []
                    async for line in response.aiter_lines():
                        if line.startswith("data: "):
                            data = line[6:]
                            if data == "[DONE]":
                                continue
                            try:
                                parsed = json.loads(data)
                                if parsed.get("content"):
                                    legacy_chunks.append(parsed["content"])
                            except json.JSONDecodeError:
                                pass

                    legacy_response = "".join(legacy_chunks)
                    legacy_streaming = len(legacy_response) > 20
                    print(
                        f"  Status: {response.status_code} | "
                        f"Response: {len(legacy_response)} chars"
                    )
                    print(
                        f"  {'PASS' if legacy_streaming else 'FAIL'}: Legacy chat streams correctly"
                    )
                    results.append(("Legacy chat works", legacy_streaming))
            except Exception as e:
                print(f"  FAIL: Legacy chat error: {e}")
                results.append(("Legacy chat works", False))
            print()

        finally:
            # ── Cleanup ──────────────────────────────────────────
            print("Cleaning up test project...")
            await client.delete(f"{BASE}/projects/{project_id}", headers=headers)

    # ── Summary ──────────────────────────────────────────────────
    print("=" * 60)
    print("E2E TEST SUMMARY")
    print("=" * 60)
    all_pass = True
    for name, passed in results:
        icon = "PASS" if passed else "FAIL"
        print(f"  [{icon}] {name}")
        if not passed:
            all_pass = False
    print()
    print(f"Result: {'ALL TESTS PASSED' if all_pass else 'SOME TESTS FAILED'}")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
