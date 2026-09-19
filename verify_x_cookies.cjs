const { chromium } = require('/root/claude/mission-control/node_modules/playwright');

const AUTH_TOKEN = 'e946f7b29b2c39a2b0fa5ec3b2ed431b11dbc224';
const CT0 = 'f8be2d96816dfb25b9e5e60aa380e8df97a9358af51a4d6b8498432b078267b733f0caa8d0c0824a567f111ab0b7842b226a53c6119c77febcf9b6349b1bbaa71488128f2df2f63cf7496a0a48f49cf2';

(async () => {
  try {
    const browser = await chromium.launch({ 
      headless: true, 
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled']
    });
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });

    // Inject cookies before navigating
    await context.addCookies([
      { name: 'auth_token', value: AUTH_TOKEN, domain: '.x.com', path: '/', httpOnly: true, secure: true, sameSite: 'None' },
      { name: 'ct0', value: CT0, domain: '.x.com', path: '/', httpOnly: false, secure: true, sameSite: 'None' }
    ]);

    const page = await context.newPage();
    
    console.log('1. Navigating to @MexicoNecesario profile with cookies...');
    await page.goto('https://x.com/MexicoNecesario', { timeout: 30000, waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000);
    
    console.log('2. URL:', page.url());
    
    const tweetLinks = await page.$$eval('a[href*="/status/"]', links => 
      [...new Set(links.map(l => l.href).filter(h => h.includes('MexicoNecesario/status/')))].slice(0, 10)
    );
    console.log('3. Tweets:', JSON.stringify(tweetLinks));
    
    const bodySnippet = await page.evaluate(() => document.body.innerText.substring(0, 2000));
    console.log('4. Content:', bodySnippet);
    
    // Check if we're logged in (should see "Edit profile" or own account indicators)
    const isLoggedIn = await page.evaluate(() => {
      const body = document.body.innerText;
      return body.includes('Edit profile') || body.includes('Editar perfil');
    });
    console.log('5. Authenticated session:', isLoggedIn);
    
    await browser.close();
    console.log('DONE');
  } catch(e) {
    console.error('Error:', e.message);
  }
})();
