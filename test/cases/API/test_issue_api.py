"""
故障接口
测试接口：
1) POST /api/issues/report
2) GET /api/issues
3) PUT /api/issues/resolve/{issueId}
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
ISSUES_URL = f"{BASE_URL}/api/issues"
ISSUE_REPORT_URL = f"{BASE_URL}/api/issues/report"
ISSUE_RESOLVE_URL = f"{BASE_URL}/api/issues/resolve"


def create_test_user_and_get_id() -> int:
    """创建测试用户并通过登录拿到 userId。"""
    suffix = str(int(time.time() * 1000))
    username = f"issue_user_{suffix}"
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

    data = login_response.json()
    user_id = data.get("id")
    assert isinstance(user_id, int), f"前置失败：登录响应未返回有效 userId，响应：{data}"
    return user_id


def ensure_scooter_id() -> int:
    """确保至少有一辆车，返回可用 scooterId。"""
    response = requests.get(SCOOTERS_URL, timeout=10)
    assert response.status_code == 200, (
        f"前置失败：获取车辆列表失败，状态码 {response.status_code}，响应：{response.text}"
    )

    scooters = response.json()
    if isinstance(scooters, list):
        for scooter in scooters:
            if isinstance(scooter.get("id"), int):
                return scooter["id"]

    suffix = str(int(time.time() * 1000))
    add_payload = {
        "model": f"issue_auto_model_{suffix}",
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
        if isinstance(scooter.get("id"), int):
            return scooter["id"]

    raise AssertionError("前置失败：未找到可用 scooterId")


def report_issue(user_id: int, scooter_id: int, description: str, priority: str = "high") -> requests.Response:
    """调用上报故障接口。"""
    payload = {
        "userId": user_id,
        "scooterId": scooter_id,
        "description": description,
        "priority": priority,
    }
    return requests.post(ISSUE_REPORT_URL, json=payload, timeout=10)


def find_issue_id_by_description(description: str) -> int:
    """根据唯一描述在列表中查找 issueId。"""
    response = requests.get(ISSUES_URL, timeout=10)
    assert response.status_code == 200, (
        f"查询故障列表失败，状态码 {response.status_code}，响应：{response.text}"
    )

    data = response.json()
    assert isinstance(data, list), f"故障列表结构异常，响应：{data}"

    for issue in data:
        if isinstance(issue, dict) and issue.get("description") == description and isinstance(issue.get("id"), int):
            return issue["id"]

    raise AssertionError(f"未在故障列表找到目标记录，description={description}")


def test_report_issue_success() -> None:
    """用例1：上报故障成功。"""
    user_id = create_test_user_and_get_id()
    scooter_id = ensure_scooter_id()
    description = f"issue_report_{int(time.time() * 1000)}"

    response = report_issue(user_id, scooter_id, description, priority="high")
    assert response.status_code == 200, (
        f"上报故障应成功，实际状态码 {response.status_code}，响应：{response.text}"
    )
    assert "submitted" in response.text.lower() or "thank you" in response.text.lower(), (
        f"成功文案不符合预期，响应：{response.text}"
    )


def test_view_all_issues_contains_reported_issue() -> None:
    """用例2：上报后在故障列表里可查询到记录。"""
    user_id = create_test_user_and_get_id()
    scooter_id = ensure_scooter_id()
    description = f"issue_list_{int(time.time() * 1000)}"

    report_response = report_issue(user_id, scooter_id, description, priority="medium")
    assert report_response.status_code == 200, (
        f"前置失败：上报故障失败，状态码 {report_response.status_code}，响应：{report_response.text}"
    )

    response = requests.get(ISSUES_URL, timeout=10)
    assert response.status_code == 200, (
        f"查询故障列表应成功，实际状态码 {response.status_code}，响应：{response.text}"
    )

    data = response.json()
    assert isinstance(data, list), f"期望响应为数组(list)，实际类型 {type(data)}，响应：{data}"

    matches = [i for i in data if isinstance(i, dict) and i.get("description") == description]
    assert matches, f"故障列表未找到刚上报记录，description={description}"

    issue = matches[0]
    assert issue.get("userId") == user_id, f"userId 不匹配，响应元素：{issue}"
    assert issue.get("scooterId") == scooter_id, f"scooterId 不匹配，响应元素：{issue}"
    assert issue.get("priority") in {"low", "medium", "high"}, f"priority 值异常，响应元素：{issue}"


def test_resolve_issue_success() -> None:
    """用例3：管理员处理故障成功，状态应更新为 resolved。"""
    user_id = create_test_user_and_get_id()
    scooter_id = ensure_scooter_id()
    description = f"issue_resolve_{int(time.time() * 1000)}"

    report_response = report_issue(user_id, scooter_id, description, priority="low")
    assert report_response.status_code == 200, (
        f"前置失败：上报故障失败，状态码 {report_response.status_code}，响应：{report_response.text}"
    )

    issue_id = find_issue_id_by_description(description)

    resolve_response = requests.put(f"{ISSUE_RESOLVE_URL}/{issue_id}", timeout=10)
    assert resolve_response.status_code == 200, (
        f"处理故障应成功，实际状态码 {resolve_response.status_code}，响应：{resolve_response.text}"
    )

    list_response = requests.get(ISSUES_URL, timeout=10)
    assert list_response.status_code == 200, (
        f"处理后查询故障列表失败，状态码 {list_response.status_code}，响应：{list_response.text}"
    )

    issues = list_response.json()
    target = next((i for i in issues if isinstance(i, dict) and i.get("id") == issue_id), None)
    assert target is not None, f"处理后未找到目标故障，issueId={issue_id}"
    assert target.get("status") == "resolved", f"处理后状态应为 resolved，响应元素：{target}"


def run_all_tests() -> None:
    """按顺序执行所有用例并输出汇总。"""
    tests: List[Tuple[str, Callable[[], None]]] = [
        ("上报故障成功", test_report_issue_success),
        ("故障列表包含上报记录", test_view_all_issues_contains_reported_issue),
        ("处理故障成功", test_resolve_issue_success),
    ]

    passed = 0
    failed = 0

    print("开始执行故障接口自动化测试...")
    print(f"上报接口：{ISSUE_REPORT_URL}")
    print(f"列表接口：{ISSUES_URL}")
    print(f"处理接口：{ISSUE_RESOLVE_URL}/{{issueId}}")

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
