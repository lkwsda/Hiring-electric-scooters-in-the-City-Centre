"""
Run all API automated test scripts with one command.
"""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path


def find_project_root(start_dir: Path) -> Path:
    """Search upward for the project root containing pom.xml and the test directory."""
    for current in (start_dir, *start_dir.parents):
        if (current / "pom.xml").exists() and (current / "test" / "cases" / "API").exists():
            return current
    raise FileNotFoundError("Project root not found (must contain pom.xml and test/cases/API)")


def main() -> int:
    script_dir = Path(__file__).resolve().parent
    project_root = find_project_root(script_dir)
    api_cases_dir = project_root / "test" / "cases" / "API"

    # Execution order grouped by feature: base capabilities first, then business flows.
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

    print("Starting one-click API regression tests...")
    print(f"Project root: {project_root}")
    print(f"Python interpreter: {sys.executable}")

    for script in test_scripts:
        script_path = api_cases_dir / script
        display_path = script_path.relative_to(project_root)

        if not script_path.exists():
            failed += 1
            print(f"\n===== RUN {display_path} =====")
            print(f"FAIL - file not found: {script_path}")
            results.append((script, "FAIL", "File not found", 0, 0))
            continue

        print(f"\n===== RUN {display_path} =====")
        result = subprocess.run(
            [sys.executable, str(script_path)],
            cwd=str(project_root),
            text=True,
            encoding="gbk", errors="replace",
            capture_output=True,
            check=False,
        )

        print(result.stdout)
        if result.stderr:
            print(result.stderr, file=sys.stderr)

        # Parse the script's own output, for example:
        # Passed: 3
        # Failed: 0
        script_passed_cases = 0
        script_failed_cases = 0
        for line in result.stdout.splitlines():
            line = line.strip()
            if line.startswith("Passed:"):
                try:
                    script_passed_cases = int(line.split(":")[-1].strip())
                except ValueError:
                    pass
            elif line.startswith("Failed:"):
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

    # Generate the Markdown report
    reports_dir = project_root / "test" / "reports_md"
    reports_dir.mkdir(parents=True, exist_ok=True)
    report_time = datetime.datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    report_path = reports_dir / f"API_Test_Report_{report_time}.md"

    total_passed_cases = sum(r[3] for r in results)
    total_failed_cases = sum(r[4] for r in results)

    with open(report_path, "w", encoding="utf-8") as f:
        f.write("# API Regression Test Report\n\n")
        f.write(f"**Generated at**: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
        f.write(f"**Module test scripts**: executed {passed + failed}, passed {passed}, failed {failed}.\n\n")
        f.write(f"**Included case stats**: passed {total_passed_cases}, failed {total_failed_cases}.\n\n")
        f.write("## Detailed Results\n\n")
        f.write("| Script Name | Module Result | Note | Passed Cases | Failed Cases |\n")
        f.write("| --- | --- | --- | --- | --- |\n")
        for r_script, r_status, r_note, r_passed, r_failed in results:
            status_icon = "✅ PASS" if r_status == "PASS" else "❌ FAIL"
            f.write(f"| {r_script} | {status_icon} | {r_note} | {r_passed} | {r_failed} |\n")

    print("\n==============================")
    print("API regression execution completed")
    print(f"Scripts passed: {passed}")
    print(f"Scripts failed: {failed}")
    print(f"Total passed cases: {total_passed_cases}")
    print(f"Total failed cases: {total_failed_cases}")
    print(f"Report generated: {report_path.relative_to(project_root)}")
    print("==============================")

    return 0 if failed == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
