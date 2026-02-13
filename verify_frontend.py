from playwright.sync_api import sync_playwright
import os

def verify_frontend():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()

        # Determine path to index.html
        cwd = os.getcwd()
        url = f"file://{cwd}/index.html"

        print(f"Navigating to {url}")
        page.goto(url)

        # 1. Verify Competition Page
        print("Clicking Competition link...")
        try:
            page.click("a[data-page='competition']")
            page.wait_for_selector("#competition-dashboard", timeout=5000)
            page.screenshot(path="competition_dashboard.png")
            print("Screenshot saved: competition_dashboard.png")
        except Exception as e:
            print(f"Error verifying competition page: {e}")
            page.screenshot(path="error_competition.png")

        # 2. Verify Hifz Page
        print("Clicking Hifz link...")
        try:
            page.click("a[data-page='hifz']")
            page.wait_for_selector("#hifz-selection", timeout=5000)
            page.screenshot(path="hifz_selection.png")
            print("Screenshot saved: hifz_selection.png")
        except Exception as e:
            print(f"Error verifying hifz page: {e}")
            page.screenshot(path="error_hifz.png")

        browser.close()

if __name__ == "__main__":
    verify_frontend()
