from playwright.sync_api import sync_playwright
import time
import os
import shutil

def run_cuj(page):
    page.goto("http://localhost:3000")
    page.wait_for_timeout(1000)

    # Click Register link to show Register form
    page.evaluate("window.QuranReview.showRegisterForm()")
    page.wait_for_timeout(500)

    # Fill registration form
    page.locator("#reg-username").fill("testuser")
    page.wait_for_timeout(500)
    page.locator("#reg-password").fill("password123")
    page.wait_for_timeout(500)

    # Click Submit (it will mock loading for 800ms due to IS_DEMO_MODE)
    # We evaluate to set IS_DEMO_MODE before clicking to guarantee the delay
    page.evaluate("window.__SUPABASE_URL__ = undefined;") # Fallback to demo mode

    page.locator("#reg-submit-btn").click()
    page.wait_for_timeout(300) # Wait mid-loading

    page.screenshot(path="/app/verification.png")
    page.wait_for_timeout(1000)

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(record_video_dir="/app/videos")
        page = context.new_page()
        try:
            run_cuj(page)
        finally:
            context.close()
            browser.close()
