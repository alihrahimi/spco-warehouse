/**
 * Best-effort client IP/device extraction for the audit log (Phase 10:
 * "IP (architecture ready), Device (future ready)"). `x-forwarded-for` is
 * only trustworthy behind a reverse proxy that sets it — the VPS
 * deployment (Phase 01) is expected to sit behind one (Nginx/Caddy), so
 * this is read defensively rather than assumed authoritative.
 */
export function extractIpAddress(headers: Headers): string | null {
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    const firstIp = forwardedFor.split(",")[0]?.trim();
    if (firstIp) return firstIp;
  }
  const realIp = headers.get("x-real-ip");
  if (realIp) return realIp;
  return null;
}

export function extractUserAgent(headers: Headers): string | null {
  return headers.get("user-agent");
}
