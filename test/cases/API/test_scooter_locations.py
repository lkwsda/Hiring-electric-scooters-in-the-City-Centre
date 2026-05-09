"""
Scooter locations endpoint
Tested endpoint: GET /api/scooters/locations
"""

from __future__ import annotations

import os
from typing import Any, Callable, List, Tuple

import requests


BASE_URL = os.getenv("BASE_URL", "http://localhost:8080")
LOGIN_URL = f"{BASE_URL}/api/users/login"
SCOOTER_LOCATIONS_URL = f"{BASE_URL}/api/scooters/locations"


def _auth_headers():
    r = requests.post(LOGIN_URL, params={"username": "admin", "password": "123456"}, timeout=10)
    if r.status_code == 200:
        return {"Authorization": f"Bearer {r.json()['token']}"}
    return {}


def fetch_scooter_locations() -> requests.Response:
    """Call the scooter locations endpoint and return the raw response object."""
    return requests.get(SCOOTER_LOCATIONS_URL, timeout=10, headers=_auth_headers())


def test_scooter_locations_status_ok() -> None:
    """Test case 1: Endpoint should be accessible with status code 200."""
    response = fetch_scooter_locations()

    assert response.status_code == 200, (
        f"Expected status code 200, got {response.status_code}, response: {response.text}"
    )


def test_scooter_locations_is_json_array() -> None:
    """Test case 2: Response body should be parseable as a JSON array."""
    response = fetch_scooter_locations()

    assert response.status_code == 200, (
        f"Unexpected status code, cannot continue validating JSON structure, got {response.status_code}, response: {response.text}"
    )

    try:
        data = response.json()
    except ValueError as exc:
        raise AssertionError(f"Response is not valid JSON, response: {response.text}") from exc

    assert isinstance(data, list), f"Expected the response to be a list, actual type {type(data)}, response: {data}"


def test_scooter_locations_item_schema_when_not_empty() -> None:
    """Test case 3: When the list is non-empty, validate the returned coordinate item schema."""
    response = fetch_scooter_locations()
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

    required_fields = ["id", "latitude", "longitude"]
    missing_fields = [field for field in required_fields if field not in first]
    assert not missing_fields, f"Missing required geographic fields: {missing_fields}, actual item: {first}"

    assert isinstance(first["id"], int), f"id should be an integer, actual value: {first['id']}"
    # Latitude and longitude may be serialized as floats or strings
    assert isinstance(first["latitude"], (int, float, str)), f"latitude has an invalid type, actual value: {first['latitude']}"
    assert isinstance(first["longitude"], (int, float, str)), f"longitude has an invalid type, actual value: {first['longitude']}"


def run_all_tests() -> None:
    """Execute all test cases in order and print a summary."""
    tests: List[Tuple[str, Callable[[], None]]] = [
        ("Scooter locations endpoint returns 200", test_scooter_locations_status_ok),
        ("Scooter locations response is a JSON array", test_scooter_locations_is_json_array),
        ("Scooter location item schema validation when non-empty", test_scooter_locations_item_schema_when_not_empty),
    ]

    passed = 0
    failed = 0

    print("Starting scooter locations map API automated tests...")
    print(f"Target endpoint: {SCOOTER_LOCATIONS_URL}")

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


if __name__ == '__main__':
    run_all_tests()
