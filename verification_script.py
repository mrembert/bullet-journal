from playwright.sync_api import Page, expect, sync_playwright
import time

def verify_undo(page: Page):
    print("Navigating to app...")
    page.goto("http://localhost:5173")

    # Wait for login
    try:
        print("Waiting for 'Last Task' or 'Today'...")
        # Check for either header
        expect(page.locator("h1:has-text('Last Task'), h1:has-text('Today')").first).to_be_visible(timeout=10000)
    except:
        print("Initial load failed or auth required. Screenshotting.")
        page.screenshot(path="verification_load_fail.png")
        raise

    print("Adding task 'Task Undo Test'...")
    # Find input
    input_loc = page.locator("#main-bullet-editor-input")
    input_loc.fill("Task Undo Test")
    input_loc.press("Enter")

    # Verify task added
    print("Verifying task added...")
    task_loc = page.get_by_text("Task Undo Test")
    expect(task_loc).to_be_visible()

    # Blur input to ensure Ctrl+Z triggers App Undo
    print("Blurring input...")
    input_loc.blur()
    # Click outside to be safe
    page.locator("body").click(position={"x": 0, "y": 0})

    # Wait a bit
    time.sleep(0.5)

    # Undo
    print("Pressing Ctrl+Z...")
    page.keyboard.press("Control+z")

    # Verify Toast
    print("Verifying toast...")
    try:
        expect(page.get_by_text("Undone")).to_be_visible(timeout=3000)
        print("Toast appeared!")
    except:
        print("Toast did not appear!")
        page.screenshot(path="verification_toast_fail.png")
        raise

    # Verify Task Removed
    print("Verifying task removed...")
    expect(task_loc).not_to_be_visible()

    print("Success! Taking screenshot.")
    page.screenshot(path="verification_undo_success.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_undo(page)
        except Exception as e:
            print(f"Test failed: {e}")
            raise e
        finally:
            browser.close()
