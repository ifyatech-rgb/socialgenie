/**
 * D-ID API Basic auth helper.
 * D-ID expects: Authorization: Basic <base64-encoded-credential>
 *
 * Supports:
 * - Single string (no colon): use as-is after "Basic " (key is already the base64 part).
 * - Contains colon: base64-encode the ENTIRE key and send as Basic. This works for:
 *   - base64(email):apiSecret (format from D-ID dashboard)
 *   - email:password (plain email and API password)
 */

function toBasicAuth(credential: string): string {
  return `Basic ${Buffer.from(credential, "utf8").toString("base64")}`;
}

/**
 * Returns the Authorization header value for D-ID API, or null if DID_API_KEY is not set.
 */
export function getDIDAuthHeader(): string | null {
  const key = process.env.DID_API_KEY?.trim();
  if (!key) return null;
  // Single token (no colon) = already the value to use after "Basic "
  if (!key.includes(":")) return `Basic ${key}`;
  // "base64(email):apiSecret" or "email:password" → base64-encode the whole string
  return toBasicAuth(key);
}
