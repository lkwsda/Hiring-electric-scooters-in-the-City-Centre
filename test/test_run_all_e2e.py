"""
E2E UI full-flow automated test runner

Run 4 Selenium E2E tests in order:
1. test_selenium_auth_flow   - User registration and login flow
2. test_selenium_main_flow   - Core rental flow (browse -> book -> pay -> success)
3. test_selenium_admin_flow  - Admin back-office flow
4. test_selenium_issue_flow  - Issue reporting and handling flow

Usage:
    python test/test_run_all_e2e.py
"""

import subprocess
import sys
import os
import time

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
E2E_DIR = os.path.join(BASE_DIR, "cases", "E2E")

test_scripts = [
    "test_selenium_auth_flow.py",
    "test_selenium_main_flow.py",
    "test_selenium_admin_flow.py",
    "test_selenium_issue_flow.py",
]

def run_one(script_name):
    path = os.path.join(E2E_DIR, script_name)
    print(f"\n{'='*60}")
    print(f"Running: {script_name}")
    print(f"{'='*60}")
    start = time.time()
    result = subprocess.run(
        [sys.executable, path],
        capture_output=True,
        text=True,
        timeout=120,
    )
    elapsed = time.time() - start
    output = result.stdout
    # Try UTF-8 normalization for subprocess output
    try:
        output = result.stdout.encode('utf-8', errors='replace').decode('utf-8', errors='replace')
    except Exception:
        pass
    print(output)
    if result.returncode != 0:
        print(f"[FAIL] {script_name} exited with code {result.returncode}")
        if result.stderr:
            print(f"STDERR: {result.stderr[:500]}")
        return False
    else:
        print(f"[PASS] {script_name} ({elapsed:.1f}s)")
        return True

def main():
    print("=" * 60)
    print("E2E UI Full-Flow Automated Test Suite")
    print("=" * 60)
    print(f"Test count: {len(test_scripts)}")
    print(f"Base URL: {os.getenv('BASE_URL', 'http://localhost:8080')}")
    print()

    passed = 0
    failed = 0

    for script in test_scripts:
        if run_one(script):
            passed += 1
        else:
            failed += 1
        # Brief pause between tests to let the server cool down
        time.sleep(1)

    print()
    print("=" * 60)
    print(f"Results: {passed} passed, {failed} failed, {len(test_scripts)} total")
    print("=" * 60)

    return 0 if failed == 0 else 1

if __name__ == "__main__":
    sys.exit(main())
