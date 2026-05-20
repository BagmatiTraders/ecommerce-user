import { supabase } from './supabase';

// ── Session ID ───────────────────────────────────────────────────────────────
// Generates/reuses a stable anonymous session ID stored in localStorage.
// Looks like: guest_8f7d9a3b2c
export function getSessionId(): string {
  if (typeof window === 'undefined') return 'ssr_session';
  const key = 'search_session_id';
  let id = localStorage.getItem(key);
  if (!id) {
    id = 'guest_' + Math.random().toString(36).slice(2, 10);
    localStorage.setItem(key, id);
  }
  return id;
}

// ── Normalize query ──────────────────────────────────────────────────────────
// Mirrors the DB normalize_query() function — keeps them consistent.
export function normalizeQuery(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[-_]+/g, ' ')   // hyphens → spaces
    .replace(/\s+/g, ' ');    // collapse multiple spaces
}

// ── Device detection ─────────────────────────────────────────────────────────
function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop';
  const ua = navigator.userAgent;
  if (/Mobi|Android|iPhone|iPod/i.test(ua)) return 'mobile';
  if (/iPad|Tablet/i.test(ua)) return 'tablet';
  return 'desktop';
}

// ── Log a search event ───────────────────────────────────────────────────────
// Returns a correlation token (session_id + timestamp) so click logs can
// reference the same search without needing a DB-generated id via RETURNING.
export async function logSearch(
  query: string,
  resultsCount: number,
  userId?: string | null
): Promise<string | null> {
  if (!query || query.trim().length < 1) return null;

  const sessionId = getSessionId();
  const normalized = normalizeQuery(query);
  // Client-side correlation token — used to link clicks without needing RETURNING
  const correlationToken = `${sessionId}_${Date.now()}`;

  const { error } = await supabase.from('search_logs').insert({
    user_id: userId || null,
    session_id: sessionId,
    query: query.trim(),
    normalized_query: normalized,
    results_count: resultsCount,
    device_type: getDeviceType(),
  });

  if (error) {
    console.warn('[SearchTracking] Failed to log search:', error.message);
    return null;
  }
  // Return the correlation token (not a DB id) — safe without RETURNING clause
  return correlationToken;
}

// ── Log a product click from search ─────────────────────────────────────────
export async function logProductClick(opts: {
  productId: string;
  productName: string;
  query: string;
  searchLogId?: string | null;  // kept in signature for API compat, not sent to DB
  userId?: string | null;
}): Promise<void> {
  const sessionId = getSessionId();
  const normalized = normalizeQuery(opts.query);

  // Note: search_log_id is BIGINT — we omit it here and correlate via session_id
  const { error } = await supabase.from('product_click_logs').insert({
    user_id: opts.userId || null,
    session_id: sessionId,
    product_id: opts.productId,
    product_name: opts.productName,
    query: opts.query,
    normalized_query: normalized,
  });

  if (error) {
    console.warn('[SearchTracking] Failed to log click:', error.message);
  }
}

// ── Log add-to-cart ──────────────────────────────────────────────────────────
export async function logCartAdd(opts: {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  source?: string;
  searchQuery?: string;
  userId?: string | null;
}): Promise<void> {
  const sessionId = getSessionId();

  const { error } = await supabase.from('cart_logs').insert({
    user_id: opts.userId || null,
    session_id: sessionId,
    product_id: opts.productId,
    product_name: opts.productName,
    quantity: opts.quantity,
    price: opts.price,
    source: opts.source || 'browse',
    search_query: opts.searchQuery || null,
  });

  if (error) {
    console.warn('[SearchTracking] Failed to log cart add:', error.message);
  }
}
