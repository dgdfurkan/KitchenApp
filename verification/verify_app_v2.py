from playwright.sync_api import sync_playwright
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()

        # 1. Inventory View
        page.goto("http://localhost:5173")
        time.sleep(2)

        # Add Ingredient
        # Click the Plus FAB button
        page.locator("button.rounded-2xl.shadow-lg").click()
        time.sleep(0.5)

        page.fill("textarea", "2 kg Domates\n500g Kıyma")
        page.click("text=Malzemeleri Ekle")
        time.sleep(1)

        # 2. Navigate to Generator View (2nd button in nav)
        # Using nth-child(2) on the nav buttons
        page.locator("nav button").nth(1).click()
        time.sleep(1)
        page.screenshot(path="verification/3_generator_load_fixed.png")

        # Verify we are on generator page
        if not page.is_visible("text=Zaman Çizelgesi"):
             print("Generator page not loaded!")
             # Dump page content for debugging
             # print(page.content())
             return

        # Interact with Day Linker (Day 2)
        # Day buttons contain "GÜN". We want the second one.
        day_buttons = page.locator("button:has-text('GÜN')")
        # Ensure we have buttons
        count = day_buttons.count()
        print(f"Found {count} day buttons")

        if count > 1:
            day_buttons.nth(1).click()
            time.sleep(0.5)

        # Select Filters (toggle buttons)
        page.click("text=İtalyan")
        page.click("text=Ziyafet Sofrası")

        # Generate
        page.click("text=Sihirli Menüyü Oluştur")
        time.sleep(2)
        page.screenshot(path="verification/4_generator_result.png")

        # 3. Settings View (4th button)
        page.locator("nav button").nth(3).click()
        time.sleep(1)
        page.screenshot(path="verification/5_settings.png")

        browser.close()

if __name__ == "__main__":
    run()
