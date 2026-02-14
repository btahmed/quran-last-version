from playwright.sync_api import sync_playwright, expect

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Create context with service workers disabled
        context = browser.new_context(service_workers="block")
        page = context.new_page()

        # Debug console
        page.on("console", lambda msg: print(f"PAGE LOG: {msg.text}"))

        # Mock API responses
        def handle_me(route):
            print(f"Intercepted: {route.request.url}")
            route.fulfill(status=200, json={
                "id": 1,
                "username": "teacher",
                "first_name": "Ustadh",
                "role": "teacher",
                "is_staff": True
            })

        # Intercept
        page.route("**/api/me/", handle_me)
        page.route("**/api/tasks/", lambda r: r.fulfill(json=[]))
        page.route("**/api/my-students/", lambda r: r.fulfill(json=[]))
        page.route("**/api/pending-submissions/", lambda r: r.fulfill(json=[]))

        page.goto("http://localhost:8080")

        # Inject token
        print("Injecting token...")
        page.evaluate("localStorage.setItem('quranreview_api_token', 'mock_token')")
        page.evaluate("localStorage.setItem('quranreview_user', JSON.stringify({role: 'teacher', username: 'teacher'}))")

        print("Reloading...")
        page.reload()

        # Wait a bit
        page.wait_for_timeout(2000)

        # Check visibility
        teacher_link = page.locator(".nav-teacher-only")
        if teacher_link.is_visible():
            print("Teacher link IS visible")
            teacher_link.click()

            # Wait for navigation
            expect(page.locator("#teacher-page")).to_have_class("page active")
            print("✅ Navigated to Teacher Dashboard")

            # Logout
            page.locator(".btn-auth-logout").click()

            # Verify Redirect
            expect(page.locator("#home-page")).to_have_class("page active")
            print("✅ Redirected to Home Page after logout")

            page.screenshot(path="verification/logout_verification.png")
        else:
            print("Teacher link is HIDDEN")
            page.screenshot(path="verification/debug_hidden.png")

        browser.close()

if __name__ == "__main__":
    run()
