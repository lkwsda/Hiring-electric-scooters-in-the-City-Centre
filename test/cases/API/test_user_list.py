"""
User list endpoint
Tested endpoint: GET /api/users
"""

from __future__ import annotations

import os
import time
from typing import Callable, List, Tuple

import requests


BASE_URL = os.getenv("BASE_URL", "http://localhost:8080")
REGISTER_URL = f"{BASE_URL}/api/users/register"
LOGIN_URL = f"{BASE_URL}/api/users/login"
USERS_URL = f"{BASE_URL}/api/users"


def _auth_headers():
    r = requests.post(LOGIN_URL, params={"username": "admin", "password": "123456"}, timeout=10)
    if r.status_code == 200:
        return {"Authorization": f"Bearer {r.json()['token']}"}
    return {}


def create_user_for_listing() -> str:
    """Create a unique user and return the username for list validation."""
    suffix = str(int(time.time() * 1000))
    username = f"list_user_{suffix}"
    payload = {
        "username": username,
        "email": f"{username}@mail.com",
        "passwordHash": "123456",
    }
    response = requests.post(REGISTER_URL, json=payload, params={"confirmPassword": "123456"}, timeout=10)
    assert response.status_code == 200, (
        f"Setup failed: failed to create the list test user, status code {response.status_code}, response: {response.text}"
    )
    return username


def test_user_list_status_ok() -> None:
    """Test case 1: User list endpoint should return 200."""
    response = requests.get(USERS_URL, timeout=10, headers=_auth_headers())
    assert response.status_code == 200, (
        f"Expected status code 200, got {response.status_code}, response: {response.text}"
    )


def test_user_list_is_json_array() -> None:
    """Test case 2: Response body should be a JSON array."""
    response = requests.get(USERS_URL, timeout=10, headers=_auth_headers())
    assert response.status_code == 200, (
        f"Unexpected status code, cannot continue validating the structure, got {response.status_code}, response: {response.text}"
    )

    data = response.json()
    assert isinstance(data, list), f"Expected the response to be a list, actual type {type(data)}, response: {data}"


def test_user_list_contains_new_user() -> None:
    """Test case 3: After creating a user, the list should contain that user."""
    username = create_user_for_listing()

    response = requests.get(USERS_URL, timeout=10, headers=_auth_headers())
    assert response.status_code == 200, (
        f"Failed to get user list, status code {response.status_code}, response: {response.text}"
    )

    data = response.json()
    assert isinstance(data, list), f"Expected the response to be a list, actual type {type(data)}, response: {data}"

    matched = [u for u in data if isinstance(u, dict) and u.get("username") == username]
    assert matched, f"User list did not contain the newly created user, username={username}"

    user = matched[0]
    assert isinstance(user.get("id"), int), f"Invalid user id, response item: {user}"
    assert isinstance(user.get("email"), str), f"Invalid user email, response item: {user}"


def run_all_tests() -> None:
    """Execute all test cases in order and print a summary."""
    tests: List[Tuple[str, Callable[[], None]]] = [
        ("User list endpoint returns 200", test_user_list_status_ok),
        ("User list response is a JSON array", test_user_list_is_json_array),
        ("User list contains the newly created user", test_user_list_contains_new_user),
    ]

    passed = 0
    failed = 0

    print("Starting user list API automated tests...")
    print(f"Target endpoint: {USERS_URL}")

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
