"""
User login endpoint
Main tested endpoint: POST /api/users/login
"""

from __future__ import annotations

import os
import time
from typing import Callable, List, Tuple

import requests


BASE_URL = os.getenv("BASE_URL", "http://localhost:8080")
REGISTER_URL = f"{BASE_URL}/api/users/register"
LOGIN_URL = f"{BASE_URL}/api/users/login"



def create_test_user() -> tuple[str, str]:
	"""Create a unique test user and return (username, password)."""
	suffix = str(int(time.time() * 1000))
	username = f"login_user_{suffix}"
	password = "123456"
	email = f"{username}@mail.com"

	payload = {
		"username": username,
		"email": email,
		"passwordHash": password,
	}
	params = {"confirmPassword": password}

	response = requests.post(REGISTER_URL, json=payload, params=params, timeout=10)
	assert response.status_code == 200, (
		f"Setup failed: test user creation failed, status {response.status_code}, response: {response.text}"
	)
	return username, password



def test_login_success(username: str, password: str) -> None:
	"""Case 1: Correct username/password should login successfully."""
	params = {
		"username": username,
		"password": password,
	}

	response = requests.post(LOGIN_URL, params=params, timeout=10)

	# Assertion 1: status code should be 200
	assert response.status_code == 200, (
		f"Expected status 200, got {response.status_code}, response: {response.text}"
	)

	# Assertion 2: response should include the expected username
	data = response.json()
	assert data.get("user", {}).get("username") == username, f"Username validation failed, response: {data}"



def test_login_wrong_password(username: str) -> None:
	"""Test case 2: Login should fail with an incorrect password."""
	params = {
		"username": username,
		"password": "wrong123",
	}

	response = requests.post(LOGIN_URL, params=params, timeout=10)

	# Failures usually return 400; asserting "non-200 + error keyword" is more robust
	assert response.status_code != 200, (
		f"Incorrect password should not succeed, status {response.status_code}, response: {response.text}"
	)
	assert "Login Failed" in response.text or "Incorrect" in response.text, (
		f"Error message did not match expectations, response: {response.text}"
	)



def test_login_empty_username() -> None:
	"""Test case 3: Login should fail when username is empty."""
	params = {
		"username": "",
		"password": "123456",
	}

	response = requests.post(LOGIN_URL, params=params, timeout=10)

	assert response.status_code != 200, (
		f"Empty username should not succeed, status {response.status_code}, response: {response.text}"
	)



def run_all_tests() -> None:
	"""Execute all test cases in order and print a summary."""
	print("Starting user login API automated tests...")
	print(f"Register endpoint: {REGISTER_URL}")
	print(f"Login endpoint: {LOGIN_URL}")

	# Setup: create a test account automatically
	username, password = create_test_user()
	print(f"Created test account: {username}")

	tests: List[Tuple[str, Callable[[], None]]] = [
		("Login succeeds with correct credentials", lambda: test_login_success(username, password)),
		("Login fails with wrong password", lambda: test_login_wrong_password(username)),
		("Login fails with empty username", test_login_empty_username),
	]

	passed = 0
	failed = 0

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
