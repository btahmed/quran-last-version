from playwright.sync_api import sync_playwright
import os
import time

def verify_registration():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Determine path to index.html
        cwd = os.getcwd()
        url = f"file://{cwd}/index.html"

        print(f"Navigating to {url}")
        page.goto(url)

        # Click on Login button
        print("Clicking Login button...")
        page.click("#auth-login-btn")

        # Wait for modal
        page.wait_for_selector("#auth-modal")
        time.sleep(1) # Animation

        # Verify Login form is visible
        print("Verifying Login form...")
        if page.is_visible("#auth-login-form"):
            print("Login form is visible.")
        else:
            print("Login form is NOT visible.")

        # Click Register link
        print("Clicking Register link...")
        page.click("text=إنشاء حساب جديد")

        time.sleep(1)

        # Verify Register form is visible
        print("Verifying Register form...")
        if page.is_visible("#auth-register-form"):
            print("Register form is visible.")
        else:
            print("Register form is NOT visible.")

        # Take screenshot
        page.screenshot(path="verification/registration_form.png")
        print("Screenshot saved to verification/registration_form.png")

        browser.close()

if __name__ == "__main__":
    verify_registration()
