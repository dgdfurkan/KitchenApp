from playwright.sync_api import sync_playwright
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()

        # 1. Inventory View
        page.goto("http://localhost:5173")
        time.sleep(1) # Wait for load
        page.screenshot(path="verification/1_inventory_empty.png")

        # Add Ingredient
        page.click("text=Malzeme Ekle")
        page.fill("textarea", "2 kg Domates\n500g Kıyma\n1 paket Makarna")
        page.click("button:has-text('Ekle')")
        time.sleep(1)
        page.screenshot(path="verification/2_inventory_added.png")

        # 2. Generator View
        page.click("text=Şef")
        time.sleep(0.5)
        # Change constraints
        page.fill("input[type=range][max='7']", "3") # 3 Days (slider) - triggering change might be tricky with fill on range
        # Use simple click on buttons
        page.click("text=Standart") # Calories
        page.click("text=Toplu Pişirme") # Batch Cooking checkbox

        page.click("text=Prompt Oluştur")
        time.sleep(1)
        page.screenshot(path="verification/3_generator_prompt.png")

        # 3. Settings View
        page.click("text=Ayarlar")
        time.sleep(0.5)
        page.screenshot(path="verification/4_settings.png")

        browser.close()

if __name__ == "__main__":
    run()
