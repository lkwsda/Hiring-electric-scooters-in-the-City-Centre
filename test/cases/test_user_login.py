"""
用户登录接口
主要测试接口:POST /api/users/login
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
	"""创建一个唯一测试用户，返回 (username, password)。"""
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
		f"前置步骤失败：测试用户创建失败，状态码 {response.status_code}，响应：{response.text}"
	)
	return username, password


def test_login_success(username: str, password: str) -> None:
	"""case1:正确账号密码登录成功。"""
	params = {
		"username": username,
		"password": password,
	}

	response = requests.post(LOGIN_URL, params=params, timeout=10)

	# 断言1：状态码应为 200
	assert response.status_code == 200, (
		f"期望状态码 200,实际 {response.status_code}，响应：{response.text}"
	)

	# 断言2：响应中应返回对应用户名
	data = response.json()
	assert data.get("username") == username, f"username 校验失败，响应：{data}"


def test_login_wrong_password(username: str) -> None:
	"""用例2,密码错误,登录应失败。"""
	params = {
		"username": username,
		"password": "wrong123",
	}

	response = requests.post(LOGIN_URL, params=params, timeout=10)

	# 当前项目中失败通常返回 400；为稳妥起见断言“非200 + 错误关键字”
	assert response.status_code != 200, (
		f"密码错误不应成功，实际状态码 {response.status_code}，响应：{response.text}"
	)
	assert "Login Failed" in response.text or "Incorrect" in response.text, (
		f"错误信息不符合预期，响应：{response.text}"
	)


def test_login_empty_username() -> None:
	"""用例3,用户名为空,登录应失败。"""
	params = {
		"username": "",
		"password": "123456",
	}

	response = requests.post(LOGIN_URL, params=params, timeout=10)

	assert response.status_code != 200, (
		f"用户名为空不应成功，实际状态码 {response.status_code}，响应：{response.text}"
	)


def run_all_tests() -> None:
	"""按顺序执行所有用例并输出汇总。"""
	print("开始执行用户登录接口自动化测试...")
	print(f"注册接口：{REGISTER_URL}")
	print(f"登录接口：{LOGIN_URL}")

	# 前置：自动创建测试账号
	username, password = create_test_user()
	print(f"已创建测试账号：{username}")

	tests: List[Tuple[str, Callable[[], None]]] = [
		("正确账号密码登录成功", lambda: test_login_success(username, password)),
		("密码错误登录失败", lambda: test_login_wrong_password(username)),
		("用户名为空登录失败", test_login_empty_username),
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

	print("\n测试结束")
	print(f"通过: {passed}")
	print(f"失败: {failed}")


if __name__ == "__main__":
	run_all_tests()
