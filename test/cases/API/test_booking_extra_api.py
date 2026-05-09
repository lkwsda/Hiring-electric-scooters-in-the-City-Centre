"""
Booking extra endpoints
Tested endpoints:
1) GET /api/bookings/user/{userId}
2) POST /api/bookings/pay/{bookingId}
3) POST /api/bookings/cancel/{bookingId}
4) POST /api/bookings/end/{bookingId}
5) POST /api/bookings/extend/{bookingId}
6) POST /api/bookings/admin/place
7) GET /api/bookings/admin/revenue
8) GET /api/bookings/admin/revenue/daily
"""

from __future__ import annotations

from decimal import Decimal
import os
import time
from typing import Callable, List, Set, Tuple

import requests


BASE_URL = os.getenv("BASE_URL", "http://localhost:8080")
REGISTER_URL = f"{BASE_URL}/api/users/register"
LOGIN_URL = f"{BASE_URL}/api/users/login"
SCOOTERS_URL = f"{BASE_URL}/api/scooters"
SCOOTER_ITEM_URL = f"{BASE_URL}/api/scooters"
ADD_SCOOTER_URL = f"{BASE_URL}/api/scooters/add"
PACKAGES_URL = f"{BASE_URL}/api/packages"
PLACE_BOOKING_URL = f"{BASE_URL}/api/bookings/place"
BOOKING_USER_URL = f"{BASE_URL}/api/bookings/user"
BOOKING_PAY_URL = f"{BASE_URL}/api/bookings/pay"
BOOKING_CANCEL_URL = f"{BASE_URL}/api/bookings/cancel"
BOOKING_END_URL = f"{BASE_URL}/api/bookings/end"
BOOKING_EXTEND_URL = f"{BASE_URL}/api/bookings/extend"
BOOKING_ADMIN_PLACE_URL = f"{BASE_URL}/api/bookings/admin/place"
BOOKING_REVENUE_URL = f"{BASE_URL}/api/bookings/admin/revenue"
BOOKING_DAILY_REVENUE_URL = f"{BASE_URL}/api/bookings/admin/revenue/daily"


CREATED_SCOOTER_IDS: Set[int] = set()


def _admin_auth_headers():
    r = requests.post(LOGIN_URL, params={"username": "admin", "password": "123456"}, timeout=10)
    if r.status_code == 200:
        return {"Authorization": f"Bearer {r.json()['token']}"}
    return {}


def create_test_user_and_get_id(prefix: str = "booking_extra") -> tuple[int, dict]:
    """Create a test user and return (userId, auth_headers)."""
    suffix = str(int(time.time() * 1000))
    username = f"{prefix}_{suffix}"
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

    suffix = str(int(time.time() * 1000))
    model_name = f"booking_extra_model_{suffix}"
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

    refreshed = refresh_response.json()
    for scooter in refreshed:
        if scooter.get("model") == model_name and isinstance(scooter.get("id"), int):
            new_id = scooter["id"]
            CREATED_SCOOTER_IDS.add(new_id)
            return new_id

    for scooter in refreshed:
        if scooter.get("status") == "available" and isinstance(scooter.get("id"), int):
            return scooter["id"]

    raise AssertionError("Setup failed: no available scooter found")


def ensure_package_id() -> int:
    """Ensure a package exists and return its packageId."""
    response = requests.get(PACKAGES_URL, timeout=10, headers=_admin_auth_headers())
    assert response.status_code == 200, (
        f"Setup failed: failed to get package list, status code {response.status_code}, response: {response.text}"
    )

    packages = response.json()
    assert isinstance(packages, list) and packages, (
        f"Setup failed: package list is empty or malformed, response: {packages}"
    )

    package_id = packages[0].get("id") if isinstance(packages[0], dict) else None
    assert isinstance(package_id, int), f"Setup failed: invalid packageId, response item: {packages[0]}"
    return package_id


