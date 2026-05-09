"""
Booking place endpoint
Tested endpoint: POST /api/bookings/place
"""

from __future__ import annotations

import os
import time
from typing import Callable, List, Set, Tuple

import requests


BASE_URL = os.getenv("BASE_URL", "http://localhost:8080")
REGISTER_URL = f"{BASE_URL}/api/users/register"
LOGIN_URL = f"{BASE_URL}/api/users/login"
SCOOTERS_URL = f"{BASE_URL}/api/scooters"
ADD_SCOOTER_URL = f"{BASE_URL}/api/scooters/add"
PACKAGES_URL = f"{BASE_URL}/api/packages"
PLACE_BOOKING_URL = f"{BASE_URL}/api/bookings/place"
CANCEL_BOOKING_URL = f"{BASE_URL}/api/bookings/cancel"


CREATED_SCOOTER_IDS: Set[int] = set()


def _admin_auth_headers():
    r = requests.post(LOGIN_URL, params={"username": "admin", "password": "123456"}, timeout=10)
    if r.status_code == 200:
        return {"Authorization": f"Bearer {r.json()['token']}"}
    return {}


def create_test_user_and_get_id() -> tuple[int, dict]:
    """Create a test user and login to obtain userId and auth headers. Returns (user_id, headers)."""
    suffix = str(int(time.time() * 1000))
    username = f"booking_user_{suffix}"
    password = "123456"
    email = f"{username}@mail.com"

    payload = {
        "username": username,
        "email": email,
        "passwordHash": password,
    }
    params = {"confirmPassword": password}

    register_response = requests.post(REGISTER_URL, json=payload, params=params, timeout=10)
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

    user_data = login_response.json()
    user_id = user_data.get("user", {}).get("id")
    token = user_data.get("token")
    assert isinstance(user_id, int), f"Setup failed: login response did not return a valid userId, response: {user_data}"
    headers = {"Authorization": f"Bearer {token}"}
    return user_id, headers


