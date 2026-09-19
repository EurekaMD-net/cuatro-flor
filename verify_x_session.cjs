const { chromium } = require('/root/claude/mission-control/node_modules/playwright');

(async () => {
  try {
    const browser = await chromium.launch({ 
      headless: true, 
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled']
    });
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    const page = await context.newPage();
    
    console.log('1. Navigating to login...');
    await page.goto('https://x.com/login', { timeout: 30000, waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4000);
    
    const usernameInput = await page.$('input[autocomplete="username"]');
    if (!usernameInput) {
      console.log('ERROR: No username input found');
      const body = await page.evaluate(() => document.body.innerText);
      console.log(body.substring(0, 500));
      await browser.close();
      return;
    }
    
    await usernameInput.fill('comunidades@mexiconecesario.org.mx');
    await page.waitForTimeout(500);
    
    const nextBtn = await page.getByRole('button', { name: 'Next' });
    await nextBtn.click();
    await page.waitForTimeout(4000);
    
    const pwInput = await page.$('input[name="password"]');
    if (!pwInput) {
      console.log('ERROR: No password field found after Next');
      const body = await page.evaluate(() => document.body.innerText);
      console.log(body.substring(0, 800));
      await browser.close();
      return;
    }
    
    await pwInput.fill('C0mun1d4d');
    await page.getByRole('button', { name: 'Log in' }).click();
    await page.waitForTimeout(6000);
    
    const finalUrl = page.url();
    console.log('2. Login URL:', finalUrl);
    const loggedIn = !finalUrl.includes('login') && !finalUrl.includes('flow');
    console.log('3. Logged in:', loggedIn);
    
    if (!loggedIn) {
      console.log('ERROR: Login failed');
      const body = await page.evaluate(() => document.body.innerText);
      console.log(body.substring(0, 800));
      await browser.close();
      return;
    }
    
    console.log('4. Navigating to @MexicoNecesario profile...');
    await page.goto('https://x.com/MexicoNecesario', { timeout: 30000, waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000);
    
    console.log('5. Profile URL:', page.url());
    
    const tweetLinks = await page.$$eval('a[href*="/status/"]', links => 
      [...new Set(links.map(l => l.href).filter(h => h.includes('MexicoNecesario/status/')))].slice(0, 10)
    );
    console.log('6. Tweets:', JSON.stringify(tweetLinks));
    
    const bodySnippet = await page.evaluate(() => document.body.innerText.substring(0, 1500));
    console.log('7. Content:', bodySnippet);
    
    await browser.close();
    console.log('DONE');
  } catch(e) {
    console.error('Error:', e.message);
  }
})();
