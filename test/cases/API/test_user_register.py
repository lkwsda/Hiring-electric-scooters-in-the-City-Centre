"""
用户注册接口
测试接口:POST /api/users/register
"""

from __future__ import annotations

import os
import time
from typing import Callable, List, Tuple

import requests


# 可按需修改服务地址，或通过环境变量 BASE_URL 覆盖
BASE_URL = os.getenv("BASE_URL", "http://localhost:8080")
REGISTER_URL = f"{BASE_URL}/api/users/register"


def build_unique_user(prefix: str = "autotest") -> dict:
    """生成唯一用户名和邮箱，避免重复注册导致失败。"""
    suffix = str(int(time.time() * 1000))
    username = f"{prefix}_{suffix}"
    email = f"{username}@mail.com"
    return {
        "username": username,
        "email": email,
    }


def test_register_success() -> None:
    """用例1:注册成功。"""
    user = build_unique_user("ok")

    # 接口请求参数：
    # 1) JSON body 里放 username/email/passwordHash
    # 2) query 参数里放 confirmPassword
    payload = {
        "username": user["username"],
        "email": user["email"],
        "passwordHash": "123456",
    }
    params = {"confirmPassword": "123456"}

    response = requests.post(REGISTER_URL, json=payload, params=params, timeout=10)

    # 断言1：状态码应为 200
    assert response.status_code == 200, (
        f"期望状态码 200,实际 {response.status_code}，响应：{response.text}"
    )

    # 断言2：响应应包含成功关键字
    assert "Registration Successful" in response.text, (
        f"成功文案不符合预期，响应：{response.text}"
    )


def test_register_password_too_short() -> None:
    """用例2:密码太短,应失败。"""
    user = build_unique_user("shortpwd")
    payload = {
        "username": user["username"],
        "email": user["email"],
        "passwordHash": "123",
    }
    params = {"confirmPassword": "123"}

    response = requests.post(REGISTER_URL, json=payload, params=params, timeout=10)

    # 当前项目失败通常返回 400；这里用“非200 + 关键字”更稳妥
    assert response.status_code != 200, (
        f"密码过短不应成功，实际状态码 {response.status_code}，响应：{response.text}"
    )
    assert "Validation Failed" in response.text or "at least 6" in response.text, (
        f"错误信息不符合预期，响应：{response.text}"
    )


def test_register_confirm_mismatch() -> None:
    """用例3:确认密码不一致,应失败。"""
    user = build_unique_user("mismatch")
    payload = {
        "username": user["username"],
        "email": user["email"],
        "passwordHash": "123456",
    }
    params = {"confirmPassword": "654321"}

    response = requests.post(REGISTER_URL, json=payload, params=params, timeout=10)

    assert response.status_code != 200, (
        f"确认密码不一致不应成功，实际状态码 {response.status_code}，响应：{response.text}"
    )
    assert "do not match" in response.text or "Validation Failed" in response.text, (
        f"错误信息不符合预期，响应：{response.text}"
    )


def run_all_tests() -> None:
    """顺序执行所有用例并打印汇总。"""
    tests: List[Tuple[str, Callable[[], None]]] = [
        ("注册成功", test_register_success),
        ("密码太短注册失败", test_register_password_too_short),
        ("确认密码不一致注册失败", test_register_confirm_mismatch),
    ]

    passed = 0
    failed = 0

    print("开始执行用户注册接口自动化测试...")
    print(f"目标接口：{REGISTER_URL}")

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
