// Post tweet via fetch() from inside Playwright browser context
// This uses the real browser cookies and bypasses CORS/VPS IP issues

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
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 900 },
  });

  await context.addCookies([
    { name: 'auth_token', value: AUTH_TOKEN, domain: '.x.com', path: '/', secure: true, httpOnly: true, sameSite: 'None' },
    { name: 'ct0', value: CT0, domain: '.x.com', path: '/', secure: true, httpOnly: false, sameSite: 'Lax' },
  ]);

  const page = await context.newPage();

  console.log('Loading x.com to establish session...');
  await page.goto('https://x.com/home', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);

  const url = page.url();
  console.log(`Current URL: ${url}`);
  
  if (url.includes('login')) {
    console.log('ERROR: Session not active — cookies expired');
    await browser.close();
    process.exit(1);
  }

  // Get current cookies from the browser context (X may have refreshed them)
  const cookies = await context.cookies('https://x.com');
  const ct0Cookie = cookies.find(c => c.name === 'ct0');
  const authCookie = cookies.find(c => c.name === 'auth_token');
  console.log(`auth_token present: ${!!authCookie}`);
  console.log(`ct0 present: ${!!ct0Cookie}`);
  const activeCT0 = ct0Cookie?.value || CT0;

  console.log('\nPosting tweet via fetch() from browser context...');
  
  const result = await page.evaluate(async ({ tweetText, ct0, guestToken }) => {
    const GRAPHQL_URL = 'https://x.com/i/api/graphql/SoVnbfCycZ7fERGCwpZkYA/CreateTweet';
    
    const body = JSON.stringify({
      variables: {
        tweet_text: tweetText,
        dark_request: false,
        media: { media_entities: [], possibly_sensitive: false },
        semantic_annotation_ids: [],
        disallowed_reply_options: null,
      },
      features: {
        communities_web_enable_tweet_community_results_fetch: true,
        c9s_tweet_anatomy_moderator_badge_enabled: true,
        responsive_web_edit_tweet_api_enabled: true,
        graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
        view_counts_everywhere_api_enabled: true,
        longform_notetweets_consumption_enabled: true,
        responsive_web_twitter_article_tweet_consumption_enabled: true,
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
        responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
        responsive_web_graphql_timeline_navigation_enabled: true,
        responsive_web_enhance_cards_enabled: false,
      },
      fieldToggles: { withArticleRichContentState: true, withArticlePlainText: false },
    });

    const resp = await fetch(GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA',
        'x-csrf-token': ct0,
        'x-twitter-auth-type': 'OAuth2Session',
        'x-twitter-client-language': 'es',
        'x-twitter-active-user': 'yes',
      },
      credentials: 'include', // sends cookies automatically from browser context
      body,
    });

    const text = await resp.text();
    return { status: resp.status, body: text };
  }, { tweetText: TWEET_TEXT, ct0: activeCT0 });

  console.log(`HTTP Status: ${result.status}`);
  
  let data;
  try {
    data = JSON.parse(result.body);
  } catch {
    console.log('Raw response:', result.body.substring(0, 500));
    await browser.close();
    return;
  }

  console.log('Response:', JSON.stringify(data, null, 2).substring(0, 2000));

  // Find tweet ID in response
  const tweetResult = data?.data?.create_tweet?.tweet_results?.result;
  const tweetId = tweetResult?.rest_id || tweetResult?.legacy?.id_str;
  
  if (result.status === 200 && tweetId) {
    console.log(`\n✅ TWEET PUBLISHED!`);
    console.log(`Tweet URL: https://x.com/MexicoNecesario/status/${tweetId}`);
  } else if (result.status === 200 && data?.data?.create_tweet) {
    console.log('\n⚠️  Status 200 but tweet_results empty — possible account restriction');
    console.log('Full data.create_tweet:', JSON.stringify(data.data.create_tweet, null, 2));
  } else {
    console.log('\n❌ Tweet failed');
    if (data?.errors) {
      console.log('Errors:', JSON.stringify(data.errors, null, 2));
    }
  }

  await browser.close();
})();
