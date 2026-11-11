// Old hidden ATO review preview API removed (backup/pre-remove-old-ato-review-10nov).
// A tiny 404 stub is required because Pages serves the home page for missing paths.
export async function onRequest() {
  return new Response(JSON.stringify({ error: 'not found' }), {
    status: 404,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-robots-tag': 'noindex'
    }
  });
}
