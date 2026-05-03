"""
用户列表接口
测试接口: GET /api/users
"""

from __future__ import annotations

import os
import time
from typing import Callable, List, Tuple

import requests


BASE_URL = os.getenv("BASE_URL", "http://localhost:8080")
REGISTER_URL = f"{BASE_URL}/api/users/register"
USERS_URL = f"{BASE_URL}/api/users"


def create_user_for_listing() -> str:
    """创建一个唯一用户并返回用户名，用于列表校验。"""
    suffix = str(int(time.time() * 1000))
    username = f"list_user_{suffix}"
    payload = {
        "username": username,
        "email": f"{username}@mail.com",
        "passwordHash": "123456",
    }
    response = requests.post(REGISTER_URL, json=payload, params={"confirmPassword": "123456"}, timeout=10)
    assert response.status_code == 200, (
        f"前置失败：创建列表测试用户失败，状态码 {response.status_code}，响应：{response.text}"
    )
    return username


def test_user_list_status_ok() -> None:
    """用例1：用户列表接口应返回 200。"""
    response = requests.get(USERS_URL, timeout=10)
    assert response.status_code == 200, (
        f"期望状态码 200，实际 {response.status_code}，响应：{response.text}"
    )


def test_user_list_is_json_array() -> None:
    """用例2：响应体应为 JSON 数组。"""
    response = requests.get(USERS_URL, timeout=10)
    assert response.status_code == 200, (
        f"状态码异常，无法继续校验结构，实际 {response.status_code}，响应：{response.text}"
    )

    data = response.json()
    assert isinstance(data, list), f"期望响应为数组(list)，实际类型 {type(data)}，响应：{data}"


def test_user_list_contains_new_user() -> None:
    """用例3：创建用户后，列表中应可查询到该用户。"""
    username = create_user_for_listing()

    response = requests.get(USERS_URL, timeout=10)
    assert response.status_code == 200, (
        f"获取用户列表失败，状态码 {response.status_code}，响应：{response.text}"
    )

    data = response.json()
    assert isinstance(data, list), f"期望响应为数组(list)，实际类型 {type(data)}，响应：{data}"

    matched = [u for u in data if isinstance(u, dict) and u.get("username") == username]
    assert matched, f"用户列表未找到新建用户，username={username}"

    user = matched[0]
    assert isinstance(user.get("id"), int), f"用户 id 非法，响应元素：{user}"
    assert isinstance(user.get("email"), str), f"用户 email 非法，响应元素：{user}"


def run_all_tests() -> None:
    """按顺序执行所有用例并输出汇总。"""
    tests: List[Tuple[str, Callable[[], None]]] = [
        ("用户列表接口返回 200", test_user_list_status_ok),
        ("用户列表响应为 JSON 数组", test_user_list_is_json_array),
        ("用户列表包含新建用户", test_user_list_contains_new_user),
    ]

    passed = 0
    failed = 0

    print("开始执行用户列表接口自动化测试...")
    print(f"目标接口：{USERS_URL}")

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