def ensure_available_scooter_id() -> int:
    """Ensure an available scooter exists and return its scooterId."""
    response = requests.get(SCOOTERS_URL, timeout=10, headers=_admin_auth_headers())
    assert response.status_code == 200, (
        f"Setup failed: failed to get scooter list, status code {response.status_code}, response: {response.text}"
    )

    scooters = response.json()
    if isinstance(scooters, list):
        for scooter in scooters:
            if scooter.get("status") == "available" and isinstance(scooter.get("id"), int):
                return scooter["id"]

    # If there is no available scooter, add one automatically
    suffix = str(int(time.time() * 1000))
    model_name = f"autotest_model_{suffix}"
    add_payload = {
        "model": model_name,
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

    refreshed_scooters = refresh_response.json()
    for scooter in refreshed_scooters:
        if scooter.get("model") == model_name and isinstance(scooter.get("id"), int):
            new_id = scooter["id"]
            CREATED_SCOOTER_IDS.add(new_id)
            return new_id

    for scooter in refreshed_scooters:
        if scooter.get("status") == "available" and isinstance(scooter.get("id"), int):
            return scooter["id"]

    raise AssertionError("Setup failed: no available scooter found")


def ensure_package_id() -> int:
    """Ensure a usable package exists and return its packageId."""
    response = requests.get(PACKAGES_URL, timeout=10, headers=_admin_auth_headers())
    assert response.status_code == 200, (
        f"Setup failed: failed to get package list, status code {response.status_code}, response: {response.text}"
    )

    packages = response.json()
    assert isinstance(packages, list) and packages, (
        f"Setup failed: package list is empty or has an invalid structure, response: {packages}"
    )

    first = packages[0]
    package_id = first.get("id") if isinstance(first, dict) else None
    assert isinstance(package_id, int), f"Setup failed: no valid packageId found, response item: {first}"
    return package_id


def place_booking(user_id: int, scooter_id: int, package_id: int, headers: dict) -> requests.Response:
    """Call the place booking endpoint and return the response."""
    payload = {
        "userId": user_id,
        "scooterId": scooter_id,
        "packageId": package_id,
    }
    return requests.post(PLACE_BOOKING_URL, json=payload, timeout=10, headers=headers)


def cleanup_booking_if_possible(booking_id: int | None, headers: dict | None = None) -> None:
    """Test cleanup: try to cancel the booking to avoid occupying scooters and affecting other tests."""
    if not isinstance(booking_id, int):
        return
    h = headers if headers else _admin_auth_headers()
    requests.post(f"{CANCEL_BOOKING_URL}/{booking_id}", timeout=10, headers=h)


def cleanup_created_scooters() -> None:
    """Cleanup: attempt to delete scooters auto-created during this run that are not referenced by business logic."""
    for scooter_id in list(CREATED_SCOOTER_IDS):
        try:
            response = requests.delete(f"{SCOOTERS_URL}/{scooter_id}", timeout=10, headers=_admin_auth_headers())
            if response.status_code in (200, 404):
                CREATED_SCOOTER_IDS.discard(scooter_id)
            else:
                print(
                    f"WARN - Failed to delete added scooter, scooterId={scooter_id}, status code {response.status_code}, response: {response.text}"
                )
        except Exception as exc:  # noqa: BLE001
            print(f"WARN - Exception deleting added scooter, scooterId={scooter_id}, exception: {exc}")


def test_place_booking_success() -> None:
    """Test case 1: Successful booking returns a pending booking."""
    user_id, headers = create_test_user_and_get_id()
    scooter_id = ensure_available_scooter_id()
    package_id = ensure_package_id()

    booking_id: int | None = None
    try:
        response = place_booking(user_id, scooter_id, package_id, headers)
        assert response.status_code == 200, (
            f"Expected status code 200, got {response.status_code}, response: {response.text}"
        )

        data = response.json()
        booking_id = data.get("id")

        assert isinstance(booking_id, int), f"A booking id should be returned on success, response: {data}"
        assert data.get("userId") == user_id, f"userId does not match, response: {data}"
        assert data.get("scooterId") == scooter_id, f"scooterId does not match, response: {data}"
        assert data.get("packageId") == package_id, f"packageId does not match, response: {data}"
        assert data.get("status") == "pending", f"Status should be pending, response: {data}"
        total_cost = data.get("totalCost")
        assert total_cost is not None, f"A totalCost should be returned on success, response: {data}"
        assert float(total_cost) > 0, f"totalCost should be greater than 0, response: {data}"
    finally:
        cleanup_booking_if_possible(booking_id, headers)


def test_place_booking_invalid_scooter_should_fail() -> None:
    """Test case 2: Booking should fail when the scooter does not exist."""
    user_id, headers = create_test_user_and_get_id()
    package_id = ensure_package_id()
    invalid_scooter_id = 99999999

    response = place_booking(user_id, invalid_scooter_id, package_id, headers)

    assert response.status_code != 200, (
        f"Booking should not succeed when the scooter does not exist, status code {response.status_code}, response: {response.text}"
    )
    error_text = response.text.lower()
    expected_keywords = ["not found", "validation failed", "incorrect result size", "scooter"]
    assert any(keyword in error_text for keyword in expected_keywords), (
        f"Error message does not match expectations, response: {response.text}"
    )


def test_place_booking_same_scooter_twice_should_fail() -> None:
    """Test case 3: Booking the same scooter twice should fail on the second attempt."""
    user_id_1, headers_1 = create_test_user_and_get_id()
    user_id_2, headers_2 = create_test_user_and_get_id()
    scooter_id = ensure_available_scooter_id()
    package_id = ensure_package_id()

    first_booking_id: int | None = None
    try:
        first_response = place_booking(user_id_1, scooter_id, package_id, headers_1)
        assert first_response.status_code == 200, (
            f"The first booking should succeed, status code {first_response.status_code}, response: {first_response.text}"
        )

        first_data = first_response.json()
        first_booking_id = first_data.get("id")
        assert isinstance(first_booking_id, int), f"The first booking did not return a valid booking id, response: {first_data}"

        second_response = place_booking(user_id_2, scooter_id, package_id, headers_2)
        assert second_response.status_code != 200, (
            f"The second booking on the same scooter should not succeed, status code {second_response.status_code}, response: {second_response.text}"
        )
        error_text = second_response.text.lower()
        assert "already in use" in error_text or "validation failed" in error_text or "scooter" in error_text, (
            f"Error message does not match expectations, response: {second_response.text}"
        )
    finally:
        cleanup_booking_if_possible(first_booking_id, headers_1)


def run_all_tests() -> None:
    """Execute all test cases in order and print a summary."""
    tests: List[Tuple[str, Callable[[], None]]] = [
        ("Booking success returns pending", test_place_booking_success),
        ("Booking fails for missing scooter", test_place_booking_invalid_scooter_should_fail),
        ("Second booking on same scooter fails", test_place_booking_same_scooter_twice_should_fail),
    ]

    passed = 0
    failed = 0

    print("Starting booking API automated tests...")
    print(f"Register endpoint: {REGISTER_URL}")
    print(f"Login endpoint: {LOGIN_URL}")
    print(f"Scooter endpoint: {SCOOTERS_URL}")
    print(f"Booking endpoint: {PLACE_BOOKING_URL}")

    for name, func in tests:
        try:
            func()
            passed += 1
            print(f"PASS - {name}")
        except Exception as exc:  # noqa: BLE001
            failed += 1
            print(f"FAIL - {name} -> {exc}")

    cleanup_created_scooters()

    print("\nTest finished")
    print(f"Passed: {passed}")
    print(f"Failed: {failed}")


if __name__ == "__main__":
    run_all_tests()
