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
        "test_scooter_locations.py",
        "test_scooter_management.py",
        "test_package_api.py",
        "test_booking_place.py",
        "test_booking_extra_api.py",
        "test_issue_api.py",
    ]

    import datetime

    passed = 0
    failed = 0
    results = []

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
            results.append((script, "FAIL", "文件不存在", 0, 0))
            continue

        print(f"\n===== RUN {display_path} =====")
        result = subprocess.run(
            [sys.executable, str(script_path)],
            cwd=str(project_root),
            text=True,
            encoding="utf-8",
            capture_output=True,
            check=False,
        )

        print(result.stdout)
        if result.stderr:
            print(result.stderr, file=sys.stderr)

        # 解析脚本自己的输出，例如：
        # 通过: 3
        # 失败: 0
        script_passed_cases = 0
        script_failed_cases = 0
        for line in result.stdout.splitlines():
            line = line.strip()
            if line.startswith("通过:"):
                try:
                    script_passed_cases = int(line.split(":")[-1].strip())
                except ValueError:
                    pass
            elif line.startswith("失败:"):
                try:
                    script_failed_cases = int(line.split(":")[-1].strip())
                except ValueError:
                    pass

        if result.returncode == 0:
            passed += 1
            results.append((script, "PASS", "", script_passed_cases, script_failed_cases))
        else:
            failed += 1
            results.append((script, "FAIL", f"Exit {result.returncode}", script_passed_cases, script_failed_cases))

    # 生成 Markdown 报告
    reports_dir = project_root / "test" / "reports_md"
    reports_dir.mkdir(parents=True, exist_ok=True)
    report_time = datetime.datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    report_path = reports_dir / f"API_Test_Report_{report_time}.md"

    total_passed_cases = sum(r[3] for r in results)
    total_failed_cases = sum(r[4] for r in results)

    with open(report_path, "w", encoding="utf-8") as f:
        f.write("# API 一键测试回归报告\n\n")
        f.write(f"**生成时间**: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
        f.write(f"**模块测试脚本**: 共执行 {passed + failed} 个，通过 {passed} 个，失败 {failed} 个。\n\n")
        f.write(f"**包含用例统计**: 通过 {total_passed_cases} 个，失败 {total_failed_cases} 个。\n\n")
        f.write("## 详细结果\n\n")
        f.write("| 脚本名称 | 模块结果 | 备注 | 通过用例 | 失败用例 |\n")
        f.write("| --- | --- | --- | --- | --- |\n")
        for r_script, r_status, r_note, r_passed, r_failed in results:
            status_icon = "✅ PASS" if r_status == "PASS" else "❌ FAIL"
            f.write(f"| {r_script} | {status_icon} | {r_note} | {r_passed} | {r_failed} |\n")

    print("\n==============================")
    print("API 回归执行完成")
    print(f"脚本通过: {passed}")
    print(f"脚本失败: {failed}")
    print(f"总计用例通过: {total_passed_cases}")
    print(f"总计用例失败: {total_failed_cases}")
    print(f"已生成报告: {report_path.relative_to(project_root)}")
    print("==============================")

    return 0 if failed == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
