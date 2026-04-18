"""
单接口自动化测试（新手版）：车辆列表接口

测试接口:GET /api/scooters
运行前提：后端服务已启动，默认地址 http://localhost:8080
"""

from __future__ import annotations

import os
from typing import Any, Callable, List, Tuple

import requests


BASE_URL = os.getenv("BASE_URL", "http://localhost:8080")
SCOOTER_LIST_URL = f"{BASE_URL}/api/scooters"


def fetch_scooter_list() -> requests.Response:
    """调用车辆列表接口，返回原始响应对象。"""
    return requests.get(SCOOTER_LIST_URL, timeout=10)


def test_scooter_list_status_ok() -> None:
    """用例1:接口可访问,状态码应为 200。"""
    response = fetch_scooter_list()

    assert response.status_code == 200, (
        f"期望状态码 200,实际 {response.status_code}，响应：{response.text}"
    )


def test_scooter_list_is_json_array() -> None:
    """用例2:响应体应可解析为 JSON 数组。"""
    response = fetch_scooter_list()

    assert response.status_code == 200, (
        f"状态码异常，无法继续校验 JSON 结构，实际 {response.status_code}，响应：{response.text}"
    )

    try:
        data = response.json()
    except ValueError as exc:
        raise AssertionError(f"响应不是合法 JSON,响应:{response.text}") from exc

    assert isinstance(data, list), f"期望响应为数组(list)，实际类型 {type(data)}，响应：{data}"


def test_scooter_list_item_schema_when_not_empty() -> None:
    """用例3:当列表非空时,首元素应包含关键字段。"""
    response = fetch_scooter_list()
    assert response.status_code == 200, (
        f"状态码异常，无法继续校验字段，实际 {response.status_code}，响应：{response.text}"
    )

    data = response.json()
    assert isinstance(data, list), f"期望响应为数组(list)，实际类型 {type(data)}，响应：{data}"

    # 空列表属于合法场景，此用例仅在非空时检查结构
    if not data:
        return

    first = data[0]
    assert isinstance(first, dict), f"数组元素应为对象(dict)，实际类型 {type(first)}，元素：{first}"

    required_fields = ["id", "model", "batteryLevel", "status"]
    missing_fields = [field for field in required_fields if field not in first]
    assert not missing_fields, f"缺少关键字段：{missing_fields}，实际元素：{first}"

    assert isinstance(first["id"], int), f"id 应为整数，实际值：{first['id']}"
    assert isinstance(first["model"], str), f"model 应为字符串，实际值：{first['model']}"

    # batteryLevel 允许 int/float，避免不同序列化策略导致误报
    assert isinstance(first["batteryLevel"], (int, float)), (
        f"batteryLevel 应为数值，实际值：{first['batteryLevel']}"
    )
    assert isinstance(first["status"], str), f"status 应为字符串，实际值：{first['status']}"


def run_all_tests() -> None:
    """按顺序执行所有用例并输出汇总。"""
    tests: List[Tuple[str, Callable[[], None]]] = [
        ("车辆列表接口返回 200", test_scooter_list_status_ok),
        ("车辆列表响应为 JSON 数组", test_scooter_list_is_json_array),
        ("车辆元素字段结构校验（非空时）", test_scooter_list_item_schema_when_not_empty),
    ]

    passed = 0
    failed = 0

    print("开始执行车辆列表接口自动化测试...")
    print(f"目标接口：{SCOOTER_LIST_URL}")

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