def place_booking(user_id: int, scooter_id: int, package_id: int, headers: dict) -> dict:
    """Place a booking and return the booking object."""
    payload = {
        "userId": user_id,
        "scooterId": scooter_id,
        "packageId": package_id,
    }
    response = requests.post(PLACE_BOOKING_URL, json=payload, timeout=10, headers=headers)
    assert response.status_code == 200, (
        f"Setup failed: booking request failed, status {response.status_code}, response: {response.text}"
    )
    data = response.json()
    assert isinstance(data.get("id"), int), f"Setup failed: invalid booking id returned, response: {data}"
    return data


def get_user_bookings(user_id: int, headers: dict) -> list:
    """Retrieve the user's bookings list."""
    response = requests.get(f"{BOOKING_USER_URL}/{user_id}", timeout=10, headers=headers)
    assert response.status_code == 200, (
        f"Failed to query user bookings, status {response.status_code}, response: {response.text}"
    )
    data = response.json()
    assert isinstance(data, list), f"Expected user bookings to be a list, got {type(data)}, response: {data}"
    return data


def cleanup_booking_if_possible(booking_id: int | None, headers: dict | None = None) -> None:
    """Cleanup: try to cancel the booking and release the scooter."""
    if not isinstance(booking_id, int):
        return
    h = headers if headers else _admin_auth_headers()
    try:
        requests.post(f"{BOOKING_CANCEL_URL}/{booking_id}", timeout=10, headers=h)
    except Exception:  # noqa: BLE001
        pass


def cleanup_created_scooters() -> None:
    """Cleanup: attempt to delete scooters created during this run."""
    for scooter_id in list(CREATED_SCOOTER_IDS):
        try:
            response = requests.delete(f"{SCOOTER_ITEM_URL}/{scooter_id}", timeout=10, headers=_admin_auth_headers())
            if response.status_code in (200, 404):
                CREATED_SCOOTER_IDS.discard(scooter_id)
            else:
                print(
                    f"WARN - Failed to delete created scooter, scooterId={scooter_id}, status {response.status_code}, response: {response.text}"
                )
        except Exception as exc:  # noqa: BLE001
            print(f"WARN - Failed to delete created scooter, scooterId={scooter_id}, error: {exc}")


def test_get_user_bookings_contains_new_booking() -> None:
    """Test case 1: After creating a booking, the user's booking list should contain the record."""
    user_id, headers = create_test_user_and_get_id("bookings_user")
    scooter_id = ensure_available_scooter_id()
    package_id = ensure_package_id()

    booking_id: int | None = None
    try:
        created = place_booking(user_id, scooter_id, package_id, headers)
        booking_id = created["id"]

        bookings = get_user_bookings(user_id, headers)
        target = next((b for b in bookings if isinstance(b, dict) and b.get("id") == booking_id), None)
        assert target is not None, f"Could not find the newly created booking in user bookings, bookingId={booking_id}"
    finally:
        cleanup_booking_if_possible(booking_id, headers)


def test_pay_booking_success() -> None:
    """Test case 2: Payment should update a pending booking to paid."""
    user_id, headers = create_test_user_and_get_id("bookings_pay")
    scooter_id = ensure_available_scooter_id()
    package_id = ensure_package_id()

    booking_id: int | None = None
    try:
        created = place_booking(user_id, scooter_id, package_id, headers)
        booking_id = created["id"]

        pay_response = requests.post(
            f"{BOOKING_PAY_URL}/{booking_id}",
            params={"cardNumber": "123456789012"},
            timeout=10,
            headers=headers,
        )
        assert pay_response.status_code == 200, (
            f"Payment should succeed, status {pay_response.status_code}, response: {pay_response.text}"
        )

        bookings = get_user_bookings(user_id, headers)
        target = next((b for b in bookings if isinstance(b, dict) and b.get("id") == booking_id), None)
        assert target is not None, f"Could not find target booking after payment, bookingId={booking_id}"
        assert target.get("status") == "paid", f"Status after payment should be paid, response item: {target}"
    finally:
        cleanup_booking_if_possible(booking_id, headers)


