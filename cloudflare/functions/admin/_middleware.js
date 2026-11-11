// /admin* HTML is a login shell with no visitor data. Data APIs under /api/admin/* check the admin session.
export async function onRequest(context) {
  const res = await context.next();
  const headers = new Headers(res.headers);
  headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  headers.set("Cache-Control", "no-store");
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
}
