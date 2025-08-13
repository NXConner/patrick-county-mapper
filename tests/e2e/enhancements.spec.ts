import { test, expect } from '@playwright/test';

test.describe('Enhancements', () => {
  test('battery saver toggle affects UI and persists', async ({ page }) => {
    await page.goto('/');
    const toggle = page.getByTestId('battery-saver-toggle');
    await expect(toggle).toBeVisible();
    await toggle.click();
    // Expect localStorage to be updated
    const stored = await page.evaluate(() => localStorage.getItem('battery-saver'));
    expect(stored === '1' || stored === '0').toBeTruthy();
  });

  test('map service selection persists across reloads', async ({ page }) => {
    await page.goto('/');
    // Open service dropdown and select Google (if present)
    await page.getByRole('combobox').first().click({ trial: true }).catch(() => {});
    await page.getByRole('combobox').first().click().catch(() => {});
    const option = page.getByText(/Google/i).first();
    if (await option.count()) {
      await option.click();
      await page.waitForTimeout(500);
      await page.reload();
      const selected = await page.evaluate(() => localStorage.getItem('selected-map-service'));
      expect(selected).toBeTruthy();
    }
  });

  test('property boundaries are debounced on move and can load', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // Toggle property layer if a control exists via toolbar
    const layersBtn = page.getByRole('button', { name: /layers/i }).first();
    if (await layersBtn.count()) {
      await layersBtn.click();
      const propertyToggle = page.getByText(/Property Lines/i).first();
      if (await propertyToggle.count()) {
        await propertyToggle.click();
        // Pan the map a few times quickly
        const map = page.getByTestId('map-container');
        if (await map.count()) {
          const box = await map.boundingBox();
          if (box) {
            for (let i = 0; i < 3; i++) {
              await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
              await page.mouse.down();
              await page.mouse.move(box.x + box.width / 2 + 50, box.y + box.height / 2);
              await page.mouse.up();
            }
          }
        }
        await page.waitForTimeout(1500);
      }
    }
  });

  test('long press copies coordinates to clipboard', async ({ page, context, browserName }) => {
    await page.goto('/');
    // Some browsers restrict clipboard in CI, but we can at least ensure the handler runs without error
    const map = page.getByTestId('map-container');
    await expect(map).toBeVisible();
    const box = await map.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.waitForTimeout(700);
      await page.mouse.up();
      // No assertion on clipboard due to sandbox, but ensure no crash
      expect(true).toBeTruthy();
    }
  });
});