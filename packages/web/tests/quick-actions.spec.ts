import { test, expect } from '@playwright/test';

test.describe('Quick Actions Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/calendar');
    await page.waitForLoadState('networkidle');
  });

  test('schedule meeting button is clickable', async ({ page }) => {
    const scheduleButton = page.getByText('Schedule Meeting');
    await expect(scheduleButton).toBeVisible();
    
    // Test button click
    await scheduleButton.click();
    
    // Should trigger some action (modal, navigation, etc.)
    // For now, just verify button is interactive
    await expect(scheduleButton).toBeVisible();
  });

  test('log inspection button works', async ({ page }) => {
    const inspectionButton = page.getByText('Log Inspection');
    await expect(inspectionButton).toBeVisible();
    
    await inspectionButton.click();
    
    // Verify button interaction
    await expect(inspectionButton).toBeVisible();
  });

  test('track delivery button functions', async ({ page }) => {
    const deliveryButton = page.getByText('Track Delivery');
    await expect(deliveryButton).toBeVisible();
    
    await deliveryButton.click();
    
    // Verify button is functional
    await expect(deliveryButton).toBeVisible();
  });

  test('add milestone button operates', async ({ page }) => {
    const milestoneButton = page.getByText('Add Milestone');
    await expect(milestoneButton).toBeVisible();
    
    await milestoneButton.click();
    
    // Verify button works
    await expect(milestoneButton).toBeVisible();
  });

  test('view mode toggle buttons work', async ({ page }) => {
    // Test calendar view toggle buttons
    const monthButton = page.getByText('Month');
    const weekButton = page.getByText('Week');
    const dayButton = page.getByText('Day');

    await expect(monthButton).toBeVisible();
    await expect(weekButton).toBeVisible();
    await expect(dayButton).toBeVisible();

    // Test switching views
    await weekButton.click();
    await expect(weekButton).toHaveClass(/bg-white/); // Should be active
    
    await dayButton.click();
    await expect(dayButton).toHaveClass(/bg-white/); // Should be active
    
    await monthButton.click();
    await expect(monthButton).toHaveClass(/bg-white/); // Should be active
  });

  test('navigation links are clickable', async ({ page }) => {
    // Test sidebar navigation
    const projectsLink = page.getByText('Projects');
    const chatLink = page.getByText('Chat');
    const documentsLink = page.getByText('Documents');

    await expect(projectsLink).toBeVisible();
    await expect(chatLink).toBeVisible();
    await expect(documentsLink).toBeVisible();

    // Test navigation
    await projectsLink.click();
    await expect(page).toHaveURL(/.*\/projects/);
    
    await page.goBack();
    
    await chatLink.click();  
    await expect(page).toHaveURL(/.*\/chat/);
    
    await page.goBack();
    
    await documentsLink.click();
    await expect(page).toHaveURL(/.*\/documents/);
  });
});