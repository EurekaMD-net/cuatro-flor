// Post tweet via X GraphQL API using session cookies
// This bypasses the UI entirely and posts directly via the API

const AUTH_TOKEN = 'e946f7b29b2c39a2b0fa5ec3b2ed431b11dbc224';
const CT0 = 'f8be2d96816dfb25b9e5e60aa380e8df97a9358af51a4d6b8498432b078267b733f0caa8d0c0824a567f111ab0b7842b226a53c6119c77febcf9b6349b1bbaa71488128f2df2f63cf7496a0a48f49cf2';

const TWEET_TEXT = `México necesita voces que no se callen.

Esta cuenta nace para documentar, denunciar y construir — con datos, con memoria y con la fuerza de quienes creen que otro México es posible.

Bienvenidos. El trabajo empieza hoy.

#MéxicoNecesario`;

const GRAPHQL_URL = 'https://x.com/i/api/graphql/SoVnbfCycZ7fERGCwpZkYA/CreateTweet';

const VARIABLES = {
  tweet_text: TWEET_TEXT,
  dark_request: false,
  media: {
    media_entities: [],
    possibly_sensitive: false,
  },
  semantic_annotation_ids: [],
  disallowed_reply_options: null,
};

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

async function postTweet() {
  const body = JSON.stringify({
    variables: VARIABLES,
    features: FEATURES,
    fieldToggles: { withArticleRichContentState: true, withArticlePlainText: false },
  });

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA',
    'x-csrf-token': CT0,
    'Cookie': `auth_token=${AUTH_TOKEN}; ct0=${CT0}`,
    'x-twitter-auth-type': 'OAuth2Session',
    'x-twitter-client-language': 'es',
    'x-twitter-active-user': 'yes',
    'Referer': 'https://x.com/',
    'Origin': 'https://x.com',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  };

  console.log('Posting tweet via GraphQL API...');
  console.log(`Tweet text (${TWEET_TEXT.length} chars):\n${TWEET_TEXT}\n`);

  const response = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers,
    body,
  });

  const responseText = await response.text();
  console.log(`HTTP Status: ${response.status}`);
  
  let data;
  try {
    data = JSON.parse(responseText);
  } catch {
    console.log('Raw response:', responseText.substring(0, 500));
    return;
  }

  // Print full structure to understand the response shape
  console.log('\nFull response (truncated):');
  console.log(JSON.stringify(data, null, 2).substring(0, 2000));
  
  // Try different paths to find tweet ID
  const paths = [
    data?.data?.create_tweet?.tweet_results?.result?.rest_id,
    data?.data?.create_tweet?.tweet_results?.result?.legacy?.id_str,
    data?.data?.create_tweet?.tweet_results?.result?.core?.user_results?.result?.legacy?.id_str,
  ];
  console.log('\nPath search:', paths);
  
  if (response.status === 200 && data?.data) {
    const keys = Object.keys(data.data);
    console.log('\nTop-level data keys:', keys);
  }
}

postTweet().catch(console.error);
