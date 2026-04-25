"""
一键执行所有 API 自动化测试脚本
"""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path


def find_project_root(start_dir: Path) -> Path:
    """向上查找包含 pom.xml 和测试目录的项目根目录。"""
    for current in (start_dir, *start_dir.parents):
        if (current / "pom.xml").exists() and (current / "test" / "cases" / "API").exists():
            return current
    raise FileNotFoundError("未找到项目根目录（需包含 pom.xml 和 test/cases/API）")


def main() -> int:
    script_dir = Path(__file__).resolve().parent
    project_root = find_project_root(script_dir)
    api_cases_dir = project_root / "test" / "cases" / "API"

    # 按功能分组后的执行顺序，先基础能力，再业务流程。
    test_scripts = [
        "test_user_register.py",
        "test_user_login.py",
        "test_user_list.py",
        "test_scooter_list.py",
        "test_scooter_management.py",
        "test_package_api.py",
        "test_booking_place.py",
        "test_booking_extra_api.py",
        "test_issue_api.py",
    ]

    passed = 0
    failed = 0

    print("开始一键回归 API 测试...")
    print(f"项目根目录: {project_root}")
    print(f"Python 解释器: {sys.executable}")

    for script in test_scripts:
        script_path = api_cases_dir / script
        display_path = script_path.relative_to(project_root)

        if not script_path.exists():
            failed += 1
            print(f"\n===== RUN {display_path} =====")
            print(f"FAIL - 文件不存在: {script_path}")
            continue

        print(f"\n===== RUN {display_path} =====")
        result = subprocess.run(
            [sys.executable, str(script_path)],
            cwd=str(project_root),
            text=True,
            check=False,
        )

        if result.returncode == 0:
            passed += 1
        else:
            failed += 1

    print("\n==============================")
    print("API 回归执行完成")
    print(f"脚本通过: {passed}")
    print(f"脚本失败: {failed}")
    print("==============================")

    return 0 if failed == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
