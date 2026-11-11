/* ATO pages v2 config (MT t1684). Flip DB_ENABLED to true once Supabase is live: no page rebuild needed.
   While false: no network calls to any database, reviews/ratings show the empty state, sign-in is off.
   SUPABASE_URL / SUPABASE_ANON_KEY are public values (the anon key is safe in the browser; RLS protects data). Never put a service key here. */
window.WM_ATP = window.WM_ATP || {};
(function (c) {
  c.DB_ENABLED = false;
  c.SUPABASE_URL = '';        // e.g. https://<project>.supabase.co (set when the database exists)
  c.SUPABASE_ANON_KEY = '';   // public anon key only
  c.MANIFEST = 'atp/manifest.json';
  c.MIN_REVIEWS = 3;          // no rating shown under 3 reviews (same as ato-ratings.js)
})(window.WM_ATP);
