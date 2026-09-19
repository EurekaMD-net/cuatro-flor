const { chromium } = require('/root/claude/mission-control/node_modules/playwright');

const AUTH_TOKEN = 'e946f7b29b2c39a2b0fa5ec3b2ed431b11dbc224';
const CT0 = 'f8be2d96816dfb25b9e5e60aa380e8df97a9358af51a4d6b8498432b078267b733f0caa8d0c0824a567f111ab0b7842b226a53c6119c77febcf9b6349b1bbaa71488128f2df2f63cf7496a0a48f49cf2';
const TWEET_3_4_ID = '2055127497616805930';

const TWEET_4_4 = `\u{1F4CC} Metas concretas:
\u2192 2030: 60% de la poblaci\u00F3n objetivo con Blindaje M\u00E9dico activo
\u2192 2034: Red Nacional de Cuidados operativa

\u00BFQuieres ser parte?
\u{1F4E7} comunidades@mexiconecesario.org.mx
\u{1F310} mexiconecesario.org.mx

#LongevidadActiva #M\u00E9xicoNecesario #AdultosMayores #Econom\u00EDaPlateada

(4/4)`;

(async () => {
  try {
    const browser = await chromium.launch({ 
      headless: true, 
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled']
    });
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });

    await context.addCookies([
      { name: 'auth_token', value: AUTH_TOKEN, domain: '.x.com', path: '/', httpOnly: true, secure: true, sameSite: 'None' },
      { name: 'ct0', value: CT0, domain: '.x.com', path: '/', httpOnly: false, secure: true, sameSite: 'None' }
    ]);

    const page = await context.newPage();
    
    // Intercept network to get the CreateTweet queryId
    let capturedQueryId = null;
    let capturedQueryResult = null;
    
    page.on('request', request => {
      const url = request.url();
      if (url.includes('CreateTweet') || url.includes('create_tweet')) {
        console.log('Intercepted CreateTweet request:', url);
        capturedQueryId = url.match(/graphql\/([^/]+)\/CreateTweet/)?.[1];
      }
    });
    
    page.on('response', async response => {
      const url = response.url();
      if (url.includes('CreateTweet') || url.includes('create_tweet')) {
        try {
          const json = await response.json();
          capturedQueryResult = json;
          console.log('CreateTweet response received');
        } catch(e) {}
      }
    });
    
    // First navigate to home to get a fresh session and potentially capture the queryId from network
    console.log('1. Loading home page to capture queryId...');
    await page.goto('https://x.com/home', { timeout: 30000, waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4000);
    
    // Try to get the queryId by inspecting the page's JS bundles
    console.log('2. Searching for CreateTweet queryId in page JS...');
    const queryId = await page.evaluate(() => {
      // Search through all script tags for the queryId
      const scripts = Array.from(document.querySelectorAll('script'));
      for (const script of scripts) {
        const content = script.textContent || '';
        const match = content.match(/"queryId":"([^"]+)","operationName":"CreateTweet"/);
        if (match) return match[1];
      }
      
      // Also try fetching the main JS bundle
      return null;
    });
    
    console.log('3. QueryId from page:', queryId);
    
    if (!queryId) {
      // Try alternative: use the intent URL approach with submit
      console.log('4. No queryId found. Using intent URL approach...');
      
      // Navigate to compose with reply context
      const intentUrl = `https://x.com/intent/post?in_reply_to=${TWEET_3_4_ID}&text=${encodeURIComponent(TWEET_4_4)}`;
      console.log('5. Intent URL:', intentUrl.substring(0, 100));
      
      await page.goto(intentUrl, { timeout: 30000, waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(5000);
      
      console.log('6. URL after intent:', page.url());
      
      // Check what's in the dialog
      const dialogContent = await page.evaluate(() => {
        // Look for the tweet dialog / compose box
        const contentEditable = document.querySelector('[contenteditable="true"]');
        const textarea = document.querySelector('[data-testid="tweetTextarea_0"]');
        return {
          contentEditable: contentEditable ? contentEditable.innerText.substring(0, 200) : 'NOT FOUND',
          textarea: textarea ? textarea.innerText.substring(0, 200) : 'NOT FOUND',
        };
      });
      console.log('7. Dialog content:', JSON.stringify(dialogContent));
      
      // Try using mouse.click with real coordinates to activate React
      const textareaEl = await page.$('[data-testid="tweetTextarea_0"] [contenteditable="true"]');
      if (textareaEl) {
        const box = await textareaEl.boundingBox();
        console.log('8. Textarea bounding box:', JSON.stringify(box));
        
        if (box) {
          // Click in the center of the textarea
          await page.mouse.click(box.x + box.width/2, box.y + box.height/2);
          await page.waitForTimeout(500);
          
          // Select all existing text and replace
          await page.keyboard.press('Control+a');
          await page.waitForTimeout(200);
          
          // Type char by char with delay
          console.log('9. Typing tweet text...');
          for (const char of TWEET_4_4) {
            await page.keyboard.type(char, { delay: 20 });
          }
          await page.waitForTimeout(2000);
          
          const btnState = await page.evaluate(() => {
            const btn = document.querySelector('[data-testid="tweetButton"]') || 
                        document.querySelector('[data-testid="tweetButtonInline"]');
            return btn ? { disabled: btn.getAttribute('aria-disabled'), text: btn.innerText } : 'NOT FOUND';
          });
          console.log('10. Button state after typing:', JSON.stringify(btnState));
          
          if (btnState !== 'NOT FOUND' && btnState.disabled !== 'true') {
            console.log('11. POSTING TWEET!');
            const btn = await page.$('[data-testid="tweetButton"]') || await page.$('[data-testid="tweetButtonInline"]');
            if (btn) {
              await btn.click();
              await page.waitForTimeout(5000);
              console.log('12. URL after post:', page.url());
            }
          } else {
            // Try the GraphQL API approach directly
            console.log('11. Button disabled, trying direct GraphQL API call...');
            
            // Known queryIds to try (recent ones)
            const queryIds = [
              'SoVnbfCycZ7fERGCwpZkYA',  // 2024 known
              'a1p9tU2xHPSJIZXHlCpZRg',  // alternate
              'oB-5XsHNAbjvARJEc8CZFw',  // another
              'UYy4T67XpYXgDKbqBY9J8g',  // recent 2025
            ];
            
            for (const qId of queryIds) {
              console.log(`Trying queryId: ${qId}`);
              const result = await page.evaluate(async (params) => {
                const { qId, CT0, replyId, text } = params;
                const url = `https://x.com/i/api/graphql/${qId}/CreateTweet`;
                const body = {
                  variables: {
                    tweet_text: text,
                    reply: {
                      in_reply_to_tweet_id: replyId,
                      exclude_reply_user_ids: []
                    },
                    dark_request: false,
                    media: { media_entities: [], possibly_sensitive: false },
                    semantic_annotation_ids: []
                  },
                  features: {
                    communities_web_enable_tweet_community_results_fetch: true,
                    c9s_tweet_anatomy_moderator_badge_enabled: true,
                    responsive_web_edit_tweet_api_enabled: true,
                    graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
                    view_counts_everywhere_api_enabled: true,
                    longform_notetweets_consumption_enabled: true,
                    responsive_web_twitter_article_tweet_consumption_enabled: false,
                    tweet_awards_web_tipping_enabled: false,
                    creator_subscriptions_quote_tweet_preview_enabled: false,
                    longform_notetweets_rich_text_read_enabled: true,
                    longform_notetweets_inline_media_enabled: true,
                    articles_preview_enabled: true,
                    rweb_video_timestamps_enabled: true,
                    rweb_tipjar_consumption_enabled: true,
                    responsive_web_graphql_exclude_directive_enabled: true,
                    verified_phone_label_enabled: false,
                    freedom_of_speech_not_reach_fetch_enabled: true,
                    standardized_nudges_misinfo: true,
                    tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: true,
                    responsive_web_media_download_video_enabled: false,
                    responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
                    responsive_web_graphql_timeline_navigation_enabled: true,
                    responsive_web_enhance_cards_enabled: false
                  },
                  queryId: qId
                };
                
                try {
                  const resp = await fetch(url, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'X-Csrf-Token': CT0,
                      'Authorization': 'Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LTzujSbITwLoMiDA6X',
                      'X-Twitter-Active-User': 'yes',
                      'X-Twitter-Auth-Type': 'OAuth2Session',
                      'Origin': 'https://x.com',
                      'Referer': 'https://x.com/',
                    },
                    credentials: 'include',
                    body: JSON.stringify(body)
                  });
                  
                  const status = resp.status;
                  const text = await resp.text();
                  return { status, body: text.substring(0, 500), queryId: qId };
                } catch(e) {
                  return { error: e.message, queryId: qId };
                }
              }, { qId, CT0, replyId: TWEET_3_4_ID, text: TWEET_4_4 });
              
              console.log(`Result for ${qId}:`, JSON.stringify(result));
              
              if (result.status === 200 && result.body.includes('rest_id')) {
                console.log('SUCCESS! Tweet posted with queryId:', qId);
                break;
              }
            }
          }
        }
      } else {
        console.log('ERROR: No contenteditable found');
        const body = await page.evaluate(() => document.body.innerText.substring(0, 1000));
        console.log(body);
      }
    }
    
    await browser.close();
    console.log('DONE');
  } catch(e) {
    console.error('Error:', e.message);
    console.error(e.stack);
  }
})();
