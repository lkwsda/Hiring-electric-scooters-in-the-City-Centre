"""
Scooter management endpoints
Tested endpoints:
1) POST /api/scooters/add
2) GET /api/scooters/{id}
3) DELETE /api/scooters/{id}
"""

from __future__ import annotations

import os
import time
from typing import Callable, List, Tuple

import requests


BASE_URL = os.getenv("BASE_URL", "http://localhost:8080")
LOGIN_URL = f"{BASE_URL}/api/users/login"
ADD_SCOOTER_URL = f"{BASE_URL}/api/scooters/add"
SCOOTER_ITEM_URL = f"{BASE_URL}/api/scooters"


def _auth_headers():
    r = requests.post(LOGIN_URL, params={"username": "admin", "password": "123456"}, timeout=10)
    if r.status_code == 200:
        return {"Authorization": f"Bearer {r.json()['token']}"}
    return {}


def add_scooter() -> int:
    """Add a test scooter and return its id."""
    suffix = str(int(time.time() * 1000))
    model_name = f"auto_scooter_{suffix}"

    payload = {
        "model": model_name,
        "batteryLevel": 100,
        "latitude": 53.8012,
        "longitude": -1.5485,
        "status": "available",
    }

    add_response = requests.post(ADD_SCOOTER_URL, json=payload, timeout=10, headers=_auth_headers())
    assert add_response.status_code == 200, (
        f"Failed to add scooter, status code {add_response.status_code}, response: {add_response.text}"
    )

    # Use the list endpoint to locate the newly added scooter's id
    list_response = requests.get(SCOOTER_ITEM_URL, timeout=10, headers=_auth_headers())
    assert list_response.status_code == 200, (
        f"Failed to query scooter list, status code {list_response.status_code}, response: {list_response.text}"
    )

    scooters = list_response.json()
    matches = [s for s in scooters if s.get("model") == model_name and isinstance(s.get("id"), int)]
    assert matches, f"Added scooter was not found in the list, model={model_name}"

    return matches[-1]["id"]


def delete_scooter_if_exists(scooter_id: int | None) -> None:
    """Cleanup: delete the scooter if it exists to avoid test data accumulation."""
    if not isinstance(scooter_id, int):
        return
    requests.delete(f"{SCOOTER_ITEM_URL}/{scooter_id}", timeout=10, headers=_auth_headers())


def test_add_scooter_success() -> None:
    """Test case 1: Successfully add a scooter."""
    scooter_id: int | None = None
    try:
        scooter_id = add_scooter()
        assert isinstance(scooter_id, int), f"Invalid scooter_id returned after add: {scooter_id}"
    finally:
        delete_scooter_if_exists(scooter_id)


def test_get_scooter_by_id_success() -> None:
    """Test case 2: Query scooter by id successfully."""
    scooter_id: int | None = None
    try:
        scooter_id = add_scooter()
        response = requests.get(f"{SCOOTER_ITEM_URL}/{scooter_id}", timeout=10, headers=_auth_headers())

        assert response.status_code == 200, (
            f"Querying scooter by id should succeed, status code {response.status_code}, response: {response.text}"
        )

        data = response.json()
        assert data.get("id") == scooter_id, f"Returned id does not match, response: {data}"
        assert isinstance(data.get("model"), str), f"model field has an invalid type, response: {data}"
        assert data.get("status") in {"available", "rented", "maintenance"}, (
            f"status field value is invalid, response: {data}"
        )
    finally:
        delete_scooter_if_exists(scooter_id)


def test_delete_scooter_success() -> None:
    """Test case 3: Delete scooter successfully; subsequent query should fail."""
    scooter_id = add_scooter()

    delete_response = requests.delete(f"{SCOOTER_ITEM_URL}/{scooter_id}", timeout=10, headers=_auth_headers())
    assert delete_response.status_code == 200, (
        f"Deleting the scooter should succeed, status code {delete_response.status_code}, response: {delete_response.text}"
    )

    get_response = requests.get(f"{SCOOTER_ITEM_URL}/{scooter_id}", timeout=10, headers=_auth_headers())
    assert get_response.status_code != 200, (
        f"Querying after delete should not succeed, status code {get_response.status_code}, response: {get_response.text}"
    )


def run_all_tests() -> None:
    """Execute all test cases in order and print a summary."""
    tests: List[Tuple[str, Callable[[], None]]] = [
        ("Add scooter successfully", test_add_scooter_success),
        ("Query scooter by id successfully", test_get_scooter_by_id_success),
        ("Delete scooter successfully", test_delete_scooter_success),
    ]

    passed = 0
    failed = 0

    print("Starting scooter management API automated tests...")
    print(f"Add endpoint: {ADD_SCOOTER_URL}")
    print(f"Item endpoint: {SCOOTER_ITEM_URL}/{{id}}")

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
