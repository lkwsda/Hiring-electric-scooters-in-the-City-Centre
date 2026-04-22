"""
订单扩展接口
测试接口：
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
from typing import Callable, List, Tuple

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


def create_test_user_and_get_id(prefix: str = "booking_extra") -> int:
    """创建测试用户并返回 userId。"""
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
        f"前置失败：注册用户失败，状态码 {register_response.status_code}，响应：{register_response.text}"
    )

    login_response = requests.post(
        LOGIN_URL,
        params={"username": username, "password": password},
        timeout=10,
    )
    assert login_response.status_code == 200, (
        f"前置失败：登录用户失败，状态码 {login_response.status_code}，响应：{login_response.text}"
    )

    user_data = login_response.json()
    user_id = user_data.get("id")
    assert isinstance(user_id, int), f"前置失败：登录响应未返回有效 userId，响应：{user_data}"
    return user_id


def ensure_available_scooter_id() -> int:
    """确保存在可用车辆，返回 scooterId。"""
    response = requests.get(SCOOTERS_URL, timeout=10)
    assert response.status_code == 200, (
        f"前置失败：获取车辆列表失败，状态码 {response.status_code}，响应：{response.text}"
    )

    scooters = response.json()
    if isinstance(scooters, list):
        for scooter in scooters:
            if scooter.get("status") == "available" and isinstance(scooter.get("id"), int):
                return scooter["id"]

    suffix = str(int(time.time() * 1000))
    add_payload = {
        "model": f"booking_extra_model_{suffix}",
        "batteryLevel": 100,
        "latitude": 53.8012,
        "longitude": -1.5485,
        "status": "available",
    }
    add_response = requests.post(ADD_SCOOTER_URL, json=add_payload, timeout=10)
    assert add_response.status_code == 200, (
        f"前置失败：新增车辆失败，状态码 {add_response.status_code}，响应：{add_response.text}"
    )

    refresh_response = requests.get(SCOOTERS_URL, timeout=10)
    assert refresh_response.status_code == 200, (
        f"前置失败：刷新车辆列表失败，状态码 {refresh_response.status_code}，响应：{refresh_response.text}"
    )

    refreshed = refresh_response.json()
    for scooter in refreshed:
        if scooter.get("status") == "available" and isinstance(scooter.get("id"), int):
            return scooter["id"]

    raise AssertionError("前置失败：未找到可用车辆")


def ensure_package_id() -> int:
    """确保存在套餐并返回 packageId。"""
    response = requests.get(PACKAGES_URL, timeout=10)
    assert response.status_code == 200, (
        f"前置失败：获取套餐列表失败，状态码 {response.status_code}，响应：{response.text}"
    )

    packages = response.json()
    assert isinstance(packages, list) and packages, (
        f"前置失败：套餐列表为空或结构异常，响应：{packages}"
    )

    package_id = packages[0].get("id") if isinstance(packages[0], dict) else None
    assert isinstance(package_id, int), f"前置失败：无效 packageId，响应元素：{packages[0]}"
    return package_id


def place_booking(user_id: int, scooter_id: int, package_id: int) -> dict:
    """下单并返回 booking 对象。"""
    payload = {
        "userId": user_id,
        "scooterId": scooter_id,
        "packageId": package_id,
    }
    response = requests.post(PLACE_BOOKING_URL, json=payload, timeout=10)
    assert response.status_code == 200, (
        f"前置失败：下单失败，状态码 {response.status_code}，响应：{response.text}"
    )
    data = response.json()
    assert isinstance(data.get("id"), int), f"前置失败：下单返回 booking id 非法，响应：{data}"
    return data


def get_user_bookings(user_id: int) -> list:
    """查询用户订单列表。"""
    response = requests.get(f"{BOOKING_USER_URL}/{user_id}", timeout=10)
    assert response.status_code == 200, (
        f"查询用户订单失败，状态码 {response.status_code}，响应：{response.text}"
    )
    data = response.json()
    assert isinstance(data, list), f"期望用户订单为数组(list)，实际类型 {type(data)}，响应：{data}"
    return data


def test_get_user_bookings_contains_new_booking() -> None:
    """用例1：创建订单后，用户订单列表应包含该记录。"""
    user_id = create_test_user_and_get_id("bookings_user")
    scooter_id = ensure_available_scooter_id()
    package_id = ensure_package_id()

    created = place_booking(user_id, scooter_id, package_id)
    booking_id = created["id"]

    bookings = get_user_bookings(user_id)
    target = next((b for b in bookings if isinstance(b, dict) and b.get("id") == booking_id), None)
    assert target is not None, f"用户订单中未找到刚创建记录，bookingId={booking_id}"


def test_pay_booking_success() -> None:
    """用例2：支付接口应把 pending 订单更新为 paid。"""
    user_id = create_test_user_and_get_id("bookings_pay")
    scooter_id = ensure_available_scooter_id()
    package_id = ensure_package_id()

    created = place_booking(user_id, scooter_id, package_id)
    booking_id = created["id"]

    pay_response = requests.post(f"{BOOKING_PAY_URL}/{booking_id}", params={"cardNumber": "123456789012"}, timeout=10)
    assert pay_response.status_code == 200, (
        f"支付应成功，实际状态码 {pay_response.status_code}，响应：{pay_response.text}"
    )

    bookings = get_user_bookings(user_id)
    target = next((b for b in bookings if isinstance(b, dict) and b.get("id") == booking_id), None)
    assert target is not None, f"支付后未找到目标订单，bookingId={booking_id}"
    assert target.get("status") == "paid", f"支付后状态应为 paid，响应元素：{target}"


def test_cancel_booking_success() -> None:
    """用例3：取消订单后状态应为 canceled。"""
    user_id = create_test_user_and_get_id("bookings_cancel")
    scooter_id = ensure_available_scooter_id()
    package_id = ensure_package_id()

    created = place_booking(user_id, scooter_id, package_id)
    booking_id = created["id"]

    cancel_response = requests.post(f"{BOOKING_CANCEL_URL}/{booking_id}", timeout=10)
    assert cancel_response.status_code == 200, (
        f"取消订单应成功，实际状态码 {cancel_response.status_code}，响应：{cancel_response.text}"
    )

    bookings = get_user_bookings(user_id)
    target = next((b for b in bookings if isinstance(b, dict) and b.get("id") == booking_id), None)
    assert target is not None, f"取消后未找到目标订单，bookingId={booking_id}"
    assert target.get("status") == "canceled", f"取消后状态应为 canceled，响应元素：{target}"


def test_end_trip_releases_scooter() -> None:
    """用例4：结束行程后，车辆状态应回到 available。"""
    user_id = create_test_user_and_get_id("bookings_end")
    scooter_id = ensure_available_scooter_id()
    package_id = ensure_package_id()

    created = place_booking(user_id, scooter_id, package_id)
    booking_id = created["id"]

    end_response = requests.post(f"{BOOKING_END_URL}/{booking_id}", timeout=10)
    assert end_response.status_code == 200, (
        f"结束行程应成功，实际状态码 {end_response.status_code}，响应：{end_response.text}"
    )

    scooter_response = requests.get(f"{SCOOTER_ITEM_URL}/{scooter_id}", timeout=10)
    assert scooter_response.status_code == 200, (
        f"结束后查询车辆失败，状态码 {scooter_response.status_code}，响应：{scooter_response.text}"
    )
    scooter = scooter_response.json()
    assert scooter.get("status") == "available", f"结束后车辆应为 available，响应元素：{scooter}"


def test_extend_paid_booking_increases_total_cost() -> None:
    """用例5：延长已支付订单应增加总金额。"""
    user_id = create_test_user_and_get_id("bookings_extend")
    scooter_id = ensure_available_scooter_id()
    package_id = ensure_package_id()

    created = place_booking(user_id, scooter_id, package_id)
    booking_id = created["id"]
    before_cost = Decimal(str(created.get("totalCost")))

    pay_response = requests.post(f"{BOOKING_PAY_URL}/{booking_id}", params={"cardNumber": "888877776666"}, timeout=10)
    assert pay_response.status_code == 200, (
        f"前置失败：支付订单失败，状态码 {pay_response.status_code}，响应：{pay_response.text}"
    )

    extra_cost = Decimal("5.50")
    extend_response = requests.post(
        f"{BOOKING_EXTEND_URL}/{booking_id}",
        params={"extraCost": str(extra_cost)},
        timeout=10,
    )
    assert extend_response.status_code == 200, (
        f"延长订单应成功，实际状态码 {extend_response.status_code}，响应：{extend_response.text}"
    )

    bookings = get_user_bookings(user_id)
    target = next((b for b in bookings if isinstance(b, dict) and b.get("id") == booking_id), None)
    assert target is not None, f"延长后未找到目标订单，bookingId={booking_id}"

    after_cost = Decimal(str(target.get("totalCost")))
    assert after_cost == before_cost + extra_cost, (
        f"延长后总金额不正确，期望 {before_cost + extra_cost}，实际 {after_cost}"
    )


def test_admin_place_booking_success() -> None:
    """用例6：管理员代下单成功。"""
    scooter_id = ensure_available_scooter_id()

    payload = {
        "scooterId": scooter_id,
        "guestName": f"Guest_{int(time.time() * 1000)}",
        "guestPhone": "13900000000",
        "totalCost": "18.80",
    }
    response = requests.post(BOOKING_ADMIN_PLACE_URL, json=payload, timeout=10)
    assert response.status_code == 200, (
        f"管理员代下单应成功，实际状态码 {response.status_code}，响应：{response.text}"
    )

    data = response.json()
    assert isinstance(data.get("id"), int), f"代下单返回 booking id 非法，响应：{data}"
    assert data.get("status") == "paid", f"代下单状态应为 paid，响应：{data}"


def test_revenue_endpoints_success() -> None:
    """用例7：收入统计接口可访问，返回数组结构。"""
    weekly_response = requests.get(BOOKING_REVENUE_URL, timeout=10)
    assert weekly_response.status_code == 200, (
        f"周收入接口应成功，实际状态码 {weekly_response.status_code}，响应：{weekly_response.text}"
    )
    weekly_data = weekly_response.json()
    assert isinstance(weekly_data, list), f"周收入响应应为数组(list)，实际类型 {type(weekly_data)}，响应：{weekly_data}"

    daily_response = requests.get(BOOKING_DAILY_REVENUE_URL, timeout=10)
    assert daily_response.status_code == 200, (
        f"日收入接口应成功，实际状态码 {daily_response.status_code}，响应：{daily_response.text}"
    )
    daily_data = daily_response.json()
    assert isinstance(daily_data, list), f"日收入响应应为数组(list)，实际类型 {type(daily_data)}，响应：{daily_data}"



def run_all_tests() -> None:
    """按顺序执行所有用例并输出汇总。"""
    tests: List[Tuple[str, Callable[[], None]]] = [
        ("用户订单列表包含新订单", test_get_user_bookings_contains_new_booking),
        ("支付订单成功", test_pay_booking_success),
        ("取消订单成功", test_cancel_booking_success),
        ("结束行程释放车辆", test_end_trip_releases_scooter),
        ("延长已支付订单成功", test_extend_paid_booking_increases_total_cost),
        ("管理员代下单成功", test_admin_place_booking_success),
        ("收入统计接口可访问", test_revenue_endpoints_success),
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

    print("\n测试结束")
    print(f"通过: {passed}")
    print(f"失败: {failed}")


if __name__ == "__main__":
    run_all_tests()
