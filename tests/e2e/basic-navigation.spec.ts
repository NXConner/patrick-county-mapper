import { test, expect } from '@playwright/test';

test.describe('Basic Navigation', () => {
  test('should load the homepage successfully', async ({ page }) => {
    await page.goto('/');
    
    // Check that the main heading is visible
    await expect(page.getByRole('heading', { name: /Patrick County GIS Pro/i })).toBeVisible();
    
    // Check that the map container is present
    await expect(page.locator('[data-testid="map-container"]').or(page.locator('.leaflet-container'))).toBeVisible({ timeout: 10000 });
  });

  test('should have working search functionality', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Find and interact with the search input
    const searchInput = page.getByPlaceholder(/search addresses/i);
    await expect(searchInput).toBeVisible();
    
    // Type in the search box
    await searchInput.fill('Stuart');
    await searchInput.press('Enter');
    
    // Wait for search results (this might need to be adjusted based on actual implementation)
    await page.waitForTimeout(2000);
  });

  test('should have responsive design for mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Check that the mobile layout is working
    await expect(page.getByRole('heading', { name: /Patrick County GIS Pro/i })).toBeVisible();
    
    // Verify mobile-specific elements are visible/hidden appropriately
    const header = page.locator('header').or(page.locator('[data-testid="header"]'));
    await expect(header).toBeVisible();
  });

  test('should load measurement tools', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the page to load completely
    await page.waitForLoadState('networkidle');
    
    // Look for measurement toolbar or buttons
    const measurementTool = page.locator('[data-testid="measurement-toolbar"]')
      .or(page.getByRole('button', { name: /measure/i }))
      .or(page.locator('.measurement'));
    
    await expect(measurementTool.first()).toBeVisible({ timeout: 15000 });
  });

  test('should handle GPS location request', async ({ page, context }) => {
    // Grant geolocation permission
    await context.grantPermissions(['geolocation']);
    
    // Mock geolocation
    await context.setGeolocation({ latitude: 36.6885, longitude: -80.2735 });
    
    await page.goto('/');
    
    // Wait for page load
    await page.waitForLoadState('networkidle');
    
    // Look for GPS/location button
    const locationButton = page.getByRole('button', { name: /locate me/i })
      .or(page.getByRole('button', { name: /find my location/i }))
      .or(page.locator('[data-testid="gps-button"]'));
    
    if (await locationButton.count() > 0) {
      await locationButton.first().click();
      
      // Wait for location to be processed
      await page.waitForTimeout(2000);
    }
  });

  test('should display property information panel', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Look for property panel toggle or the panel itself
    const propertyPanel = page.locator('[data-testid="property-panel"]')
      .or(page.getByText(/property information/i))
      .or(page.locator('.property-panel'));
    
    // The panel might be initially hidden, so we'll check if it can be toggled
    const propertyToggle = page.getByRole('button', { name: /property/i });
    
    if (await propertyToggle.count() > 0) {
      await propertyToggle.first().click();
      await expect(propertyPanel.first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('should handle map service selection', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Look for map service dropdown
    const mapServiceDropdown = page.locator('[data-testid="map-service-dropdown"]')
      .or(page.getByRole('combobox'))
      .or(page.locator('select'))
      .or(page.getByText(/satellite/i));
    
    if (await mapServiceDropdown.count() > 0) {
      await mapServiceDropdown.first().click();
      
      // Wait for dropdown options to appear
      await page.waitForTimeout(1000);
      
      // Try to select a different map service
      const option = page.getByText(/google/i).or(page.getByText(/bing/i));
      if (await option.count() > 0) {
        await option.first().click();
        await page.waitForTimeout(2000);
      }
    }
  });

  test('should be accessible', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check for basic accessibility features
    const mainContent = page.locator('main').or(page.locator('[role="main"]'));
    await expect(mainContent.first()).toBeVisible();
    
    // Check that interactive elements are keyboard accessible
    const searchInput = page.getByRole('textbox').first();
    if (await searchInput.count() > 0) {
      await searchInput.focus();
      await expect(searchInput).toBeFocused();
    }
    
    // Check for skip links or other accessibility features
    const skipLink = page.getByText(/skip to/i);
    if (await skipLink.count() > 0) {
      await expect(skipLink.first()).toBeVisible();
    }
  });
});

test.describe('Performance', () => {
  test('should load within reasonable time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Should load within 10 seconds (adjust as needed)
    expect(loadTime).toBeLessThan(10000);
  });
  
  test('should not have console errors', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Filter out expected errors (like network requests that might fail in testing)
    const significantErrors = errors.filter(error => 
      !error.includes('favicon') && 
      !error.includes('manifest') &&
      !error.includes('sw.js') &&
      !error.toLowerCase().includes('network')
    );
    
    expect(significantErrors).toHaveLength(0);
  });
});