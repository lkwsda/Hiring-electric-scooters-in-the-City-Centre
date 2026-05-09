"""
Issue (fault) endpoints
Tested endpoints:
1) POST /api/issues/report
2) GET /api/issues
3) PUT /api/issues/resolve/{issueId}
"""

from __future__ import annotations

import os
import time
from typing import Callable, List, Tuple

import requests


BASE_URL = os.getenv("BASE_URL", "http://localhost:8080")
REGISTER_URL = f"{BASE_URL}/api/users/register"
LOGIN_URL = f"{BASE_URL}/api/users/login"
SCOOTERS_URL = f"{BASE_URL}/api/scooters"
ADD_SCOOTER_URL = f"{BASE_URL}/api/scooters/add"
ISSUES_URL = f"{BASE_URL}/api/issues"
ISSUE_REPORT_URL = f"{BASE_URL}/api/issues/report"
ISSUE_RESOLVE_URL = f"{BASE_URL}/api/issues/resolve"


def _admin_auth_headers():
    r = requests.post(LOGIN_URL, params={"username": "admin", "password": "123456"}, timeout=10)
    if r.status_code == 200:
        return {"Authorization": f"Bearer {r.json()['token']}"}
    return {}


def create_test_user_and_get_id() -> tuple[int, dict]:
    """Create a test user and login to obtain userId and auth headers. Returns (user_id, headers)."""
    suffix = str(int(time.time() * 1000))
    username = f"issue_user_{suffix}"
    password = "123456"
    email = f"{username}@mail.com"

    payload = {
        "username": username,
        "email": email,
        "passwordHash": password,
    }
    register_response = requests.post(
        REGISTER_URL,
        json=payload,
        params={"confirmPassword": password},
        timeout=10,
    )
    assert register_response.status_code == 200, (
        f"Setup failed: user registration failed, status code {register_response.status_code}, response: {register_response.text}"
    )

    login_response = requests.post(
        LOGIN_URL,
        params={"username": username, "password": password},
        timeout=10,
    )
    assert login_response.status_code == 200, (
        f"Setup failed: user login failed, status code {login_response.status_code}, response: {login_response.text}"
    )

    data = login_response.json()
    user_id = data.get("user", {}).get("id")
    token = data.get("token")
    assert isinstance(user_id, int), f"Setup failed: login response did not return a valid userId, response: {data}"
    headers = {"Authorization": f"Bearer {token}"}
    return user_id, headers


def ensure_scooter_id() -> int:
    """Ensure at least one scooter exists and return a usable scooterId."""
    response = requests.get(SCOOTERS_URL, timeout=10, headers=_admin_auth_headers())
    assert response.status_code == 200, (
        f"Setup failed: failed to get scooter list, status code {response.status_code}, response: {response.text}"
    )

    scooters = response.json()
    if isinstance(scooters, list):
        for scooter in scooters:
            if isinstance(scooter.get("id"), int):
                return scooter["id"]

    suffix = str(int(time.time() * 1000))
    add_payload = {
        "model": f"issue_auto_model_{suffix}",
        "batteryLevel": 100,
        "latitude": 53.8012,
        "longitude": -1.5485,
        "status": "available",
    }
    add_response = requests.post(ADD_SCOOTER_URL, json=add_payload, timeout=10, headers=_admin_auth_headers())
    assert add_response.status_code == 200, (
        f"Setup failed: failed to add scooter, status code {add_response.status_code}, response: {add_response.text}"
    )

    refresh_response = requests.get(SCOOTERS_URL, timeout=10, headers=_admin_auth_headers())
    assert refresh_response.status_code == 200, (
        f"Setup failed: failed to refresh scooter list, status code {refresh_response.status_code}, response: {refresh_response.text}"
    )

    refreshed = refresh_response.json()
    for scooter in refreshed:
        if isinstance(scooter.get("id"), int):
            return scooter["id"]

    raise AssertionError("Setup failed: no available scooterId found")


def report_issue(user_id: int, scooter_id: int, description: str, priority: str, headers: dict) -> requests.Response:
    """Call the issue report endpoint."""
    payload = {
        "userId": user_id,
        "scooterId": scooter_id,
        "description": description,
        "priority": priority,
    }
    return requests.post(ISSUE_REPORT_URL, json=payload, timeout=10, headers=headers)


def find_issue_id_by_description(description: str) -> int:
    """Find the issueId in the list by matching the unique description."""
    response = requests.get(ISSUES_URL, timeout=10, headers=_admin_auth_headers())
    assert response.status_code == 200, (
        f"Failed to query the issues list, status code {response.status_code}, response: {response.text}"
    )

    data = response.json()
    assert isinstance(data, list), f"Issues list structure is invalid, response: {data}"

    for issue in data:
        if isinstance(issue, dict) and issue.get("description") == description and isinstance(issue.get("id"), int):
            return issue["id"]

    raise AssertionError(f"Target record was not found in the issues list, description={description}")


