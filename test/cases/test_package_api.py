"""
单接口自动化测试（新手版）：套餐接口

测试接口：
1) GET /api/packages
2) PUT /api/packages/update/{id}
运行前提：后端服务已启动，默认地址 http://localhost:8080
"""

from __future__ import annotations

import os
from decimal import Decimal
from typing import Callable, List, Tuple

import requests


BASE_URL = os.getenv("BASE_URL", "http://localhost:8080")
PACKAGES_URL = f"{BASE_URL}/api/packages"
PACKAGE_UPDATE_URL = f"{BASE_URL}/api/packages/update"


def get_all_packages() -> requests.Response:
    """调用查询套餐接口。"""
    return requests.get(PACKAGES_URL, timeout=10)


def update_package_price(package_id: int, price: str) -> requests.Response:
    """调用更新套餐价格接口。"""
    return requests.put(f"{PACKAGE_UPDATE_URL}/{package_id}", params={"price": price}, timeout=10)


def test_get_packages_success() -> None:
    """用例1:查询套餐列表成功。"""
    response = get_all_packages()

    assert response.status_code == 200, (
        f"期望状态码 200,实际 {response.status_code}，响应：{response.text}"
    )

    data = response.json()
    assert isinstance(data, list), f"期望响应为数组(list)，实际类型 {type(data)}，响应：{data}"


def test_update_package_price_success_and_rollback() -> None:
    """用例2:更新价格成功，并在结束后回滚。"""
    list_response = get_all_packages()
    assert list_response.status_code == 200, (
        f"前置失败：获取套餐失败,状态码 {list_response.status_code}，响应：{list_response.text}"
    )

    packages = list_response.json()
    assert isinstance(packages, list), f"前置失败：套餐响应结构异常，响应：{packages}"
    assert packages, "前置失败：套餐列表为空，无法执行更新测试"

    first = packages[0]
    package_id = first.get("id")
    original_price = first.get("price")

    assert isinstance(package_id, int), f"前置失败：套餐 id 无效，响应元素：{first}"
    assert original_price is not None, f"前置失败：套餐原始价格为空，响应元素：{first}"

    original_price_decimal = Decimal(str(original_price))
    new_price_decimal = original_price_decimal + Decimal("1.00")

    rollback_needed = False
    try:
        update_response = update_package_price(package_id, str(new_price_decimal))
        assert update_response.status_code == 200, (
            f"更新价格应成功，实际状态码 {update_response.status_code}，响应：{update_response.text}"
        )
        rollback_needed = True

        verify_response = get_all_packages()
        assert verify_response.status_code == 200, (
            f"更新后查询失败，状态码 {verify_response.status_code}，响应：{verify_response.text}"
        )

        updated_packages = verify_response.json()
        target = next((p for p in updated_packages if p.get("id") == package_id), None)
        assert target is not None, f"更新后未找到目标套餐，package_id={package_id}"

        updated_price = Decimal(str(target.get("price")))
        assert updated_price == new_price_decimal, (
            f"更新后价格不正确，期望 {new_price_decimal}，实际 {updated_price}"
        )
    finally:
        if rollback_needed:
            rollback_response = update_package_price(package_id, str(original_price_decimal))
            assert rollback_response.status_code == 200, (
                f"回滚价格失败，状态码 {rollback_response.status_code}，响应：{rollback_response.text}"
            )


def test_update_package_negative_price_should_fail() -> None:
    """用例3:负数价格应失败。"""
    list_response = get_all_packages()
    assert list_response.status_code == 200, (
        f"前置失败：获取套餐失败，状态码 {list_response.status_code}，响应：{list_response.text}"
    )

    packages = list_response.json()
    assert isinstance(packages, list), f"前置失败：套餐响应结构异常，响应：{packages}"
    assert packages, "前置失败：套餐列表为空，无法执行负数价格测试"

    package_id = packages[0].get("id")
    assert isinstance(package_id, int), f"前置失败：套餐 id 无效，响应元素：{packages[0]}"

    response = update_package_price(package_id, "-1.00")

    assert response.status_code != 200, (
        f"负数价格更新不应成功，实际状态码 {response.status_code}，响应：{response.text}"
    )
    assert "cannot be negative" in response.text.lower() or "error" in response.text.lower(), (
        f"错误信息不符合预期，响应：{response.text}"
    )


def run_all_tests() -> None:
    """按顺序执行所有用例并输出汇总。"""
    tests: List[Tuple[str, Callable[[], None]]] = [
        ("查询套餐列表成功", test_get_packages_success),
        ("更新套餐价格成功并回滚", test_update_package_price_success_and_rollback),
        ("负数价格更新失败", test_update_package_negative_price_should_fail),
    ]

    passed = 0
    failed = 0

    print("开始执行套餐接口自动化测试...")
    print(f"查询接口：{PACKAGES_URL}")
    print(f"更新接口：{PACKAGE_UPDATE_URL}/{{id}}")

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
