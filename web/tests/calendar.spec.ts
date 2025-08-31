import { test, expect } from '@playwright/test';

test.describe('Calendar Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/calendar');
  });

  test('calendar page loads successfully', async ({ page }) => {
    await expect(page.getByText('Calendar Command Center')).toBeVisible();
    await expect(page.locator('.fc-calendar')).toBeVisible({ timeout: 10000 });
  });

  test('can click on calendar date to open event modal', async ({ page }) => {
    // Wait for FullCalendar to load
    await page.waitForSelector('.fc-day', { timeout: 10000 });
    
    // Click on a calendar day cell
    const dayCell = page.locator('.fc-day').first();
    await dayCell.click();
    
    // Check if modal opens
    await expect(page.getByText('Create New Event')).toBeVisible({ timeout: 5000 });
    await expect(page.getByPlaceholder('Enter event title')).toBeVisible();
  });

  test('can fill out event creation form', async ({ page }) => {
    // Open modal
    await page.waitForSelector('.fc-day', { timeout: 10000 });
    await page.locator('.fc-day').first().click();
    
    // Wait for modal
    await page.waitForSelector('[placeholder="Enter event title"]', { timeout: 5000 });
    
    // Fill out form
    await page.fill('[placeholder="Enter event title"]', 'Test Meeting');
    await page.selectOption('select', 'meeting');
    
    // Check if save button is enabled
    const saveButton = page.getByText('Create Event');
    await expect(saveButton).toBeEnabled();
  });

  test('existing events are displayed on calendar', async ({ page }) => {
    // Wait for calendar to load
    await page.waitForSelector('.fc-event', { timeout: 10000 });
    
    // Check if sample events are visible
    await expect(page.getByText('Client Meeting')).toBeVisible();
    await expect(page.getByText('Site Inspection')).toBeVisible();
  });

  test('weather widget is displayed', async ({ page }) => {
    await expect(page.getByText('72°F')).toBeVisible();
    await expect(page.getByText('Perfect for outdoor work')).toBeVisible();
  });

  test('sidebar navigation works', async ({ page }) => {
    // Test quick actions in sidebar
    await expect(page.getByText('Schedule Meeting')).toBeVisible();
    await expect(page.getByText('Log Inspection')).toBeVisible();
    await expect(page.getByText('Track Delivery')).toBeVisible();
    
    // Test today's schedule
    await expect(page.getByText("Today's Schedule")).toBeVisible();
  });
});