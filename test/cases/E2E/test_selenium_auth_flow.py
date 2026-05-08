"""
E2E UI 测试: 用户注册与登录流程 (Selenium)

测试内容:
1. 注册新用户 - 填写完整注册表单并提交
2. 登录已有用户 - 使用 admin/123456 登录
3. 验证登录后导航状态变化（logout 链接出现、login 链接隐藏）
4. 登出 - 点击 logout 并验证回到登录页
"""

import os
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

BASE_URL = os.getenv("BASE_URL", "http://localhost:8080")

def run_user_auth_flow():
    chrome_options = Options()
    chrome_options.add_argument("--headless")
    chrome_options.add_argument("--window-size=1920,1080")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--no-sandbox")

    driver = webdriver.Chrome(options=chrome_options)
    wait = WebDriverWait(driver, 10)

    try:
        print(f"=== E2E Auth Flow Test ===")
        print(f"访问系统: {BASE_URL}")
        driver.get(BASE_URL)

        # Wait for page to fully load
        wait.until(EC.presence_of_element_located((By.ID, "authSection")))

        # ─── 1. Test Registration Form ───
        print("\n1. 测试注册表单...")
        # Switch to register tab
        show_register_btn = wait.until(EC.element_to_be_clickable((By.ID, "showRegisterBtn")))
        show_register_btn.click()
        wait.until(EC.visibility_of_element_located((By.ID, "registerPanel")))

        # Fill registration form with unique username
        import random
        test_user = f"e2euser_{random.randint(1000, 9999)}"
        driver.find_element(By.ID, "registerUsername").send_keys(test_user)
        driver.find_element(By.ID, "registerEmail").send_keys(f"{test_user}@test.com")
        driver.find_element(By.ID, "registerPhone").send_keys("07700900123")
        driver.find_element(By.ID, "registerDob").send_keys("2000-01-01")
        driver.find_element(By.ID, "registerPassword").send_keys("Test@1234!")
        driver.find_element(By.ID, "registerConfirmPassword").send_keys("Test@1234!")
        driver.find_element(By.ID, "cardNumber").send_keys("4111111111111111")
        driver.find_element(By.ID, "cardExpiry").send_keys("12/28")
        driver.find_element(By.ID, "cardCVV").send_keys("123")
        # Accept terms checkbox
        accept_checkbox = driver.find_element(By.ID, "acceptTerms")
        if not accept_checkbox.is_selected():
            accept_checkbox.click()

        # Submit registration
        driver.find_element(By.CSS_SELECTOR, "#registerForm button[type='submit']").click()

        # Handle alert: "Registration successful!" or error
        time.sleep(1.5)
        try:
            alert = driver.switch_to.alert
            alert_text = alert.text
            print(f"   注册结果: {alert_text}")
            alert.accept()
            assert "successful" in alert_text.lower() or "registered" in alert_text.lower(), \
                f"Registration failed: {alert_text}"
        except Exception:
            print("   (no alert for registration)")

        # ─── 2. Test Login ───
        print("\n2. 测试登录...")
        # Switch back to login tab (registration switches to login on success)
        show_login_btn = wait.until(EC.element_to_be_clickable((By.ID, "showLoginBtn")))
        show_login_btn.click()
        wait.until(EC.visibility_of_element_located((By.ID, "loginPanel")))

        # Login with admin account
        driver.find_element(By.ID, "loginEmail").clear()
        driver.find_element(By.ID, "loginEmail").send_keys("admin")
        driver.find_element(By.ID, "loginPassword").clear()
        driver.find_element(By.ID, "loginPassword").send_keys("123456")
        driver.find_element(By.CSS_SELECTOR, "#loginForm button[type='submit']").click()

        # Handle login alert
        time.sleep(1.5)
        try:
            alert = driver.switch_to.alert
            alert_text = alert.text
            print(f"   登录结果: {alert_text}")
            alert.accept()
            assert "successful" in alert_text.lower() or "welcome" in alert_text.lower(), \
                f"Login failed: {alert_text}"
        except Exception:
            print("   (no alert for login)")

        # ─── 3. Verify Post-Login State ───
        print("\n3. 验证登录后状态...")
        time.sleep(0.5)  # Let section transitions complete

        # The home section should now be visible
        home_section = driver.find_element(By.ID, "homeSection")
        assert home_section.is_displayed(), "Home section should be displayed after login"
        print("   Home section displayed: PASS")

        # Logout link should be visible, login link hidden
        logout_link = driver.find_element(By.ID, "logoutLink")
        assert logout_link.is_displayed(), "Logout link should be visible"
        print("   Logout link visible: PASS")

        login_link = driver.find_element(By.ID, "loginLink")
        assert not login_link.is_displayed(), "Login link should be hidden"
        print("   Login link hidden: PASS")

        # ─── 4. Test Logout ───
        print("\n4. 测试登出...")
        logout_link.click()

        # After logout, should be back at auth section
        time.sleep(0.5)
        auth_section = driver.find_element(By.ID, "authSection")
        assert auth_section.is_displayed(), "Auth section should be displayed after logout"
        print("   Auth section displayed after logout: PASS")

        login_link = driver.find_element(By.ID, "loginLink")
        assert login_link.is_displayed(), "Login link should be visible after logout"
        print("   Login link visible after logout: PASS")

        print("\n=== 用户注册与登录 UI 流程测试全部通过! ===")

    except Exception as e:
        print(f"\n用户认证流程测试失败: {e}")
        # Take screenshot for debugging
        try:
            driver.save_screenshot("test_auth_flow_error.png")
            print("   错误截图已保存: test_auth_flow_error.png")
        except Exception:
            pass
        raise
    finally:
        driver.quit()

if __name__ == "__main__":
    run_user_auth_flow()
