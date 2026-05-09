"""
User registration endpoint
Tested endpoint: POST /api/users/register
"""

from __future__ import annotations

import os
import time
from typing import Callable, List, Tuple

import requests


# Service URL can be adjusted as needed or overridden via the BASE_URL environment variable
BASE_URL = os.getenv("BASE_URL", "http://localhost:8080")
REGISTER_URL = f"{BASE_URL}/api/users/register"


def build_unique_user(prefix: str = "autotest") -> dict:
    """Generate a unique username and email to avoid duplicate registration failures."""
    suffix = str(int(time.time() * 1000))
    username = f"{prefix}_{suffix}"
    email = f"{username}@mail.com"
    return {
        "username": username,
        "email": email,
    }


def test_register_success() -> None:
    """Test case 1: Successful registration."""
    user = build_unique_user("ok")

    # Request parameters:
    # 1) Put username/email/passwordHash in the JSON body
    # 2) Put confirmPassword in the query parameters
    payload = {
        "username": user["username"],
        "email": user["email"],
        "passwordHash": "123456",
    }
    params = {"confirmPassword": "123456"}

    response = requests.post(REGISTER_URL, json=payload, params=params, timeout=10)

    # Assertion 1: status code should be 200
    assert response.status_code == 200, (
        f"Expected status code 200, got {response.status_code}, response: {response.text}"
    )

    # Assertion 2: response should contain success keywords
    assert "Registration Successful" in response.text, (
        f"Success message does not match expectations, response: {response.text}"
    )


def test_register_password_too_short() -> None:
    """Test case 2: Registration should fail if the password is too short."""
    user = build_unique_user("shortpwd")
    payload = {
        "username": user["username"],
        "email": user["email"],
        "passwordHash": "123",
    }
    params = {"confirmPassword": "123"}

    response = requests.post(REGISTER_URL, json=payload, params=params, timeout=10)

    # The project usually returns 400 for failures; using "non-200 + keyword" is more reliable here
    assert response.status_code != 200, (
        f"Registration should not succeed with a short password, status code {response.status_code}, response: {response.text}"
    )
    assert "Validation Failed" in response.text or "at least 6" in response.text, (
        f"Error message does not match expectations, response: {response.text}"
    )


def test_register_confirm_mismatch() -> None:
    """Test case 3: Registration should fail if confirm password does not match."""
    user = build_unique_user("mismatch")
    payload = {
        "username": user["username"],
        "email": user["email"],
        "passwordHash": "123456",
    }
    params = {"confirmPassword": "654321"}

    response = requests.post(REGISTER_URL, json=payload, params=params, timeout=10)

    assert response.status_code != 200, (
        f"Mismatched confirmation password should not succeed, status {response.status_code}, response: {response.text}"
    )
    assert "do not match" in response.text or "Validation Failed" in response.text, (
        f"Error message did not match expectations, response: {response.text}"
    )


def run_all_tests() -> None:
    """Run all test cases in sequence and print a summary."""
    tests: List[Tuple[str, Callable[[], None]]] = [
        ("Registration succeeds", test_register_success),
        ("Registration fails with short password", test_register_password_too_short),
        ("Registration fails with mismatched confirmation password", test_register_confirm_mismatch),
    ]

    passed = 0
    failed = 0

    print("Starting user registration API automated tests...")
    print(f"Target endpoint: {REGISTER_URL}")

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
