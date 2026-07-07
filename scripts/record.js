const { chromium } = require('playwright');
const fs = require('fs');
const {
  injectDemoVisuals,
  announce,
  clickWithFlourish,
  typeSlowly,
  zoomToElement,
  resetZoom,
  pause
} = require('./utils');

const BASE_URL = 'http://localhost:3000';
const VIDEO_PATH = 'dist/full_screen.webm';

async function main() {
  console.log('Launching browser (Headless: false) and starting video recording...');
  const browser = await chromium.launch({
    slowMo: 40,
    headless: false,
    args: ['--start-maximized']
  });

  const context = await browser.newContext({
    viewport: null,
    recordVideo: {
      dir: 'dist/'
    }
  });

  const page = await context.newPage();
  const video = page.video();

  try {
    console.log(`Navigating to ${BASE_URL}...`);
    await page.goto(BASE_URL);
    await injectDemoVisuals(page);
    await pause(page, 1500);

    console.log('Navigating to Templates and scrolling to the bottom...');
    await announce(page, 'Exploring the Template Library...');
    const templatesLink = page.locator('a[title="Templates"]');
    await clickWithFlourish(page, templatesLink);
    await page.waitForURL('**/templates*');
    await pause(page, 1000);

    await page.evaluate(() => {
      const scrollables = Array.from(document.querySelectorAll('.custom-scrollbar, .overflow-y-auto'))
        .filter(el => el.scrollHeight > el.clientHeight);
      if (scrollables.length > 0) {
        scrollables[0].scrollTo({ top: scrollables[0].scrollHeight, behavior: 'smooth' });
      } else {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }
    });
    await pause(page, 2000);

    console.log('Navigating to Databases...');
    await announce(page, 'Viewing Saved Databases...');
    const databasesLink = page.locator('a[title="Databases"]');
    await clickWithFlourish(page, databasesLink);
    await page.waitForURL('**/databases*');
    await pause(page, 1500);

    console.log('Navigating to Settings to configure SMTP...');
    await announce(page, 'Configuring a new SMTP Sender Account...');
    const settingsLink = page.locator('a[title="Settings"]');
    await clickWithFlourish(page, settingsLink);
    await page.waitForURL('**/settings');
    await pause(page, 1000);

    const addAccountBtn = page.getByRole('button', { name: /Add.*Account/i }).first();
    await clickWithFlourish(page, addAccountBtn);

    console.log('Inputting SMTP credentials...');
    await typeSlowly(page, page.locator('input[placeholder="e.g., Marketing Team"]'), 'Demo Marketing');
    await typeSlowly(page, page.locator('input[placeholder="smtp.gmail.com"]'), 'smtp.gmail.com');

    const portInput = page.locator('input[placeholder="587"]');
    await portInput.fill('');
    await typeSlowly(page, portInput, '587');

    await typeSlowly(page, page.locator('input[placeholder="you@example.com"]'), 'acm.marketing@gmail.com');
    await typeSlowly(page, page.locator('input[placeholder="Enter password"]'), 'dummy_password_123');

    const saveAccountBtn = page.getByRole('button', { name: 'Save Account' });
    await clickWithFlourish(page, saveAccountBtn);
    await pause(page, 1500);

    console.log('Navigating to Campaigns...');
    await announce(page, 'Checking existing campaigns...');
    const campaignsLink = page.locator('a[title="Campaigns"]');
    await clickWithFlourish(page, campaignsLink);
    await page.waitForURL('**/campaigns*');
    await pause(page, 1500);

    console.log('Navigating to Templates to use a pre-built template...');
    await announce(page, 'Using a pre-built template for our new campaign...');
    await clickWithFlourish(page, templatesLink);
    await page.waitForURL('**/templates*');

    const targetCard = page.locator('.bg-surface-card').filter({ has: page.getByRole('heading', { name: 'Recruitment - Not Selected' }) }).first();
    await targetCard.scrollIntoViewIfNeeded();
    await targetCard.hover();
    await pause(page, 500);

    const useThisBtn = targetCard.getByRole('button', { name: 'Use this' });
    console.log('Zooming in on the "Use this" button...');
    await zoomToElement(page, useThisBtn, 1.4);
    await clickWithFlourish(page, useThisBtn);
    await pause(page, 1000);
    await resetZoom(page);

    console.log('Creating a new campaign from the template...');
    await page.waitForURL('**/campaigns/new?templateId=*');
    await announce(page, 'Creating a new campaign from the template...');
    const campaignNameInput = page.locator('#campaignName');
    await typeSlowly(page, campaignNameInput, 'Fall Recruitment Updates');

    const createCampaignBtn = page.getByRole('button', { name: 'Create Campaign' });
    await createCampaignBtn.scrollIntoViewIfNeeded();

    await page.evaluate(() => {
      const scrollables = Array.from(document.querySelectorAll('.custom-scrollbar, .overflow-y-auto'))
        .filter(el => el.scrollHeight > el.clientHeight);
      if (scrollables.length > 0) {
        scrollables[0].scrollTo({ top: scrollables[0].scrollHeight, behavior: 'smooth' });
      } else {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }
    });
    await pause(page, 1000);

    await clickWithFlourish(page, createCampaignBtn);

    await page.waitForURL('**/campaigns/*');
    await pause(page, 1500);

    console.log('Toggling the recipients panel...');
    await announce(page, 'Toggling the recipients panel...');
    const recipientsBtn = page.getByRole('button', { name: /Recipients/ });
    await clickWithFlourish(page, recipientsBtn);
    await pause(page, 1000);
    await clickWithFlourish(page, recipientsBtn);
    await pause(page, 1000);

    console.log('Checking the live logs for preflight status...');
    await announce(page, 'Checking the live logs for preflight status...');
    const liveLogsHeader = page.locator('h3', { hasText: 'Live Logs' });
    await clickWithFlourish(page, liveLogsHeader);
    await pause(page, 2000);

    console.log('Closing the live logs...');
    await clickWithFlourish(page, liveLogsHeader);
    await pause(page, 1000);

    console.log('Importing recipients from a saved database...');
    await announce(page, 'Importing recipients from our saved database...');
    const moreOptionsBtn = page.getByTitle('More Options');
    await clickWithFlourish(page, moreOptionsBtn);
    const importDbBtn = page.getByText('Import from Database');
    await clickWithFlourish(page, importDbBtn);

    const dbSelect = page.locator('select');
    await dbSelect.waitFor({ state: 'visible' });
    const dbOptionValue = await page.locator('select option', { hasText: 'AISSMS IOIT ACM Student Chapter Contacts' }).getAttribute('value');
    await dbSelect.selectOption(dbOptionValue);
    await pause(page, 500);

    const importRecordsBtn = page.getByRole('button', { name: 'Import Records' });
    await clickWithFlourish(page, importRecordsBtn);
    await pause(page, 1500);

    console.log('Opening recipients and previewing emails...');
    await clickWithFlourish(page, recipientsBtn);
    await pause(page, 1000);

    await announce(page, 'Previewing the personalized email...');
    const previewBtn = page.locator('table tbody tr').first().locator('button[aria-label="Preview Email"]');
    await clickWithFlourish(page, previewBtn);
    await pause(page, 2000);

    console.log('Scrolling through recipient previews...');
    await announce(page, 'Scrolling through recipient previews...');
    const nextBtn = page.locator('button[aria-label="Next Recipient"]');
    await clickWithFlourish(page, nextBtn);
    await pause(page, 1500);
    await clickWithFlourish(page, nextBtn);
    await pause(page, 2000);

    console.log('Closing preview modal...');
    const closeModalBtn = page.getByLabel('Close modal');
    await clickWithFlourish(page, closeModalBtn);
    await pause(page, 1000);

    console.log('Opening the confirmation modal...');
    await announce(page, 'Ready to dispatch! Reviewing the final summary...', 3000);
    const startSendingBtn = page.getByRole('button', { name: 'Start Sending' });
    await clickWithFlourish(page, startSendingBtn);
    await pause(page, 4500);

    console.log('Demo complete! Closing browser and saving video to ' + VIDEO_PATH);
  } catch (error) {
    console.error('An error occurred during the demo:', error);
    throw error;
  } finally {
    await context.close();
    await browser.close();

    if (video) {
      const tempVideoPath = await video.path();
      if (fs.existsSync(tempVideoPath)) {
        fs.renameSync(tempVideoPath, VIDEO_PATH);
      }
    }
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
