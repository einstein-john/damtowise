/**
 * Ids of the `<script type="application/json">` blocks that carry the current
 * FYI document's data into the browser.
 *
 * They live in their own module because they are the one contract between the
 * prerender step (which writes the tags) and the client pages (which read
 * them), and neither side should have to import the other to agree on them.
 * `scripts/prerender.mjs` uses the same literals.
 *
 * `fyi-catalog` — posts, tags and work log: seeds the index so a cold load
 * renders real cards instead of a skeleton.
 *
 * `fyi-post` — the article itself, so a cold load of `/fyi/<slug>/` renders the
 * body on the first client pass and hydration matches exactly.
 */
export const ARTICLE_BOOTSTRAP_ID = 'fyi-post';
export const CATALOG_BOOTSTRAP_ID = 'fyi-catalog';
export const CATALOG_POST_BOOTSTRAP_ID = ARTICLE_BOOTSTRAP_ID;
