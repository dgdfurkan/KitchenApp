from playwright.sync_api import sync_playwright
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()

        # 1. Inventory View
        page.goto("http://localhost:5173")
        time.sleep(2)

        # Add Ingredient (FAB)
        page.locator("button.rounded-2xl.shadow-lg").click()
        time.sleep(0.5)

        page.fill("textarea", "2 kg Domates\n500g Kıyma")
        page.click("text=Malzemeleri Ekle")
        time.sleep(1)

        # 2. Generator View (Chef Tab)
        page.locator("nav button").nth(1).click()
        time.sleep(1)

        # Verify New Sliders (Radix UI)
        # Check for Slider Root
        if not page.is_visible("span[role='slider']"):
             print("Sliders not visible!")

        # Interact with Day Linker (Day 2)
        day_buttons = page.locator("button:has-text('GÜN')")
        if day_buttons.count() > 1:
            day_buttons.nth(1).click()
            time.sleep(0.5)

        # Toggle Freezer Mode
        # The snowflake button in header
        page.click("button[title='Dondurucu Moduna Geç']")
        time.sleep(1)
        page.screenshot(path="verification/3_freezer_mode.png")

        # Switch back
        page.click("button[title='Normal Moda Dön']")
        time.sleep(1)

        # Select Filters
        # Mood (Multiple)
        page.click("text=Ziyafet Sofrası")
        page.click("text=Anne Yemeği (Comfort)")

        # Generate
        page.click("text=Sihirli Menüyü Oluştur")
        time.sleep(2)
        page.screenshot(path="verification/4_advanced_prompt.png")

        browser.close()

if __name__ == "__main__":
    run()
