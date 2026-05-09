"""
Package endpoints
Tested endpoints:
1) GET /api/packages
2) PUT /api/packages/update/{id}
"""

from __future__ import annotations

import os
from decimal import Decimal
from typing import Callable, List, Tuple

import requests


BASE_URL = os.getenv("BASE_URL", "http://localhost:8080")
LOGIN_URL = f"{BASE_URL}/api/users/login"
PACKAGES_URL = f"{BASE_URL}/api/packages"
PACKAGE_UPDATE_URL = f"{BASE_URL}/api/packages/update"


def _auth_headers():
    r = requests.post(LOGIN_URL, params={"username": "admin", "password": "123456"}, timeout=10)
    if r.status_code == 200:
        return {"Authorization": f"Bearer {r.json()['token']}"}
    return {}


def get_all_packages() -> requests.Response:
    """Call the packages query endpoint."""
    return requests.get(PACKAGES_URL, timeout=10, headers=_auth_headers())


def update_package_price(package_id: int, price: str) -> requests.Response:
    """Call the package price update endpoint."""
    return requests.put(f"{PACKAGE_UPDATE_URL}/{package_id}", params={"price": price}, timeout=10, headers=_auth_headers())


def test_get_packages_success() -> None:
    """Test case 1: Retrieve packages list successfully."""
    response = get_all_packages()

    assert response.status_code == 200, (
        f"Expected status code 200, got {response.status_code}, response: {response.text}"
    )

    data = response.json()
    assert isinstance(data, list), f"Expected the response to be a list, actual type {type(data)}, response: {data}"


def test_update_package_price_success_and_rollback() -> None:
    """Test case 2: Update package price successfully and rollback afterwards."""
    list_response = get_all_packages()
    assert list_response.status_code == 200, (
        f"Setup failed: failed to get packages, status code {list_response.status_code}, response: {list_response.text}"
    )

    packages = list_response.json()
    assert isinstance(packages, list), f"Setup failed: package response structure is invalid, response: {packages}"
    assert packages, "Setup failed: package list is empty, cannot run the update test"

    first = packages[0]
    package_id = first.get("id")
    original_price = first.get("price")

    assert isinstance(package_id, int), f"Setup failed: invalid package id, response item: {first}"
    assert original_price is not None, f"Setup failed: original package price is empty, response item: {first}"

    original_price_decimal = Decimal(str(original_price))
    new_price_decimal = original_price_decimal + Decimal("1.00")

    rollback_needed = False
    try:
        update_response = update_package_price(package_id, str(new_price_decimal))
        assert update_response.status_code == 200, (
            f"Price update should succeed, status code {update_response.status_code}, response: {update_response.text}"
        )
        rollback_needed = True

        verify_response = get_all_packages()
        assert verify_response.status_code == 200, (
            f"Failed to query packages after update, status code {verify_response.status_code}, response: {verify_response.text}"
        )

        updated_packages = verify_response.json()
        target = next((p for p in updated_packages if p.get("id") == package_id), None)
        assert target is not None, f"Target package not found after update, package_id={package_id}"

        updated_price = Decimal(str(target.get("price")))
        assert updated_price == new_price_decimal, (
            f"Updated price is incorrect, expected {new_price_decimal}, got {updated_price}"
        )
    finally:
        if rollback_needed:
            rollback_response = update_package_price(package_id, str(original_price_decimal))
            assert rollback_response.status_code == 200, (
                f"Failed to rollback price, status code {rollback_response.status_code}, response: {rollback_response.text}"
            )


def test_update_package_negative_price_should_fail() -> None:
    """Test case 3: Updating to a negative price should fail."""
    list_response = get_all_packages()
    assert list_response.status_code == 200, (
        f"Setup failed: failed to get packages, status code {list_response.status_code}, response: {list_response.text}"
    )

    packages = list_response.json()
    assert isinstance(packages, list), f"Setup failed: package response structure is invalid, response: {packages}"
    assert packages, "Setup failed: package list is empty, cannot run the negative price test"

    package_id = packages[0].get("id")
    assert isinstance(package_id, int), f"Setup failed: invalid package id, response item: {packages[0]}"

    response = update_package_price(package_id, "-1.00")

    assert response.status_code != 200, (
        f"Updating to a negative price should not succeed, status code {response.status_code}, response: {response.text}"
    )
    assert "cannot be negative" in response.text.lower() or "error" in response.text.lower(), (
        f"Error message does not match expectations, response: {response.text}"
    )


def run_all_tests() -> None:
    """Execute all test cases in order and print a summary."""
    tests: List[Tuple[str, Callable[[], None]]] = [
        ("Retrieve packages list successfully", test_get_packages_success),
        ("Update package price and rollback", test_update_package_price_success_and_rollback),
        ("Negative price update fails", test_update_package_negative_price_should_fail),
    ]

    passed = 0
    failed = 0

    print("Starting package API automated tests...")
    print(f"Query endpoint: {PACKAGES_URL}")
    print(f"Update endpoint: {PACKAGE_UPDATE_URL}/{{id}}")

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
