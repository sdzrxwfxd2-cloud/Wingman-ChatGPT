// Netlify Blobs does not exist on Cloudflare. The snapshot engine only calls getStore() inside try/catch (and the Worker passes
// its own KV-backed store), so this stub makes any stray call fail fast instead of bundling the Netlify client.
export function getStore() { throw new Error("Netlify Blobs is not available on Cloudflare (use the KV store)"); }
