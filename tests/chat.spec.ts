import { test, expect } from '@playwright/test';

test.describe('Chat Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/chat');
  });

  test('chat page loads with room list', async ({ page }) => {
    await expect(page.getByText('Messages')).toBeVisible();
    await expect(page.getByText('Johnson Kitchen Project')).toBeVisible();
    await expect(page.getByText('Wilson Bathroom Team')).toBeVisible();
  });

  test('can select a chat room', async ({ page }) => {
    // Click on first chat room
    await page.click('text=Johnson Kitchen Project');
    
    // Check if chat window opens
    await expect(page.getByText('Johnson Kitchen Project')).toBeVisible();
    await expect(page.getByText('Project Chat')).toBeVisible();
  });

  test('can type and send a message', async ({ page }) => {
    // Select a room first
    await page.click('text=Johnson Kitchen Project');
    
    // Wait for message input to be visible
    await page.waitForSelector('textarea[placeholder*="Message"]', { timeout: 5000 });
    
    // Type a message
    const messageInput = page.locator('textarea[placeholder*="Message"]');
    await messageInput.fill('This is a test message from Playwright');
    
    // Click send button
    const sendButton = page.locator('button:has-text("Send"), button:has(svg)').last();
    await sendButton.click();
    
    // Check if message appears in chat
    await expect(page.getByText('This is a test message from Playwright')).toBeVisible({ timeout: 3000 });
  });

  test('file upload button is functional', async ({ page }) => {
    // Select a room
    await page.click('text=Johnson Kitchen Project');
    
    // Check if file upload buttons exist
    await expect(page.locator('button:has-text("📎"), button:has([data-testid="paperclip"])')).toBeVisible();
    await expect(page.locator('button:has-text("📷"), button:has([data-testid="camera"])')).toBeVisible();
  });

  test('quick action templates work', async ({ page }) => {
    // Select a project room  
    await page.click('text=Johnson Kitchen Project');
    
    // Look for quick action button (if available)
    const quickActionButton = page.locator('button:has-text("⚡"), button:has([data-testid="lightning"])');
    if (await quickActionButton.isVisible()) {
      await quickActionButton.click();
      
      // Check if templates appear
      await expect(page.getByText('Work Started')).toBeVisible();
      await expect(page.getByText('Progress Update')).toBeVisible();
    }
  });

  test('user list sidebar is functional', async ({ page }) => {
    // Select a room
    await page.click('text=Johnson Kitchen Project');
    
    // Check sidebar content
    await expect(page.getByText('Online')).toBeVisible();
    await expect(page.getByText('Mike Johnson')).toBeVisible();
  });
});