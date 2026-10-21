from playwright.sync_api import sync_playwright

def run_cuj(page):
    page.goto("http://localhost:3456/")
    page.wait_for_timeout(1000)

    # Trigger login modal directly to avoid locator issues
    page.evaluate('window.QuranReview.showLoginForm()')
    page.wait_for_timeout(1000)

    # The login form should now be visible and we should be able to submit it via the submit button
    page.locator("#login-username").fill("testuser")
    page.locator("#login-password").fill("password123")

    # We should have a button with type="submit" and be able to click it
    # We will trigger the submit via the form itself to test "Enter" behaviour,
    # or by clicking the submit button. Let's just click the button first.
    page.locator("#login-submit-btn").click()

    # Wait for the fake demo authentication error or whatever happens
    page.wait_for_timeout(2000)

    # Take screenshot at the key moment
    page.screenshot(path="/home/jules/verification/screenshots/verification.png")
    page.wait_for_timeout(1000)

if __name__ == "__main__":
    import os
    os.makedirs("/home/jules/verification/videos", exist_ok=True)
    os.makedirs("/home/jules/verification/screenshots", exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            record_video_dir="/home/jules/verification/videos"
        )
        page = context.new_page()
        try:
            run_cuj(page)
        finally:
            context.close()
            browser.close()
