"""
车辆管理接口
测试接口：
1) POST /api/scooters/add
2) GET /api/scooters/{id}
3) DELETE /api/scooters/{id}
"""

from __future__ import annotations

import os
import time
from typing import Callable, List, Tuple

import requests


BASE_URL = os.getenv("BASE_URL", "http://localhost:8080")
ADD_SCOOTER_URL = f"{BASE_URL}/api/scooters/add"
SCOOTER_ITEM_URL = f"{BASE_URL}/api/scooters"


def add_scooter() -> int:
    """新增一辆测试车辆，返回其 id。"""
    suffix = str(int(time.time() * 1000))
    model_name = f"auto_scooter_{suffix}"

    payload = {
        "model": model_name,
        "batteryLevel": 100,
        "latitude": 53.8012,
        "longitude": -1.5485,
        "status": "available",
    }

    add_response = requests.post(ADD_SCOOTER_URL, json=payload, timeout=10)
    assert add_response.status_code == 200, (
        f"新增车辆失败，状态码 {add_response.status_code}，响应：{add_response.text}"
    )

    # 用列表接口反查刚新增车辆的 id
    list_response = requests.get(SCOOTER_ITEM_URL, timeout=10)
    assert list_response.status_code == 200, (
        f"查询车辆列表失败，状态码 {list_response.status_code}，响应：{list_response.text}"
    )

    scooters = list_response.json()
    matches = [s for s in scooters if s.get("model") == model_name and isinstance(s.get("id"), int)]
    assert matches, f"新增后未在列表中找到车辆，model={model_name}"

    return matches[-1]["id"]


def delete_scooter_if_exists(scooter_id: int | None) -> None:
    """收尾删除车辆，避免测试数据堆积。"""
    if not isinstance(scooter_id, int):
        return
    requests.delete(f"{SCOOTER_ITEM_URL}/{scooter_id}", timeout=10)


def test_add_scooter_success() -> None:
    """用例1:新增车辆成功。"""
    scooter_id: int | None = None
    try:
        scooter_id = add_scooter()
        assert isinstance(scooter_id, int), f"新增后返回的 scooter_id 非法：{scooter_id}"
    finally:
        delete_scooter_if_exists(scooter_id)


def test_get_scooter_by_id_success() -> None:
    """用例2:按 id 查询车辆成功。"""
    scooter_id: int | None = None
    try:
        scooter_id = add_scooter()
        response = requests.get(f"{SCOOTER_ITEM_URL}/{scooter_id}", timeout=10)

        assert response.status_code == 200, (
            f"按 id 查询车辆应成功，实际状态码 {response.status_code}，响应：{response.text}"
        )

        data = response.json()
        assert data.get("id") == scooter_id, f"查询返回 id 不匹配，响应：{data}"
        assert isinstance(data.get("model"), str), f"model 字段类型异常，响应：{data}"
        assert data.get("status") in {"available", "rented", "maintenance"}, (
            f"status 字段值异常，响应：{data}"
        )
    finally:
        delete_scooter_if_exists(scooter_id)


def test_delete_scooter_success() -> None:
    """用例3:删除车辆成功，删除后再查应失败。"""
    scooter_id = add_scooter()

    delete_response = requests.delete(f"{SCOOTER_ITEM_URL}/{scooter_id}", timeout=10)
    assert delete_response.status_code == 200, (
        f"删除车辆应成功，实际状态码 {delete_response.status_code}，响应：{delete_response.text}"
    )

    get_response = requests.get(f"{SCOOTER_ITEM_URL}/{scooter_id}", timeout=10)
    assert get_response.status_code != 200, (
        f"删除后查询不应成功，实际状态码 {get_response.status_code}，响应：{get_response.text}"
    )


def run_all_tests() -> None:
    """按顺序执行所有用例并输出汇总。"""
    tests: List[Tuple[str, Callable[[], None]]] = [
        ("新增车辆成功", test_add_scooter_success),
        ("按 id 查询车辆成功", test_get_scooter_by_id_success),
        ("删除车辆成功", test_delete_scooter_success),
    ]

    passed = 0
    failed = 0

    print("开始执行车辆管理接口自动化测试...")
    print(f"新增接口：{ADD_SCOOTER_URL}")
    print(f"单车接口：{SCOOTER_ITEM_URL}/{{id}}")

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
