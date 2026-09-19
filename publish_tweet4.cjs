const { chromium } = require('/root/claude/mission-control/node_modules/playwright');

const AUTH_TOKEN = 'e946f7b29b2c39a2b0fa5ec3b2ed431b11dbc224';
const CT0 = 'f8be2d96816dfb25b9e5e60aa380e8df97a9358af51a4d6b8498432b078267b733f0caa8d0c0824a567f111ab0b7842b226a53c6119c77febcf9b6349b1bbaa71488128f2df2f63cf7496a0a48f49cf2';
const TWEET_3_4_ID = '2055127497616805930';

const TWEET_4_4 = `📌 Metas concretas:
→ 2030: 60% de la población objetivo con Blindaje Médico activo
→ 2034: Red Nacional de Cuidados operativa

¿Quieres ser parte?
📧 comunidades@mexiconecesario.org.mx
🌐 mexiconecesario.org.mx

#LongevidadActiva #MéxicoNecesario #AdultosMayores #EconomíaPlateada

(4/4)`;

(async () => {
  try {
    const browser = await chromium.launch({ 
      headless: true, 
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled']
    });
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      // Enable clipboard read/write permissions
      permissions: ['clipboard-read', 'clipboard-write']
    });

    await context.addCookies([
      { name: 'auth_token', value: AUTH_TOKEN, domain: '.x.com', path: '/', httpOnly: true, secure: true, sameSite: 'None' },
      { name: 'ct0', value: CT0, domain: '.x.com', path: '/', httpOnly: false, secure: true, sameSite: 'None' }
    ]);

    const page = await context.newPage();
    
    // Navigate to tweet 3/4 to reply
    const replyUrl = `https://x.com/MexicoNecesario/status/${TWEET_3_4_ID}`;
    console.log('1. Navigating to tweet 3/4:', replyUrl);
    await page.goto(replyUrl, { timeout: 30000, waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000);
    
    console.log('2. URL:', page.url());
    
    // Find and click the reply button for the specific tweet
    const replyBtn = await page.$('[data-testid="reply"]');
    if (!replyBtn) {
      console.log('ERROR: No reply button found');
      const body = await page.evaluate(() => document.body.innerText.substring(0, 1000));
      console.log(body);
      await browser.close();
      return;
    }
    
    console.log('3. Clicking reply button...');
    await replyBtn.click();
    await page.waitForTimeout(3000);
    
    // Find the compose textarea
    const textarea = await page.$('[data-testid="tweetTextarea_0"]');
    if (!textarea) {
      console.log('ERROR: No textarea found after clicking reply');
      const body = await page.evaluate(() => document.body.innerText.substring(0, 500));
      console.log(body);
      await browser.close();
      return;
    }
    
    console.log('4. Found textarea, clicking to focus...');
    await textarea.click();
    await page.waitForTimeout(1000);
    
    // Use clipboard approach to paste text (avoids React input issues)
    console.log('5. Setting clipboard and pasting text...');
    await page.evaluate((text) => {
      // Set clipboard via navigator.clipboard (requires permission)
      return navigator.clipboard.writeText(text).catch(() => {
        // Fallback: use execCommand
        const el = document.createElement('textarea');
        el.value = text;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
      });
    }, TWEET_4_4);
    
    await page.waitForTimeout(500);
    
    // Click the textarea and paste
    await textarea.click();
    await page.keyboard.down('Control');
    await page.keyboard.press('KeyV');
    await page.keyboard.up('Control');
    await page.waitForTimeout(2000);
    
    // Check textarea content and button state
    const textareaContent = await page.evaluate(() => {
      const el = document.querySelector('[data-testid="tweetTextarea_0"]');
      return el ? el.innerText : 'NOT FOUND';
    });
    console.log('6. Textarea content:', textareaContent.substring(0, 100));
    
    const btnState = await page.evaluate(() => {
      const btn = document.querySelector('[data-testid="tweetButtonInline"]');
      return btn ? { disabled: btn.getAttribute('aria-disabled'), text: btn.innerText } : 'NOT FOUND';
    });
    console.log('7. Post button state:', JSON.stringify(btnState));
    
    if (btnState === 'NOT FOUND' || btnState.disabled === 'true') {
      console.log('Paste failed or button disabled, trying keyboard type approach...');
      
      // Clear and try typing a few chars first to activate React
      await textarea.click();
      await page.keyboard.press('Control+a');
      await page.keyboard.press('Delete');
      await page.waitForTimeout(500);
      
      // Type the first character to activate React state
      await page.keyboard.type('X', { delay: 100 });
      await page.waitForTimeout(500);
      
      // Now use execCommand insertText trick
      const insertResult = await page.evaluate((text) => {
        const el = document.querySelector('[data-testid="tweetTextarea_0"] [contenteditable="true"]');
        if (!el) return 'NO CONTENTEDITABLE FOUND';
        el.focus();
        // Select all and delete
        document.execCommand('selectAll');
        document.execCommand('delete');
        // Insert text using execCommand
        const result = document.execCommand('insertText', false, text);
        return 'execCommand result: ' + result;
      }, TWEET_4_4);
      console.log('8. execCommand result:', insertResult);
      await page.waitForTimeout(1000);
    }
    
    // Final check
    const finalBtnState = await page.evaluate(() => {
      const btn = document.querySelector('[data-testid="tweetButtonInline"]');
      return btn ? { disabled: btn.getAttribute('aria-disabled'), text: btn.innerText } : 'NOT FOUND';
    });
    console.log('9. Final button state:', JSON.stringify(finalBtnState));
    
    const finalTextarea = await page.evaluate(() => {
      const el = document.querySelector('[data-testid="tweetTextarea_0"]');
      return el ? el.innerText.substring(0, 150) : 'NOT FOUND';
    });
    console.log('10. Final textarea:', finalTextarea);
    
    if (finalBtnState !== 'NOT FOUND' && finalBtnState.disabled !== 'true') {
      console.log('11. Clicking Post button...');
      const postBtn = await page.$('[data-testid="tweetButtonInline"]');
      await postBtn.click();
      await page.waitForTimeout(5000);
      console.log('12. Final URL after posting:', page.url());
      
      // Check if tweet was published by looking for new tweet URL
      const newTweets = await page.$$eval('a[href*="/status/"]', links => 
        [...new Set(links.map(l => l.href).filter(h => h.includes('MexicoNecesario/status/')))].slice(0, 10)
      );
      console.log('13. Tweets after posting:', JSON.stringify(newTweets));
    } else {
      console.log('ERROR: Button still disabled, could not post');
    }
    
    await browser.close();
    console.log('DONE');
  } catch(e) {
    console.error('Error:', e.message);
    console.error(e.stack);
  }
})();
