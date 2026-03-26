from playwright.sync_api import sync_playwright, expect
import time
import os

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Use a larger viewport to see everything
        context = browser.new_context(viewport={'width': 1280, 'height': 800})
        page = context.new_page()

        # Navigate to the app
        print("Navigating to http://localhost:5173...")
        page.goto("http://localhost:5173")

        # Wait for the app to load
        page.wait_for_selector("text=Today", timeout=10000)

        # 1. Create a project if none exists
        print("Checking for projects...")
        if page.locator("text=Test Project").count() == 0:
            print("Creating 'Test Project'...")
            page.click("button:has-text('Projects') + button") # The '+' button next to PROJECTS
            # Or use the specific button if I can find it.
            # Based on common patterns:
            page.get_by_role("button", name="Add Project").click()
            page.fill("input[placeholder='Project name...']", "Test Project")
            page.keyboard.press("Enter")
            time.sleep(1)

        # 2. Ensure we are in Nested view
        print("Ensuring Nested view...")
        nested_button = page.get_by_role("button", name="Nested")
        # Check if it has the active class/style. Usually it's highlighted.
        # For now just click it to be sure.
        nested_button.click()

        # 3. Add a task to 'Test Project' to make sure it shows up in the list
        print("Adding initial task to 'Test Project'...")
        page.get_by_placeholder("Add a task (•), event (o), or note (-)...").fill("Initial Task")
        # Open project picker
        page.get_by_role("button", name="No Project").click()
        page.get_by_role("button", name="Test Project").click()
        page.keyboard.press("Enter")
        time.sleep(1)

        # 4. Find the inline editor for 'Test Project'
        print("Looking for inline editor in 'Test Project' section...")
        # The placeholder should be "Add to Test Project..."
        inline_editor = page.get_by_placeholder("Add to Test Project...")
        expect(inline_editor).to_be_visible()

        # 5. Type a task in the inline editor
        print("Adding task via inline editor...")
        inline_editor.fill("Inline Task")
        inline_editor.press("Enter")
        time.sleep(1)

        # 6. Verify task appeared
        print("Verifying task appeared...")
        expect(page.get_by_text("Inline Task")).to_be_visible()

        # Take a screenshot of Nested view
        page.screenshot(path="verify_nested.png")
        print("Screenshot saved as verify_nested.png")

        # 7. Switch to Flat view and verify project tag
        print("Switching to Flat view...")
        page.get_by_role("button", name="Flat").click()
        time.sleep(1)

        # In Flat view, the task "Inline Task" should have a "Test Project" tag next to it
        # We can check if the text "Test Project" appears near "Inline Task"
        task_row = page.locator("div:has-text('Inline Task')").filter(has_text="Test Project")
        expect(task_row.first).to_be_visible()

        # Take a screenshot of Flat view
        page.screenshot(path="verify_flat.png")
        print("Screenshot saved as verify_flat.png")

        browser.close()

if __name__ == "__main__":
    run()
