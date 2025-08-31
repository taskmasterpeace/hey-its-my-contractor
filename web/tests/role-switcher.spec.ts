import { test, expect } from '@playwright/test';

test.describe('Role Switcher Functionality', () => {
  test('role switcher appears and works', async ({ page }) => {
    await page.goto('/projects');
    
    // Check if Mike Johnson appears as current user
    await expect(page.getByText('Mike Johnson')).toBeVisible();
    await expect(page.getByText('contractor', { exact: false })).toBeVisible();
    
    // Click on user dropdown  
    await page.click('text=Mike Johnson');
    
    // Check if dropdown opens with user options
    await expect(page.getByText('Switch User View')).toBeVisible();
    await expect(page.getByText('John Smith')).toBeVisible();
    await expect(page.getByText('Emily Wilson')).toBeVisible();
    
    // Switch to John Smith (client)
    await page.click('text=John Smith');
    
    // Verify user switched
    await expect(page.getByText('John Smith')).toBeVisible();
    await expect(page.getByText('homeowner', { exact: false })).toBeVisible();
  });
});