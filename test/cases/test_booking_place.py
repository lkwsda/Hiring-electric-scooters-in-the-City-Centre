"""
单接口自动化测试（新手版）：下单接口

测试接口:POST /api/bookings/place
运行前提：后端服务已启动，默认地址 http://localhost:8080
"""

from __future__ import annotations

import os
import time
from typing import Callable, List, Tuple

import requests


BASE_URL = os.getenv("BASE_URL", "http://localhost:8080")
REGISTER_URL = f"{BASE_URL}/api/users/register"
LOGIN_URL = f"{BASE_URL}/api/users/login"
SCOOTERS_URL = f"{BASE_URL}/api/scooters"
ADD_SCOOTER_URL = f"{BASE_URL}/api/scooters/add"
PLACE_BOOKING_URL = f"{BASE_URL}/api/bookings/place"
CANCEL_BOOKING_URL = f"{BASE_URL}/api/bookings/cancel"


def create_test_user_and_get_id() -> int:
    """创建测试用户并通过登录拿到 userId。"""
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
    """确保存在一辆可用车辆，返回 scooterId。"""
    response = requests.get(SCOOTERS_URL, timeout=10)
    assert response.status_code == 200, (
        f"前置失败：获取车辆列表失败，状态码 {response.status_code}，响应：{response.text}"
    )

    scooters = response.json()
    if isinstance(scooters, list):
        for scooter in scooters:
            if scooter.get("status") == "available" and isinstance(scooter.get("id"), int):
                return scooter["id"]

    # 如果当前没有可用车，则自动新增一辆
    suffix = str(int(time.time() * 1000))
    add_payload = {
        "model": f"autotest_model_{suffix}",
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

    refreshed_scooters = refresh_response.json()
    for scooter in refreshed_scooters:
        if scooter.get("status") == "available" and isinstance(scooter.get("id"), int):
            return scooter["id"]

    raise AssertionError("前置失败：未找到可用车辆")


def place_booking(user_id: int, scooter_id: int, total_cost: str = "10.00") -> requests.Response:
    """调用下单接口并返回响应。"""
    payload = {
        "userId": user_id,
        "scooterId": scooter_id,
        "totalCost": total_cost,
    }
    return requests.post(PLACE_BOOKING_URL, json=payload, timeout=10)


def cleanup_booking_if_possible(booking_id: int | None) -> None:
    """测试收尾：尽量取消订单，避免占用车辆影响其他用例。"""
    if not isinstance(booking_id, int):
        return
    requests.post(f"{CANCEL_BOOKING_URL}/{booking_id}", timeout=10)


def test_place_booking_success() -> None:
    """用例1:下单成功,返回 pending 订单。"""
    user_id = create_test_user_and_get_id()
    scooter_id = ensure_available_scooter_id()

    booking_id: int | None = None
    try:
        response = place_booking(user_id, scooter_id, total_cost="15.50")
        assert response.status_code == 200, (
            f"期望状态码 200,实际 {response.status_code}，响应：{response.text}"
        )

        data = response.json()
        booking_id = data.get("id")

        assert isinstance(booking_id, int), f"下单成功后应返回 booking id，响应：{data}"
        assert data.get("userId") == user_id, f"userId 不匹配，响应：{data}"
        assert data.get("scooterId") == scooter_id, f"scooterId 不匹配，响应：{data}"
        assert data.get("status") == "pending", f"状态应为 pending，响应：{data}"
    finally:
        cleanup_booking_if_possible(booking_id)


def test_place_booking_invalid_scooter_should_fail() -> None:
    """用例2:车辆不存在,下单应失败。"""
    user_id = create_test_user_and_get_id()
    invalid_scooter_id = 99999999

    response = place_booking(user_id, invalid_scooter_id, total_cost="10.00")

    assert response.status_code != 200, (
        f"车辆不存在不应下单成功，实际状态码 {response.status_code}，响应：{response.text}"
    )
    error_text = response.text.lower()
    expected_keywords = ["not found", "validation failed", "incorrect result size"]
    assert any(keyword in error_text for keyword in expected_keywords), (
        f"错误信息不符合预期，响应：{response.text}"
    )


def test_place_booking_same_scooter_twice_should_fail() -> None:
    """用例3：同一辆车连续下单，第二次应失败。"""
    user_id_1 = create_test_user_and_get_id()
    user_id_2 = create_test_user_and_get_id()
    scooter_id = ensure_available_scooter_id()

    first_booking_id: int | None = None
    try:
        first_response = place_booking(user_id_1, scooter_id, total_cost="9.90")
        assert first_response.status_code == 200, (
            f"第一次下单应成功，实际状态码 {first_response.status_code}，响应：{first_response.text}"
        )

        first_data = first_response.json()
        first_booking_id = first_data.get("id")
        assert isinstance(first_booking_id, int), f"第一次下单未返回有效 booking id，响应：{first_data}"

        second_response = place_booking(user_id_2, scooter_id, total_cost="8.80")
        assert second_response.status_code != 200, (
            f"同车二次下单不应成功，实际状态码 {second_response.status_code}，响应：{second_response.text}"
        )
        assert "already in use" in second_response.text.lower() or "validation failed" in second_response.text.lower(), (
            f"错误信息不符合预期，响应：{second_response.text}"
        )
    finally:
        cleanup_booking_if_possible(first_booking_id)


def run_all_tests() -> None:
    """按顺序执行所有用例并输出汇总。"""
    tests: List[Tuple[str, Callable[[], None]]] = [
        ("下单成功返回 pending", test_place_booking_success),
        ("不存在车辆下单失败", test_place_booking_invalid_scooter_should_fail),
        ("同车重复下单第二次失败", test_place_booking_same_scooter_twice_should_fail),
    ]

    passed = 0
    failed = 0

    print("开始执行下单接口自动化测试...")
    print(f"注册接口：{REGISTER_URL}")
    print(f"登录接口：{LOGIN_URL}")
    print(f"车辆接口：{SCOOTERS_URL}")
    print(f"下单接口：{PLACE_BOOKING_URL}")

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
