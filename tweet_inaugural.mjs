import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('/root/claude/mission-control/node_modules/playwright');

const AUTH_TOKEN = 'e946f7b29b2c39a2b0fa5ec3b2ed431b11dbc224';
const CT0 = 'f8be2d96816dfb25b9e5e60aa380e8df97a9358af51a4d6b8498432b078267b733f0caa8d0c0824a567f111ab0b7842b226a53c6119c77febcf9b6349b1bbaa71488128f2df2f63cf7496a0a48f49cf2';

const TWEET_TEXT = `México necesita voces que no se callen.

Esta cuenta nace para documentar, denunciar y construir — con datos, con memoria y con la fuerza de quienes creen que otro México es posible.

Bienvenidos. El trabajo empieza hoy.

#MéxicoNecesario`;

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
    ]
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 900 },
  });

  // Inject session cookies BEFORE navigating
  await context.addCookies([
    {
      name: 'auth_token',
      value: AUTH_TOKEN,
      domain: '.x.com',
      path: '/',
      secure: true,
      httpOnly: true,
      sameSite: 'None',
    },
    {
      name: 'ct0',
      value: CT0,
      domain: '.x.com',
      path: '/',
      secure: true,
      httpOnly: false,
      sameSite: 'Lax',
    },
  ]);

  const page = await context.newPage();

  console.log('Navigating to x.com/home...');
  await page.goto('https://x.com/home', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(4000);

  const url = page.url();
  const title = await page.title();
  console.log(`URL: ${url}`);
  console.log(`Title: ${title}`);

  await page.screenshot({ path: '/tmp/x_step1_home.png' });
  console.log('Screenshot 1: /tmp/x_step1_home.png');

  if (url.includes('login') || url.includes('i/flow/login')) {
    console.log('ERROR: Redirected to login — cookies expired or invalid');
    await browser.close();
    process.exit(1);
  }

  console.log('Session appears active. Looking for compose area...');

  let composeEl = null;
  const composeSelectors = [
    '[data-testid="tweetTextarea_0"]',
    'div[aria-label="Post text"]',
    'div[role="textbox"]',
  ];

  for (const sel of composeSelectors) {
    try {
      composeEl = await page.waitForSelector(sel, { timeout: 8000 });
      if (composeEl) {
        console.log(`Found compose textarea: ${sel}`);
        break;
      }
    } catch (e) {
      console.log(`Not found: ${sel}`);
    }
  }

  if (!composeEl) {
    console.log('Trying compose button...');
    const composeBtn = await page.$('[data-testid="SideNav_NewTweet_Button"], [aria-label="Post"], a[href="/compose/post"]');
    if (composeBtn) {
      await composeBtn.click();
      await page.waitForTimeout(2000);
      for (const sel of composeSelectors) {
        try {
          composeEl = await page.waitForSelector(sel, { timeout: 6000 });
          if (composeEl) {
            console.log(`Found after button click: ${sel}`);
            break;
          }
        } catch (e) {}
      }
    }
  }

  if (!composeEl) {
    console.log('ERROR: No compose area found');
    await page.screenshot({ path: '/tmp/x_error_no_compose.png' });
    await browser.close();
    process.exit(1);
  }

  await composeEl.click();
  await page.waitForTimeout(500);
  
  // Type character by character to trigger X's React onChange handlers
  await composeEl.type(TWEET_TEXT, { delay: 20 });
  await page.waitForTimeout(2000);

  await page.screenshot({ path: '/tmp/x_step2_composed.png' });
  console.log('Screenshot 2: /tmp/x_step2_composed.png — tweet composed');

  // Wait for Post button to become enabled
  await page.waitForTimeout(1000);
  
  const postBtnSelectors = [
    '[data-testid="tweetButtonInline"]',
    '[data-testid="tweetButton"]',
  ];

  // Check if there's an overlay blocking clicks and dismiss it
  const overlay = await page.$('div#layers [role="dialog"], div#layers');
  if (overlay) {
    console.log('Overlay detected — checking if it is a modal dialog...');
    const dialog = await page.$('[role="dialog"]');
    if (dialog) {
      console.log('Dialog found — pressing Escape to close...');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(1000);
    }
  }

  let posted = false;
  for (const sel of postBtnSelectors) {
    try {
      const btn = await page.$(sel);
      if (btn) {
        const isDisabled = await btn.getAttribute('aria-disabled');
        console.log(`Found post button: ${sel} (disabled: ${isDisabled})`);
        // Use force click to bypass overlay interception
        await btn.click({ force: true });
        await page.waitForTimeout(5000);
        posted = true;
        console.log('Post button clicked (force)!');
        break;
      }
    } catch (e) {
      console.log(`Post button error: ${sel} — ${e.message}`);
    }
  }

  if (!posted) {
    console.log('ERROR: Could not click post button');
    await page.screenshot({ path: '/tmp/x_error_no_postbtn.png' });
    await browser.close();
    process.exit(1);
  }

  await page.screenshot({ path: '/tmp/x_step3_after_post.png' });
  console.log('Screenshot 3: /tmp/x_step3_after_post.png — after posting');

  console.log('Navigating to @mexiconecesario profile...');
  await page.goto('https://x.com/mexiconecesario', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(3000);

  await page.screenshot({ path: '/tmp/x_step4_profile.png' });
  console.log('Screenshot 4: /tmp/x_step4_profile.png — profile');

  const firstTweetLink = await page.$('article a[href*="/status/"]');
  if (firstTweetLink) {
    const href = await firstTweetLink.getAttribute('href');
    console.log(`TWEET URL: https://x.com${href}`);
  } else {
    console.log('Could not extract tweet URL — check screenshot 4');
  }

  await browser.close();
  console.log('Done.');
})();
