'use client';

import { useEffect, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { captureAttribution, trackEvent } from '@/utils/analytics';
import { supabase } from '@/lib/supabase';

function TrafficTrackerContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Capture marketing attribution parameters on landing/navigation
    captureAttribution();
    
    // Log the page view event in the database
    trackEvent('page_view');

    // Run guest-to-user session merge logic if user is authenticated
    const syncGuestSession = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const deviceId = localStorage.getItem('ecommerce_device_id') || localStorage.getItem('ecommerce_visitor_id');
          if (deviceId) {
            // Update all anonymous logs under this device ID to the authenticated user ID
            await supabase
              .from('customer_activity_logs')
              .update({ user_id: user.id })
              .eq('device_id', deviceId)
              .is('user_id', null);
          }
        }
      } catch (err) {
        console.warn('Failed to sync guest session:', err);
      }
    };

    syncGuestSession();
  }, [pathname, searchParams]);

  return null;
}

export default function TrafficTracker() {
  return (
    <Suspense fallback={null}>
      <TrafficTrackerContent />
    </Suspense>
  );
}
