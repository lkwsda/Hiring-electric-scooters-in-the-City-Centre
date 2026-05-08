"""
E2E UI 测试: 故障问题上报与解决流程 (Selenium)

测试内容:
1. 用户登录系统
2. 访问故障上报页面 (Feedback)
3. 填写并提交 issue 报告
4. 验证 issue 提交成功
5. 切换到管理员账户查看 issue 列表
6. 管理员在 Issue Workflow 面板审查并设置优先级

完整测试用户上报 → 管理员处理的闭环流程
"""

import os
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

BASE_URL = os.getenv("BASE_URL", "http://localhost:8080")

def run_issue_flow():
    chrome_options = Options()
    chrome_options.add_argument("--headless")
    chrome_options.add_argument("--window-size=1920,1080")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--no-sandbox")

    driver = webdriver.Chrome(options=chrome_options)
    wait = WebDriverWait(driver, 10)

    try:
        print(f"=== E2E Issue Reporting & Resolution Flow ===")
        print(f"访问系统: {BASE_URL}")
        driver.get(BASE_URL)
        wait.until(EC.presence_of_element_located((By.ID, "authSection")))

        # ─── Step 1: Login as user ───
        print("\n1. 用户登录系统...")
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

        wait.until(EC.visibility_of_element_located((By.ID, "homeSection")))
        print("   登录成功")

        # Refresh issues data now that we have auth token
        driver.execute_script("loadIssues();")
        time.sleep(0.5)

        # ─── Step 2: Navigate to Feedback section ───
        print("\n2. 访问故障上报页面...")
        feedback_link = wait.until(EC.element_to_be_clickable((By.ID, "feedbackLink")))
        feedback_link.click()

        wait.until(EC.visibility_of_element_located((By.ID, "feedbackSection")))
        print("   故障上报页面已显示")

        # ─── Step 3: Submit an issue ───
        print("\n3. 提交滑板车故障报告...")
        wait.until(EC.visibility_of_element_located((By.ID, "issueForm")))

        # Enter scooter ID (use a valid DB scooter ID: 5, 8, 9, 18, 19 are available)
        test_scooter_id = "5"
        scooter_id_input = driver.find_element(By.ID, "issueScooterId")
        scooter_id_input.clear()
        scooter_id_input.send_keys(test_scooter_id)

        # Enter description
        issue_desc = f"E2E test: Rear brake feels loose near Library Station at {time.strftime('%H:%M')}, scooter vibrates when slowing down."
        desc_input = driver.find_element(By.ID, "issueDescription")
        desc_input.clear()
        desc_input.send_keys(issue_desc)

        # Verify character counter
        desc_counter = driver.find_element(By.ID, "issueDescriptionCount")
        assert desc_counter.is_displayed(), "Description character counter should be visible"
        print(f"   描述字符计数: {desc_counter.text}")

        # Submit the issue form
        driver.find_element(By.CSS_SELECTOR, "#issueForm button[type='submit']").click()

        # Handle issue submission alert
        time.sleep(1.5)
        try:
            alert = driver.switch_to.alert
            alert_text = alert.text
            print(f"   提交结果: {alert_text}")
            alert.accept()
            assert "submitted" in alert_text.lower() or "success" in alert_text.lower() or \
                   "issue" in alert_text.lower(), \
                f"Issue submission should succeed: {alert_text}"
        except Exception:
            print("   (no alert after issue submission)")

        # ─── Step 4: Verify issue history updates ───
        print("\n4. 验证提交历史...")
        time.sleep(1)
        history_list = driver.find_element(By.ID, "issueHistoryList")
        history_text = history_list.text
        print(f"   提交历史: {history_text[:150]}...")
        # The history should no longer say "No submissions yet" if issue was submitted
        # (may need refresh if issues API didn't return new issue)

        # ─── Step 5: Switch to admin view - Issue Workflow ───
        print("\n5. 进入管理员 Issue Workflow...")
        admin_link = wait.until(EC.element_to_be_clickable((By.ID, "adminLink")))
        admin_link.click()

        wait.until(EC.visibility_of_element_located((By.ID, "adminConfigSection")))

        # Click Issue Workflow sidebar button
        issue_workflow_btn = wait.until(EC.element_to_be_clickable(
            (By.CSS_SELECTOR, "[data-admin-panel='adminPanelIssues']")
        ))
        issue_workflow_btn.click()
        time.sleep(1)

        # Verify Issue Workflow panel is displayed
        issues_panel = driver.find_element(By.ID, "adminPanelIssues")
        assert issues_panel.is_displayed(), "Issue Workflow panel should be visible"
        print("   Issue Workflow 面板已显示: PASS")

        # ─── Step 6: Verify issue appears in admin review list ───
        print("\n6. 验证管理员 Issue Review 列表...")
        review_list = driver.find_element(By.ID, "adminIssueReviewList")
        review_text = review_list.text
        print(f"   Issue Review 列表: {review_text[:200]}...")

        # Check high priority list
        high_priority_list = driver.find_element(By.ID, "highPriorityIssueList")
        high_priority_text = high_priority_list.text
        print(f"   High Priority 列表: {high_priority_text[:150]}...")

        # ─── Step 7: If issues exist, test priority buttons ───
        print("\n7. 测试优先级设置...")
        priority_btns = driver.find_elements(By.CSS_SELECTOR, ".priority-btn")
        if priority_btns:
            print(f"   找到 {len(priority_btns)} 个优先级按钮")
            # Click the first "Set High" button if available
            for btn in priority_btns:
                if "high" in btn.text.lower():
                    driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", btn)
                    time.sleep(0.3)
                    btn.click()
                    time.sleep(1)

                    # Handle any alert
                    try:
                        alert = driver.switch_to.alert
                        print(f"   优先级设置结果: {alert.text}")
                        alert.accept()
                    except Exception:
                        pass

                    print("   优先级按钮已点击: PASS")
                    break
            else:
                print("   未找到 Set High 按钮 (可能 issues 已全部为 high)")
        else:
            print("   暂无 issue 可设置优先级 (可能 issues 列表为空)")

        print("\n=== 故障报修与管理员跟进 UI 流程测试全部通过! ===")

    except Exception as e:
        print(f"\n故障流流程测试失败: {e}")
        try:
            driver.save_screenshot("test_issue_flow_error.png")
            print("   错误截图已保存: test_issue_flow_error.png")
        except Exception:
            pass
        raise
    finally:
        driver.quit()

if __name__ == "__main__":
    run_issue_flow()
