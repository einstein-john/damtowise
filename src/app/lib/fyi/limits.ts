/**
 * Field limits the FYI API enforces.
 *
 * Mirrored from `damtowiseFyi/src/contracts/schemas/post.ts` so the editor can
 * show a live counter and say so before a PATCH is rejected. These are the only
 * reason the numbers appear twice; the API stays the authority, and a mismatch
 * surfaces as a 422 rather than silently truncated content.
 */

export const EXCERPT_MAX_LENGTH = 300;
export const SEO_TITLE_MAX_LENGTH = 70;
export const SEO_DESCRIPTION_MAX_LENGTH = 180;
export const POST_TITLE_MAX_LENGTH = 200;
export const CONTENT_MAX_LENGTH = 400_000;
export const MAX_TAGS_PER_POST = 20;

/** Largest multipart upload the API accepts before it reads the body. */
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