def test_report_issue_success() -> None:
    """Test case 1: Reporting an issue should succeed."""
    user_id, headers = create_test_user_and_get_id()
    scooter_id = ensure_scooter_id()
    description = f"issue_report_{int(time.time() * 1000)}"

    response = report_issue(user_id, scooter_id, description, priority="high", headers=headers)
    assert response.status_code == 200, (
        f"Reporting an issue should succeed, status code {response.status_code}, response: {response.text}"
    )
    assert "submitted" in response.text.lower() or "thank you" in response.text.lower(), (
        f"Success message does not match expectations, response: {response.text}"
    )


def test_view_all_issues_contains_reported_issue() -> None:
    """Test case 2: After reporting, the issue should appear in the issues list."""
    user_id, headers = create_test_user_and_get_id()
    scooter_id = ensure_scooter_id()
    description = f"issue_list_{int(time.time() * 1000)}"

    report_response = report_issue(user_id, scooter_id, description, priority="medium", headers=headers)
    assert report_response.status_code == 200, (
        f"Setup failed: issue report failed, status code {report_response.status_code}, response: {report_response.text}"
    )

    response = requests.get(ISSUES_URL, timeout=10, headers=headers)
    assert response.status_code == 200, (
        f"Querying the issues list should succeed, status code {response.status_code}, response: {response.text}"
    )

    data = response.json()
    assert isinstance(data, list), f"Expected the response to be a list, actual type {type(data)}, response: {data}"

    matches = [i for i in data if isinstance(i, dict) and i.get("description") == description]
    assert matches, f"The issues list did not contain the newly reported record, description={description}"

    issue = matches[0]
    assert issue.get("userId") == user_id, f"userId does not match, response item: {issue}"
    assert issue.get("scooterId") == scooter_id, f"scooterId does not match, response item: {issue}"
    assert issue.get("priority") in {"low", "medium", "high"}, f"priority value is invalid, response item: {issue}"


def test_resolve_issue_success() -> None:
    """Test case 3: Admin resolving an issue should update status to resolved."""
    user_id, headers = create_test_user_and_get_id()
    scooter_id = ensure_scooter_id()
    description = f"issue_resolve_{int(time.time() * 1000)}"

    report_response = report_issue(user_id, scooter_id, description, priority="low", headers=headers)
    assert report_response.status_code == 200, (
        f"Setup failed: issue report failed, status code {report_response.status_code}, response: {report_response.text}"
    )

    issue_id = find_issue_id_by_description(description)

    resolve_response = requests.put(f"{ISSUE_RESOLVE_URL}/{issue_id}", timeout=10, headers=_admin_auth_headers())
    assert resolve_response.status_code == 200, (
        f"Resolving the issue should succeed, status code {resolve_response.status_code}, response: {resolve_response.text}"
    )

    list_response = requests.get(ISSUES_URL, timeout=10, headers=_admin_auth_headers())
    assert list_response.status_code == 200, (
        f"Failed to query the issues list after resolving, status code {list_response.status_code}, response: {list_response.text}"
    )

    issues = list_response.json()
    target = next((i for i in issues if isinstance(i, dict) and i.get("id") == issue_id), None)
    assert target is not None, f"Target issue was not found after resolving, issueId={issue_id}"
    assert target.get("status") == "resolved", f"Status after resolving should be resolved, response item: {target}"


def run_all_tests() -> None:
    """Execute all test cases in order and print a summary."""
    tests: List[Tuple[str, Callable[[], None]]] = [
        ("Report issue successfully", test_report_issue_success),
        ("Issues list contains the reported record", test_view_all_issues_contains_reported_issue),
        ("Resolve issue successfully", test_resolve_issue_success),
    ]

    passed = 0
    failed = 0

    print("Starting issue API automated tests...")
    print(f"Report endpoint: {ISSUE_REPORT_URL}")
    print(f"List endpoint: {ISSUES_URL}")
    print(f"Resolve endpoint: {ISSUE_RESOLVE_URL}/{{issueId}}")

    for name, func in tests:
        try:
            func()
            passed += 1
            print(f"PASS - {name}")
        except Exception as exc:  # noqa: BLE001
            failed += 1
            print(f"FAIL - {name} -> {exc}")

    print("\nTest finished")
    print(f"Passed: {passed}")
    print(f"Failed: {failed}")


if __name__ == "__main__":
    run_all_tests()
