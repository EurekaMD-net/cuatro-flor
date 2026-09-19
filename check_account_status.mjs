import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('/root/claude/mission-control/node_modules/playwright');

const AUTH_TOKEN = 'e946f7b29b2c39a2b0fa5ec3b2ed431b11dbc224';
const CT0 = 'f8be2d96816dfb25b9e5e60aa380e8df97a9358af51a4d6b8498432b078267b733f0caa8d0c0824a567f111ab0b7842b226a53c6119c77febcf9b6349b1bbaa71488128f2df2f63cf7496a0a48f49cf2';

(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  });

  await context.addCookies([
    { name: 'auth_token', value: AUTH_TOKEN, domain: '.x.com', path: '/', secure: true, httpOnly: true, sameSite: 'None' },
    { name: 'ct0', value: CT0, domain: '.x.com', path: '/', secure: true, httpOnly: false, sameSite: 'Lax' },
  ]);

  const page = await context.newPage();
  
  // Check account verification status via API
  await page.goto('https://x.com/home', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);

  // Query account settings to see restrictions
  const settingsResult = await page.evaluate(async (ct0) => {
    const resp = await fetch('https://x.com/i/api/1.1/account/settings.json', {
      headers: {
        'Authorization': 'Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA',
        'x-csrf-token': ct0,
        'x-twitter-auth-type': 'OAuth2Session',
        'x-twitter-active-user': 'yes',
      },
      credentials: 'include',
    });
    return { status: resp.status, body: await resp.text() };
  }, CT0);

  console.log(`Settings API Status: ${settingsResult.status}`);
  try {
    const settings = JSON.parse(settingsResult.body);
    console.log('Screen name:', settings.screen_name);
    console.log('Phone number:', settings.phone_number || 'NOT SET');
    console.log('Email:', settings.email || 'NOT SET');
    console.log('Status:', JSON.stringify(settings.protected, null, 2));
    // Full dump for debugging
    console.log('\nFull settings (key fields):');
    const keys = ['screen_name', 'phone_number', 'email', 'protected', 'suspended', 'verified', 'needs_phone_verification'];
    for (const k of keys) {
      if (settings[k] !== undefined) console.log(`  ${k}: ${settings[k]}`);
    }
  } catch {
    console.log('Raw:', settingsResult.body.substring(0, 500));
  }

  // Check compose flow via API to see what restrictions exist
  const composeCheckResult = await page.evaluate(async (ct0) => {
    const resp = await fetch('https://x.com/i/api/graphql/SoVnbfCycZ7fERGCwpZkYA/CreateTweet', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA',
        'x-csrf-token': ct0,
        'x-twitter-auth-type': 'OAuth2Session',
        'x-twitter-active-user': 'yes',
      },
      credentials: 'include',
      body: JSON.stringify({
        variables: { tweet_text: 'test', dark_request: false, media: { media_entities: [], possibly_sensitive: false }, semantic_annotation_ids: [], disallowed_reply_options: null },
        features: { communities_web_enable_tweet_community_results_fetch: true, c9s_tweet_anatomy_moderator_badge_enabled: true, responsive_web_edit_tweet_api_enabled: true, graphql_is_translatable_rweb_tweet_is_translatable_enabled: true, view_counts_everywhere_api_enabled: true, longform_notetweets_consumption_enabled: true, responsive_web_twitter_article_tweet_consumption_enabled: true, tweet_awards_web_tipping_enabled: false, creator_subscriptions_quote_tweet_preview_enabled: false, longform_notetweets_rich_text_read_enabled: true, longform_notetweets_inline_media_enabled: true, articles_preview_enabled: true, rweb_video_timestamps_enabled: true, rweb_tipjar_consumption_enabled: true, responsive_web_graphql_exclude_directive_enabled: true, verified_phone_label_enabled: false, freedom_of_speech_not_reach_fetch_enabled: true, standardized_nudges_misinfo: true, tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: true, responsive_web_graphql_skip_user_profile_image_extensions_enabled: false, responsive_web_graphql_timeline_navigation_enabled: true, responsive_web_enhance_cards_enabled: false },
        fieldToggles: { withArticleRichContentState: true, withArticlePlainText: false },
      }),
    });
    const body = await resp.text();
    return { status: resp.status, body };
  }, CT0);

  console.log(`\nTest tweet status: ${composeCheckResult.status}`);
  const composeData = JSON.parse(composeCheckResult.body);
  if (composeData.errors) {
    console.log('Errors:', JSON.stringify(composeData.errors, null, 2));
  } else {
    console.log('create_tweet response:', JSON.stringify(composeData.data?.create_tweet, null, 2));
  }

  // Take screenshot to see current UI state
  await page.screenshot({ path: '/tmp/x_account_status.png', fullPage: false });
  console.log('\nScreenshot: /tmp/x_account_status.png');

  await browser.close();
})();
