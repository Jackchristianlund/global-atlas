/**
 * Conflicts with a share page of their own (dist/c/<id>/), so a shared link
 * previews with the conflict's title and image instead of the front page.
 * The images live in public/og/<id>.jpg (scripts/build-og.mjs).
 */
export const SHARE_CONFLICTS: readonly string[] = ['ukr', 'iran', 'gaza', 'lbn', 'sdn', 'mmr', 'cod', 'yem', 'syr', 'sahel', 'som', 'eth'];
