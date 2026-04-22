# API 自动化测试报告

## 1. 报告信息

- 项目: Hiring-electric-scooters-in-the-City-Centre
- 报告日期: 2026-04-22
- 执行方式: 一键回归入口脚本
- 执行命令: `python run_all_api_tests.py`
- Python 解释器: C:/Users/杨俊涛/AppData/Local/Programs/Python/Python314/python.exe

## 2. 总体结果

- 脚本总数: 9
- 脚本通过: 9
- 脚本失败: 0
- 用例总数: 31
- 用例通过: 31
- 用例失败: 0
- 总体结论: PASS

## 3. 脚本执行明细

| 脚本 | 通过 | 失败 | 结果 |
|---|---:|---:|---|
| test/cases/test_user_register.py | 3 | 0 | PASS |
| test/cases/test_user_login.py | 3 | 0 | PASS |
| test/cases/test_user_list.py | 3 | 0 | PASS |
| test/cases/test_scooter_list.py | 3 | 0 | PASS |
| test/cases/test_scooter_management.py | 3 | 0 | PASS |
| test/cases/test_package_api.py | 3 | 0 | PASS |
| test/cases/test_booking_place.py | 3 | 0 | PASS |
| test/cases/test_booking_extra_api.py | 7 | 0 | PASS |
| test/cases/test_issue_api.py | 3 | 0 | PASS |

## 4. 覆盖范围说明

本次回归覆盖 User、Scooter、Package、Booking、Issue 五个控制器的全部接口。

- 控制器接口总数: 21
- 已自动化覆盖: 21
- 未覆盖: 0

覆盖对照见: test/reports/api_coverage.md

## 5. 风险与建议

- 当前结果代表“执行时环境”下的通过情况，依赖本地服务和数据库状态。
- 建议将 `run_all_api_tests.py` 接入 CI，在合并请求时自动触发回归。
- 建议后续补充更严格负向场景（非法参数、边界值、重复操作幂等性）。
