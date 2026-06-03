import { supabase } from '@/lib/supabase';

interface AttributionData {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  gclid: string | null;
  fbclid: string | null;
  timestamp: number;
}

const STORAGE_KEY = 'marketing_attribution';
const EXPIRY_MS = 30 * 24 * 60 * 60 * 1000; // 30 Days

/**
 * Extracts marketing parameters from URL query and stores them in localStorage.
 */
export function captureAttribution() {
  if (typeof window === 'undefined') return;

  try {
    const urlParams = new URLSearchParams(window.location.search);
    const utm_source = urlParams.get('utm_source');
    const utm_medium = urlParams.get('utm_medium');
    const utm_campaign = urlParams.get('utm_campaign');
    const gclid = urlParams.get('gclid');
    const fbclid = urlParams.get('fbclid');

    // Only update if we actually have at least one marketing parameter in the URL
    if (utm_source || utm_medium || utm_campaign || gclid || fbclid) {
      const data: AttributionData = {
        utm_source,
        utm_medium,
        utm_campaign,
        gclid,
        fbclid,
        timestamp: Date.now()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  } catch (error) {
    console.error('Failed to capture marketing attribution:', error);
  }
}

/**
 * Retrieves the stored marketing parameters from localStorage.
 * Ensures the data is within the 30-day window.
 */
export function getStoredAttribution(): Partial<AttributionData> | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const data: AttributionData = JSON.parse(raw);
    const now = Date.now();

    // Check if parameters have expired (older than 30 days)
    if (now - data.timestamp > EXPIRY_MS) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    return {
      utm_source: data.utm_source,
      utm_medium: data.utm_medium,
      utm_campaign: data.utm_campaign,
      gclid: data.gclid,
      fbclid: data.fbclid
    };
  } catch (error) {
    console.error('Failed to get stored marketing attribution:', error);
    return null;
  }
}

/**
 * Helper to extract a cookie value by name.
 */
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }
  return null;
}

/**
 * Retrieves Facebook tracking cookies (_fbp and _fbc).
 */
export function getFacebookCookies() {
  return {
    _fbp: getCookie('_fbp'),
    _fbc: getCookie('_fbc')
  };
}

/**
 * Lightweight visitor tracker that logs high-value milestones in Supabase.
 */
export async function trackEvent(eventType: string, metadata: Record<string, any> = {}) {
  if (typeof window === 'undefined') return;

  try {
    let deviceId = localStorage.getItem('ecommerce_device_id');
    if (!deviceId) {
      // Fallback guest identifier if not checkout device ID
      deviceId = localStorage.getItem('ecommerce_visitor_id');
      if (!deviceId) {
        deviceId = 'GUEST-' + Math.random().toString(36).substring(2, 15).toUpperCase();
        localStorage.setItem('ecommerce_visitor_id', deviceId);
      }
    }

    const { data: { user } } = await supabase.auth.getUser();
    const userAgent = window.navigator.userAgent || '';
    const pageUrl = window.location.pathname + window.location.search;
    const pageTitle = document.title || '';

    // Fetch and cache client IP address to prevent repeatedly calling public API
    let ipAddress = (window as any)._cachedIpAddress || '';
    if (!ipAddress) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 600); // 600ms timeout
        const ipRes = await fetch('https://api.ipify.org?format=json', { signal: controller.signal })
          .then(r => r.json());
        clearTimeout(timeoutId);
        ipAddress = ipRes.ip || '';
        (window as any)._cachedIpAddress = ipAddress;
      } catch (_) {}
    }

    await supabase.from('customer_activity_logs').insert({
      device_id: deviceId,
      user_id: user?.id || null,
      event_type: eventType,
      page_url: pageUrl,
      page_title: pageTitle,
      ip_address: ipAddress || null,
      user_agent: userAgent || null,
      metadata: metadata
    });
  } catch (error) {
    console.error('[Activity Tracking Error]:', error);
  }
}
