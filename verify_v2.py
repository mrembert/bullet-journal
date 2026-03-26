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
        # The '+' button next to PROJECTS
        page.locator("div:has-text('PROJECTS') + button").click()
        page.get_by_placeholder("Project name...").fill("Work")
        page.keyboard.press("Enter")
        time.sleep(1)

        # 2. Switch to Nested view if not already
        # In current_state.png, there is a button that says 'Flat'
        # If it says 'Flat', clicking it should switch to 'Nested'?
        # Actually, let's check the button text/icon.
        # Usually it's a toggle or a group.
        # In the screenshot it looks like a button with text "Flat".
        print("Switching to Nested view...")
        page.get_by_role("button", name="Flat").click()
        time.sleep(1)

        # Now it should show "Nested"
        # Since 'Work' has no tasks, it might not show up yet if TaskGroupList hides empty projects.
        # Let's add a task to 'Work' via the main editor first.
        print("Adding task to 'Work' via main editor...")
        page.get_by_placeholder("Add a task (•), event (o), or note (-)...").fill("Initial Task")
        page.get_by_role("button", name="No Project").click()
        page.get_by_role("button", name="Work").click()
        page.get_by_role("button", name="Add task").click()
        time.sleep(1)

        page.screenshot(path="nested_view_with_work.png")
        print("Saved nested_view_with_work.png")

        # 3. Use the inline editor for 'Work'
        print("Using inline editor for 'Work'...")
        inline_input = page.get_by_placeholder("Add to Work...")
        expect(inline_input).to_be_visible()
        inline_input.fill("Inline Task for Work")
        inline_input.press("Enter")
        time.sleep(1)

        page.screenshot(path="task_added_inline.png")
        print("Saved task_added_inline.png")

        # 4. Verify it has the correct project in Flat view
        print("Checking assignment in Flat view...")
        page.get_by_role("button", name="Nested").click()
        time.sleep(1)

        # Look for "Inline Task for Work" and "Work" tag
        expect(page.get_by_text("Inline Task for Work")).to_be_visible()
        # The project tag is usually a small badge or text
        expect(page.locator("div:has-text('Inline Task for Work')").get_by_text("Work", exact=True)).to_be_visible()

        page.screenshot(path="flat_view_verification.png")
        print("Saved flat_view_verification.png")

        browser.close()

if __name__ == "__main__":
    run()
