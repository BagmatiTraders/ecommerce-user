'use server';

import crypto from 'crypto';
import { cookies, headers } from 'next/headers';

interface MetaEventData {
  eventName: string;
  eventId: string;
  eventSourceUrl?: string;
  customData?: {
    value?: number;
    currency?: string;
    content_type?: string;
    contents?: Array<{ id: string; quantity: number }>;
    num_items?: number;
    [key: string]: any;
  };
  userData?: {
    email?: string;
    phone?: string;
    fullName?: string;
    firstName?: string;
    lastName?: string;
  };
}

/**
 * Hashing utility function using SHA-256 for Meta user data matching compliance.
 * Values must be trimmed and lowercased before hashing.
 */
function hashValue(value: string | null | undefined): string | null {
  if (!value) return null;
  const cleanValue = value.trim().toLowerCase();
  return crypto.createHash('sha256').update(cleanValue).digest('hex');
}

/**
 * Dispatches a Conversions API (CAPI) event directly from the Next.js server.
 */
export async function sendMetaCapiEvent(params: MetaEventData) {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID || '2453397678476892';
  const accessToken = process.env.META_ACCESS_TOKEN;
  
  if (!accessToken) {
    // Gracefully ignore CAPI if token is not defined yet, avoiding app crashes.
    console.warn('[Meta CAPI] Skipping event dispatch: META_ACCESS_TOKEN is not configured.');
    return { success: false, reason: 'META_ACCESS_TOKEN is not configured' };
  }

  try {
    const cookieStore = await cookies();
    const headersList = await headers();

    const _fbp = cookieStore.get('_fbp')?.value || null;
    const _fbc = cookieStore.get('_fbc')?.value || null;

    // Retrieve client IP from forward-headers
    const clientIp = headersList.get('x-forwarded-for')?.split(',')[0].trim() || 
                     headersList.get('x-real-ip') || 
                     null;
                     
    const userAgent = headersList.get('user-agent') || null;
    const referer = headersList.get('referer') || null;

    // Construct User Data object conforming to Meta specifications
    const userDataPayload: Record<string, any> = {
      client_ip_address: clientIp,
      client_user_agent: userAgent,
      fbp: _fbp,
      fbc: _fbc,
    };

    if (params.userData) {
      if (params.userData.email) {
        userDataPayload.em = [hashValue(params.userData.email)];
      }
      if (params.userData.phone) {
        // Strip non-digit characters to keep E.164 compatible formatting
        const cleanPhone = params.userData.phone.replace(/\D/g, '');
        userDataPayload.ph = [hashValue(cleanPhone)];
      }
      if (params.userData.fullName) {
        const parts = params.userData.fullName.trim().split(/\s+/);
        if (parts.length > 0) {
          userDataPayload.fn = [hashValue(parts[0])]; // First name
        }
        if (parts.length > 1) {
          userDataPayload.ln = [hashValue(parts[parts.length - 1])]; // Last name
        }
      }
      if (params.userData.firstName) {
        userDataPayload.fn = [hashValue(params.userData.firstName)];
      }
      if (params.userData.lastName) {
        userDataPayload.ln = [hashValue(params.userData.lastName)];
      }
    }

    const payload = {
      data: [
        {
          event_name: params.eventName,
          event_time: Math.floor(Date.now() / 1000),
          event_id: params.eventId,
          event_source_url: params.eventSourceUrl || referer || '',
          action_source: 'website',
          user_data: userDataPayload,
          custom_data: params.customData || {},
        }
      ],
      ...(process.env.META_TEST_EVENT_CODE ? { test_event_code: process.env.META_TEST_EVENT_CODE } : {})
    };

    const res = await fetch(`https://graph.facebook.com/v20.0/${pixelId}/events?access_token=${accessToken}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const resData = await res.json();
    if (!res.ok) {
      console.error('[Meta CAPI Request Failed]:', resData);
      return { success: false, error: resData };
    }

    console.log(`[Meta CAPI Success] Event: ${params.eventName}, ID: ${params.eventId}`);
    return { success: true, response: resData };
  } catch (error: any) {
    console.error('[Meta CAPI Exception]:', error);
    return { success: false, error: error.message };
  }
}
