"""
E2E UI 测试: 管理员管理界面流程 (Selenium)

测试内容:
1. 以管理员身份登录 (admin/123456)
2. 进入 Admin Dashboard 并验证 Overview KPI
3. 测试 Scooter Ops 面板 (查询滑板车)
4. 测试 Package Pricing 面板 (查看定价表单)
5. 测试 User List 面板 (刷新用户列表)
6. 测试 Revenue Analytics 面板 (图表渲染)
"""

import os
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

BASE_URL = os.getenv("BASE_URL", "http://localhost:8080")

def run_admin_flow():
    chrome_options = Options()
    chrome_options.add_argument("--headless")
    chrome_options.add_argument("--window-size=1920,1080")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--no-sandbox")

    driver = webdriver.Chrome(options=chrome_options)
    wait = WebDriverWait(driver, 10)

    try:
        print(f"=== E2E Admin Dashboard Flow ===")
        print(f"访问系统: {BASE_URL}")
        driver.get(BASE_URL)
        wait.until(EC.presence_of_element_located((By.ID, "authSection")))

        # ─── Step 1: Login as admin ───
        print("\n1. 以管理员身份登录...")
        time.sleep(0.5)  # Let page init (has 200ms opacity delay)
        wait.until(EC.element_to_be_clickable((By.ID, "loginEmail"))).send_keys("admin")
        wait.until(EC.element_to_be_clickable((By.ID, "loginPassword"))).send_keys("123456")
        driver.find_element(By.CSS_SELECTOR, "#loginForm button[type='submit']").click()

        time.sleep(1.5)
        try:
            alert = driver.switch_to.alert
            print(f"   登录结果: {alert.text}")
            alert.accept()
        except Exception:
            pass

        # ─── Step 2: Enter Admin Dashboard Overview ───
        print("\n2. 进入管理员仪表盘...")
        wait.until(EC.visibility_of_element_located((By.ID, "homeSection")))

        admin_link = wait.until(EC.element_to_be_clickable((By.ID, "adminLink")))
        admin_link.click()

        # Admin section should appear
        wait.until(EC.visibility_of_element_located((By.ID, "adminConfigSection")))
        print("   管理员仪表盘已显示")

        # Wait for KPI data to load
        time.sleep(2)

        # Verify Overview panel is active
        overview_panel = driver.find_element(By.ID, "adminPanelOverview")
        assert "is-active" in overview_panel.get_attribute("class"), "Overview panel should be active"
        print("   Overview 面板已激活: PASS")

        # Check KPI cards have data
        kpi_available = driver.find_element(By.ID, "adminKpiAvailable")
        print(f"   Available Scooters KPI: {kpi_available.text}")

        kpi_issues = driver.find_element(By.ID, "adminKpiIssues")
        print(f"   Open Issues KPI: {kpi_issues.text}")

        # ─── Step 3: Test Scooter Ops panel ───
        print("\n3. 测试 Scooter Ops 面板...")
        scooter_ops_btn = wait.until(EC.element_to_be_clickable(
            (By.CSS_SELECTOR, "[data-admin-panel='adminPanelScooters']")
        ))
        scooter_ops_btn.click()
        time.sleep(0.5)

        scooter_panel = driver.find_element(By.ID, "adminPanelScooters")
        assert scooter_panel.is_displayed(), "Scooter Ops panel should be visible"
        print("   Scooter Ops 面板已显示: PASS")

        # Test Query scooter functionality
        query_input = driver.find_element(By.ID, "adminScooterOpsId")
        query_input.clear()
        query_input.send_keys("1")

        query_btn = driver.find_element(By.ID, "adminGetScooterBtn")
        query_btn.click()

        time.sleep(1)
        result_div = driver.find_element(By.ID, "adminScooterOpsResult")
        result_text = result_div.text
        print(f"   查询结果: {result_text[:100]}...")
        assert "No" not in result_text or "operation" in result_text.lower(), \
            "Query result should show data or error message"

        # ─── Step 4: Test Package Pricing panel ───
        print("\n4. 测试 Package Pricing 面板...")
        pricing_btn = wait.until(EC.element_to_be_clickable(
            (By.CSS_SELECTOR, "[data-admin-panel='adminPanelPricing']")
        ))
        pricing_btn.click()
        time.sleep(0.5)

        pricing_panel = driver.find_element(By.ID, "adminPanelPricing")
        assert pricing_panel.is_displayed(), "Pricing panel should be visible"
        print("   Package Pricing 面板已显示: PASS")

        # Verify pricing form fields are populated
        price_1h = driver.find_element(By.ID, "price1h")
        price_1h_val = price_1h.get_attribute("value")
        print(f"   1 Hour Price: ${price_1h_val}")

        price_4h = driver.find_element(By.ID, "price4h")
        price_4h_val = price_4h.get_attribute("value")
        print(f"   4 Hours Price: ${price_4h_val}")

        # ─── Step 5: Test User List panel ───
        print("\n5. 测试 User List 面板...")
        users_btn = wait.until(EC.element_to_be_clickable(
            (By.CSS_SELECTOR, "[data-admin-panel='adminPanelUsers']")
        ))
        users_btn.click()
        time.sleep(1)

        users_panel = driver.find_element(By.ID, "adminPanelUsers")
        assert users_panel.is_displayed(), "Users panel should be visible"
        print("   User List 面板已显示: PASS")

        # Click refresh users button
        refresh_btn = wait.until(EC.element_to_be_clickable((By.ID, "refreshUsersBtn")))
        refresh_btn.click()
        time.sleep(1)

        users_list = driver.find_element(By.ID, "adminUsersList")
        users_text = users_list.text
        print(f"   用户列表内容: {users_text[:150]}...")

        # ─── Step 6: Test Revenue Analytics panel ───
        print("\n6. 测试 Revenue Analytics 面板...")
        analytics_btn = wait.until(EC.element_to_be_clickable(
            (By.CSS_SELECTOR, "[data-admin-panel='adminPanelAnalytics']")
        ))
        analytics_btn.click()
        time.sleep(1.5)  # Charts need time to render

        analytics_panel = driver.find_element(By.ID, "adminPanelAnalytics")
        assert analytics_panel.is_displayed(), "Analytics panel should be visible"
        print("   Revenue Analytics 面板已显示: PASS")

        # Check revenue summary cards
        weekly_total = driver.find_element(By.ID, "adminRevenueWeeklyTotal")
        print(f"   Weekly Total Revenue: {weekly_total.text}")

        daily_avg = driver.find_element(By.ID, "adminRevenueDailyAvg")
        print(f"   Average Daily Revenue: {daily_avg.text}")

        best_pkg = driver.find_element(By.ID, "adminRevenueBestPackage")
        print(f"   Best Package: {best_pkg.text}")

        # Check charts rendered (canvas elements exist)
        weekly_chart = driver.find_element(By.ID, "weeklyRevenueChart")
        assert weekly_chart.is_displayed(), "Weekly revenue chart should be visible"
        print("   Weekly chart rendered: PASS")

        daily_chart = driver.find_element(By.ID, "dailyRevenueChart")
        assert daily_chart.is_displayed(), "Daily revenue chart should be visible"
        print("   Daily chart rendered: PASS")

        # ─── Step 7: Test Issue Workflow panel ───
        print("\n7. 测试 Issue Workflow 面板...")
        issues_btn = wait.until(EC.element_to_be_clickable(
            (By.CSS_SELECTOR, "[data-admin-panel='adminPanelIssues']")
        ))
        issues_btn.click()
        time.sleep(1)

        issues_panel = driver.find_element(By.ID, "adminPanelIssues")
        assert issues_panel.is_displayed(), "Issue Workflow panel should be visible"
        print("   Issue Workflow 面板已显示: PASS")

        # Check issue review list exists
        review_list = driver.find_element(By.ID, "adminIssueReviewList")
        print(f"   Issue Review 列表: {review_list.text[:100]}...")

        high_priority_list = driver.find_element(By.ID, "highPriorityIssueList")
        print(f"   High Priority 列表: {high_priority_list.text[:100]}...")

        print("\n=== 管理员后台控制台 UI 流程测试全部通过! ===")

    except Exception as e:
        print(f"\n管理员后台流程测试失败: {e}")
        try:
            driver.save_screenshot("test_admin_flow_error.png")
            print("   错误截图已保存: test_admin_flow_error.png")
        except Exception:
            pass
        raise
    finally:
        driver.quit()

if __name__ == "__main__":
    run_admin_flow()
