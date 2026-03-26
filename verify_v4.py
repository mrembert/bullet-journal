from playwright.sync_api import sync_playwright, expect
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1280, 'height': 800})
        page = context.new_page()

        print("Navigating to http://localhost:5173...")
        page.goto("http://localhost:5173")
        page.wait_for_selector("text=Today", timeout=10000)

        # 1. Create a project
        print("Creating 'Work' project...")
        plus_button = page.locator("aside h3:has-text('Projects')").locator("xpath=../button")
        plus_button.click()
        page.get_by_placeholder("Project Name...").fill("Work")
        page.keyboard.press("Enter")
        time.sleep(1)

        # 2. Switch to Nested view
        print("Checking view mode...")
        view_toggle = page.get_by_role("button", name="Flat")
        if view_toggle.count() > 0:
            print("Already in Nested mode")
        else:
            page.get_by_role("button", name="Nested").click()
            time.sleep(0.5)

        # 3. Add a task to 'Work' via the main editor first to make it show up
        print("Adding task to 'Work' via main editor...")
        page.get_by_placeholder("Add a task (•), event (o), or note (-)...").fill("Initial Task")
        page.get_by_role("button", name="No Project").click()
        # Specific project option in the picker has "project-option" class
        page.locator(".project-option:has-text('Work')").click()
        page.keyboard.press("Enter")
        time.sleep(1)

        # 4. Use the inline editor for 'Work'
        print("Using inline editor for 'Work'...")
        inline_input = page.get_by_placeholder("Add to Work...")
        expect(inline_input).to_be_visible()
        inline_input.fill("Inline Task for Work")
        # Click the submit button next to the input instead of just Enter, just to be sure
        # In BulletEditor:
        # <button type="submit" ...> <CornerDownLeft size={16} /> </button>
        # It's the sibling of the input
        inline_input.press("Enter")
        time.sleep(1)

        page.screenshot(path="task_added_inline.png")

        # 5. Verify assignment in Flat view
        print("Checking assignment in Flat view...")
        # Toggle back to Flat
        page.get_by_role("button", name="Flat").click()
        time.sleep(1)

        expect(page.get_by_text("Inline Task for Work")).to_be_visible()
        # Project tag should be there
        expect(page.locator("div:has-text('Inline Task for Work')").get_by_text("Work", exact=True)).to_be_visible()

        page.screenshot(path="flat_view_verification.png")
        print("Verification complete.")

        browser.close()

if __name__ == "__main__":
    run()
