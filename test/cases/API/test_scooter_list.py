"""
Scooter list endpoint
Tested endpoint: GET /api/scooters
"""

from __future__ import annotations

import os
from typing import Any, Callable, List, Tuple

import requests


BASE_URL = os.getenv("BASE_URL", "http://localhost:8080")
LOGIN_URL = f"{BASE_URL}/api/users/login"
SCOOTER_LIST_URL = f"{BASE_URL}/api/scooters"


def _auth_headers():
    r = requests.post(LOGIN_URL, params={"username": "admin", "password": "123456"}, timeout=10)
    if r.status_code == 200:
        return {"Authorization": f"Bearer {r.json()['token']}"}
    return {}


def fetch_scooter_list() -> requests.Response:
    """Call the scooter list endpoint and return the raw response object."""
    return requests.get(SCOOTER_LIST_URL, timeout=10, headers=_auth_headers())


def test_scooter_list_status_ok() -> None:
    """Test case 1: Endpoint should be accessible with status code 200."""
    response = fetch_scooter_list()

    assert response.status_code == 200, (
        f"Expected status code 200, got {response.status_code}, response: {response.text}"
    )


def test_scooter_list_is_json_array() -> None:
    """Test case 2: Response body should be parseable as a JSON array."""
    response = fetch_scooter_list()

    assert response.status_code == 200, (
        f"Unexpected status code, cannot continue validating JSON structure, got {response.status_code}, response: {response.text}"
    )

    try:
        data = response.json()
    except ValueError as exc:
        raise AssertionError(f"Response is not valid JSON, response: {response.text}") from exc

    assert isinstance(data, list), f"Expected the response to be a list, actual type {type(data)}, response: {data}"


def test_scooter_list_item_schema_when_not_empty() -> None:
    """Test case 3: When the list is non-empty, the first item should contain key fields."""
    response = fetch_scooter_list()
    assert response.status_code == 200, (
        f"Unexpected status code, cannot continue validating fields, got {response.status_code}, response: {response.text}"
    )

    data = response.json()
    assert isinstance(data, list), f"Expected the response to be a list, actual type {type(data)}, response: {data}"

    # An empty list is a valid scenario; this test only checks structure when non-empty
    if not data:
        return

    first = data[0]
    assert isinstance(first, dict), f"Array items should be dictionaries, actual type {type(first)}, item: {first}"

    required_fields = ["id", "model", "batteryLevel", "status"]
    missing_fields = [field for field in required_fields if field not in first]
    assert not missing_fields, f"Missing required fields: {missing_fields}, actual item: {first}"

    assert isinstance(first["id"], int), f"id should be an integer, actual value: {first['id']}"
    assert isinstance(first["model"], str), f"model should be a string, actual value: {first['model']}"

    # batteryLevel may be int/float to avoid false positives from different serialization strategies
    assert isinstance(first["batteryLevel"], (int, float)), (
        f"batteryLevel should be numeric, actual value: {first['batteryLevel']}"
    )
    assert isinstance(first["status"], str), f"status should be a string, actual value: {first['status']}"


def run_all_tests() -> None:
    """Execute all test cases in order and print a summary."""
    tests: List[Tuple[str, Callable[[], None]]] = [
        ("Scooter list returns 200", test_scooter_list_status_ok),
        ("Scooter list response is a JSON array", test_scooter_list_is_json_array),
        ("Scooter item schema validation when non-empty", test_scooter_list_item_schema_when_not_empty),
    ]

    passed = 0
    failed = 0

    print("Starting scooter list API automated tests...")
    print(f"Target endpoint: {SCOOTER_LIST_URL}")

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