def test_cancel_booking_success() -> None:
    """Test case 3: After canceling, the booking status should be canceled."""
    user_id, headers = create_test_user_and_get_id("bookings_cancel")
    scooter_id = ensure_available_scooter_id()
    package_id = ensure_package_id()

    booking_id: int | None = None
    try:
        created = place_booking(user_id, scooter_id, package_id, headers)
        booking_id = created["id"]

        cancel_response = requests.post(f"{BOOKING_CANCEL_URL}/{booking_id}", timeout=10, headers=headers)
        assert cancel_response.status_code == 200, (
            f"Canceling the booking should succeed, status {cancel_response.status_code}, response: {cancel_response.text}"
        )

        bookings = get_user_bookings(user_id, headers)
        target = next((b for b in bookings if isinstance(b, dict) and b.get("id") == booking_id), None)
        assert target is not None, f"Could not find target booking after cancellation, bookingId={booking_id}"
        assert target.get("status") == "canceled", f"Status after cancellation should be canceled, response item: {target}"
    finally:
        cleanup_booking_if_possible(booking_id, headers)


def test_end_trip_releases_scooter() -> None:
    """Test case 4: After ending a trip, the scooter status should be available."""
    user_id, headers = create_test_user_and_get_id("bookings_end")
    scooter_id = ensure_available_scooter_id()
    package_id = ensure_package_id()

    booking_id: int | None = None
    try:
        created = place_booking(user_id, scooter_id, package_id, headers)
        booking_id = created["id"]

        end_response = requests.post(f"{BOOKING_END_URL}/{booking_id}", timeout=10, headers=headers)
        assert end_response.status_code == 200, (
            f"Ending the trip should succeed, status {end_response.status_code}, response: {end_response.text}"
        )

        scooter_response = requests.get(
            f"{SCOOTER_ITEM_URL}/{scooter_id}", timeout=10, headers=_admin_auth_headers()
        )
        assert scooter_response.status_code == 200, (
            f"Failed to query scooter after ending the trip, status {scooter_response.status_code}, response: {scooter_response.text}"
        )
        scooter = scooter_response.json()
        assert scooter.get("status") == "available", f"Scooter should be available after ending the trip, response item: {scooter}"
    finally:
        cleanup_booking_if_possible(booking_id, headers)


def test_extend_paid_booking_increases_total_cost() -> None:
    """Test case 5: Extending a paid booking should increase the total cost."""
    user_id, headers = create_test_user_and_get_id("bookings_extend")
    scooter_id = ensure_available_scooter_id()
    package_id = ensure_package_id()

    booking_id: int | None = None
    try:
        created = place_booking(user_id, scooter_id, package_id, headers)
        booking_id = created["id"]
        before_cost = Decimal(str(created.get("totalCost")))

        pay_response = requests.post(
            f"{BOOKING_PAY_URL}/{booking_id}",
            params={"cardNumber": "888877776666"},
            timeout=10,
            headers=headers,
        )
        assert pay_response.status_code == 200, (
            f"Setup failed: payment request failed, status {pay_response.status_code}, response: {pay_response.text}"
        )

        extra_cost = Decimal("5.50")
        extend_response = requests.post(
            f"{BOOKING_EXTEND_URL}/{booking_id}",
            params={"extraCost": str(extra_cost)},
            timeout=10,
            headers=headers,
        )
        assert extend_response.status_code == 200, (
            f"Extending the booking should succeed, status {extend_response.status_code}, response: {extend_response.text}"
        )

        bookings = get_user_bookings(user_id, headers)
        target = next((b for b in bookings if isinstance(b, dict) and b.get("id") == booking_id), None)
        assert target is not None, f"Could not find the target booking after extension, bookingId={booking_id}"

        after_cost = Decimal(str(target.get("totalCost")))
        assert after_cost == before_cost + extra_cost, (
            f"Total cost after extension is incorrect, expected {before_cost + extra_cost}, got {after_cost}"
        )
    finally:
        cleanup_booking_if_possible(booking_id, headers)


