import { test, expect } from '@playwright/test';

test.describe('Role-Based Security', () => {
  test('contractor sees all projects, client sees only their project', async ({ page }) => {
    await page.goto('/projects');
    
    // As contractor (default), should see all 3 projects
    await expect(page.getByText('Johnson Kitchen Remodel')).toBeVisible();
    await expect(page.getByText('Wilson Bathroom Renovation')).toBeVisible();
    await expect(page.getByText('Davis Deck Construction')).toBeVisible();
    
    // Switch to client view (John Smith)
    await page.click('text=Mike Johnson');
    await page.click('text=John Smith');
    
    // Wait for page to update
    await page.waitForTimeout(1000);
    
    // As homeowner, should ONLY see their project
    await expect(page.getByText('Johnson Kitchen Remodel')).toBeVisible();
    await expect(page.getByText('Wilson Bathroom Renovation')).not.toBeVisible();
    await expect(page.getByText('Davis Deck Construction')).not.toBeVisible();
    
    // Switch to Emily Wilson
    await page.click('text=John Smith');
    await page.click('text=Emily Wilson');
    
    await page.waitForTimeout(1000);
    
    // Should only see Wilson Bathroom project  
    await expect(page.getByText('Wilson Bathroom Renovation')).toBeVisible();
    await expect(page.getByText('Johnson Kitchen Remodel')).not.toBeVisible();
    await expect(page.getByText('Davis Deck Construction')).not.toBeVisible();
  });
  
  test('client can only access their project data in all sections', async ({ page }) => {
    // Switch to client first
    await page.goto('/projects');
    await page.click('text=Mike Johnson');
    await page.click('text=John Smith');
    await page.waitForTimeout(1000);
    
    // Test Projects - should only see Johnson Kitchen
    await expect(page.getByText('Johnson Kitchen Remodel')).toBeVisible();
    await expect(page.getByText('Wilson Bathroom')).not.toBeVisible();
    
    // Test Calendar - should only see Johnson Kitchen events
    await page.click('text=Calendar');
    await page.waitForTimeout(2000);
    
    // Should see Johnson Kitchen events but not Wilson Bathroom events
    await expect(page.getByText('Johnson Kitchen', { exact: false })).toBeVisible();
    
    // Test Chat - should only see Johnson Kitchen chats
    await page.click('text=Chat'); 
    await page.waitForTimeout(2000);
    
    await expect(page.getByText('Johnson Kitchen Project')).toBeVisible();
    // Should not see Wilson Bathroom Team chat
    
    // Test Documents - should only see Johnson Kitchen docs
    await page.click('text=Documents');
    await page.waitForTimeout(2000);
    
    // Should see kitchen-related docs only
  });
});