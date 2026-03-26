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
        # Use a more flexible selector for the plus button near Projects
        plus_button = page.locator("aside h3:has-text('Projects')").locator("xpath=../button")
        plus_button.click()

        page.get_by_placeholder("Project Name...").fill("Work")
        page.keyboard.press("Enter")
        time.sleep(1)

        # 2. Ensure we are in Nested view
        # The button text is "Flat" when in flat mode, and "Nested" when in nested mode?
        # Actually, looking at BulletUtils.tsx or similar, it's usually a toggle.
        # In DailyLog.tsx:
        # <button onClick={() => setGroupByProject(!groupByProject)} ...>
        #   {groupByProject ? <Rows size={18} /> : <Columns size={18} />}
        #   {groupByProject ? 'Flat' : 'Nested'}
        # </button>
        # If it shows "Flat", it means groupByProject is true (Nested mode).
        # Wait, if groupByProject is true, the label is "Flat" (to switch TO flat).
        # Let's check the code in DailyLog.tsx.

        print("Checking view mode...")
        view_toggle = page.get_by_role("button", name="Flat")
        if view_toggle.count() > 0:
            print("Already in Nested mode (button says 'Flat')")
        else:
            view_toggle = page.get_by_role("button", name="Nested")
            if view_toggle.count() > 0:
                print("In Flat mode, switching to Nested...")
                view_toggle.click()
                time.sleep(0.5)

        # 3. Add a task to 'Work' via the main editor first to make it show up
        print("Adding task to 'Work' via main editor...")
        page.get_by_placeholder("Add a task (•), event (o), or note (-)...").fill("Initial Task")
        page.get_by_role("button", name="No Project").click()
        # The project picker might take a moment to show up
        page.get_by_role("button", name="Work").click()
        page.keyboard.press("Enter")
        time.sleep(1)

        page.screenshot(path="nested_view_with_work.png")

        # 4. Use the inline editor for 'Work'
        print("Using inline editor for 'Work'...")
        inline_input = page.get_by_placeholder("Add to Work...")
        expect(inline_input).to_be_visible()
        inline_input.fill("Inline Task for Work")
        inline_input.press("Enter")
        time.sleep(1)

        page.screenshot(path="task_added_inline.png")

        # 5. Verify it has the correct project in Flat view
        print("Checking assignment in Flat view...")
        page.get_by_role("button", name="Flat").click()
        time.sleep(1)

        # Look for "Inline Task for Work"
        task_text = page.get_by_text("Inline Task for Work")
        expect(task_text).to_be_visible()

        # Check if "Work" project tag is visible nearby
        # In Flat view, BulletItem renders the collection title
        work_tag = page.locator("div").filter(has_text="Inline Task for Work").get_by_text("Work", exact=True)
        expect(work_tag.first).to_be_visible()

        page.screenshot(path="flat_view_verification.png")
        print("Verification complete.")

        browser.close()

if __name__ == "__main__":
    run()