def test_admin_place_booking_success() -> None:
    """Test case 6: Admin-placed booking should succeed."""
    scooter_id = ensure_available_scooter_id()

    payload = {
        "scooterId": scooter_id,
        "guestName": f"Guest_{int(time.time() * 1000)}",
        "guestPhone": "13900000000",
        "totalCost": "18.80",
    }
    booking_id: int | None = None
    try:
        response = requests.post(BOOKING_ADMIN_PLACE_URL, json=payload, timeout=10, headers=_admin_auth_headers())
        assert response.status_code == 200, (
            f"Admin-placed booking should succeed, status {response.status_code}, response: {response.text}"
        )

        data = response.json()
        booking_id = data.get("id")
        assert isinstance(booking_id, int), f"Invalid booking id returned by admin booking, response: {data}"
        assert data.get("status") == "paid", f"Status for admin booking should be paid, response: {data}"
    finally:
        cleanup_booking_if_possible(booking_id)


def test_revenue_endpoints_success() -> None:
    """Test case 7: Revenue endpoints are accessible and return list structures."""
    weekly_response = requests.get(BOOKING_REVENUE_URL, timeout=10, headers=_admin_auth_headers())
    assert weekly_response.status_code == 200, (
        f"Weekly revenue endpoint should succeed, status {weekly_response.status_code}, response: {weekly_response.text}"
    )
    weekly_data = weekly_response.json()
    assert isinstance(weekly_data, list), f"Weekly revenue response should be a list, got {type(weekly_data)}, response: {weekly_data}"

    daily_response = requests.get(BOOKING_DAILY_REVENUE_URL, timeout=10, headers=_admin_auth_headers())
    assert daily_response.status_code == 200, (
        f"Daily revenue endpoint should succeed, status {daily_response.status_code}, response: {daily_response.text}"
    )
    daily_data = daily_response.json()
    assert isinstance(daily_data, list), f"Daily revenue response should be a list, got {type(daily_data)}, response: {daily_data}"



def run_all_tests() -> None:
    """Execute all test cases in order and print a summary."""
    tests: List[Tuple[str, Callable[[], None]]] = [
        ("User bookings list includes new booking", test_get_user_bookings_contains_new_booking),
        ("Payment succeeds", test_pay_booking_success),
        ("Cancellation succeeds", test_cancel_booking_success),
        ("Ending the trip releases the scooter", test_end_trip_releases_scooter),
        ("Extending a paid booking succeeds", test_extend_paid_booking_increases_total_cost),
        ("Admin booking succeeds", test_admin_place_booking_success),
        ("Revenue endpoints are accessible", test_revenue_endpoints_success),
    ]

    passed = 0
    failed = 0

    print("开始执行订单扩展接口自动化测试...")
    print(f"用户订单接口：{BOOKING_USER_URL}/{{userId}}")
    print(f"支付接口：{BOOKING_PAY_URL}/{{bookingId}}")
    print(f"取消接口：{BOOKING_CANCEL_URL}/{{bookingId}}")
    print(f"结束接口：{BOOKING_END_URL}/{{bookingId}}")
    print(f"延长接口：{BOOKING_EXTEND_URL}/{{bookingId}}")
    print(f"管理员代下单接口：{BOOKING_ADMIN_PLACE_URL}")
    print(f"周收入接口：{BOOKING_REVENUE_URL}")
    print(f"日收入接口：{BOOKING_DAILY_REVENUE_URL}")

    for name, func in tests:
        try:
            func()
            passed += 1
            print(f"PASS - {name}")
        except Exception as exc:  # noqa: BLE001
            failed += 1
            print(f"FAIL - {name} -> {exc}")

    cleanup_created_scooters()

    print("\n测试结束")
    print(f"通过: {passed}")
    print(f"失败: {failed}")


if __name__ == "__main__":
    run_all_tests()
