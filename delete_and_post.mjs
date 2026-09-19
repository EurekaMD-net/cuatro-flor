import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('/root/claude/mission-control/node_modules/playwright');

const AUTH_TOKEN = 'e946f7b29b2c39a2b0fa5ec3b2ed431b11dbc224';
const CT0 = 'f8be2d96816dfb25b9e5e60aa380e8df97a9358af51a4d6b8498432b078267b733f0caa8d0c0824a567f111ab0b7842b226a53c6119c77febcf9b6349b1bbaa71488128f2df2f63cf7496a0a48f49cf2';

const TEST_TWEET_ID = '2055120972043194384';

const INAUGURAL_TWEET = `México necesita voces que no se callen.

Esta cuenta nace para documentar, denunciar y construir — con datos, con memoria y con la fuerza de quienes creen que otro México es posible.

Bienvenidos. El trabajo empieza hoy.

#MéxicoNecesario`;

const FEATURES = {
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
};

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
  await page.goto('https://x.com/home', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2000);

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA',
    'x-csrf-token': CT0,
    'x-twitter-auth-type': 'OAuth2Session',
    'x-twitter-active-user': 'yes',
    'x-twitter-client-language': 'es',
  };

  // Step 1: Delete the test tweet
  console.log(`Deleting test tweet ${TEST_TWEET_ID}...`);
  const deleteResult = await page.evaluate(async ({ tweetId, ct0, hdrs }) => {
    const resp = await fetch('https://x.com/i/api/graphql/VaenaVgh5q5ih7kvyVjgtg/DeleteTweet', {
      method: 'POST',
      headers: { ...hdrs, 'x-csrf-token': ct0 },
      credentials: 'include',
      body: JSON.stringify({
        variables: { tweet_id: tweetId, dark_request: false },
        queryId: 'VaenaVgh5q5ih7kvyVjgtg',
      }),
    });
    return { status: resp.status, body: await resp.text() };
  }, { tweetId: TEST_TWEET_ID, ct0: CT0, hdrs: headers });

  console.log(`Delete status: ${deleteResult.status}`);
  const deleteData = JSON.parse(deleteResult.body);
  console.log('Delete result:', JSON.stringify(deleteData, null, 2).substring(0, 300));

  // Step 2: Post the inaugural tweet
  console.log('\nPosting inaugural tweet...');
  const postResult = await page.evaluate(async ({ tweetText, ct0, features, hdrs }) => {
    const resp = await fetch('https://x.com/i/api/graphql/SoVnbfCycZ7fERGCwpZkYA/CreateTweet', {
      method: 'POST',
      headers: { ...hdrs, 'x-csrf-token': ct0 },
      credentials: 'include',
      body: JSON.stringify({
        variables: {
          tweet_text: tweetText,
          dark_request: false,
          media: { media_entities: [], possibly_sensitive: false },
          semantic_annotation_ids: [],
          disallowed_reply_options: null,
        },
        features,
        fieldToggles: { withArticleRichContentState: true, withArticlePlainText: false },
      }),
    });
    return { status: resp.status, body: await resp.text() };
  }, { tweetText: INAUGURAL_TWEET, ct0: CT0, features: FEATURES, hdrs: headers });

  console.log(`Post status: ${postResult.status}`);
  const postData = JSON.parse(postResult.body);
  const tweetResult = postData?.data?.create_tweet?.tweet_results?.result;
  const tweetId = tweetResult?.rest_id;
  const fullText = tweetResult?.legacy?.full_text;

  if (tweetId) {
    console.log('\n✅ INAUGURAL TWEET PUBLISHED!');
    console.log(`Tweet ID: ${tweetId}`);
    console.log(`URL: https://x.com/MexicoNecesario/status/${tweetId}`);
    console.log(`Text preview: ${fullText?.substring(0, 80)}...`);
  } else {
    console.log('\n❌ Failed to post inaugural tweet:');
    console.log(JSON.stringify(postData, null, 2).substring(0, 1000));
  }

  await browser.close();
})();
