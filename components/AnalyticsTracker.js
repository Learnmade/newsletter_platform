'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export default function AnalyticsTracker() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const loaded = useRef(false);

    useEffect(() => {
        // Debounce or ensure we only track meaningful changes
        const handleTrack = async () => {
            // Avoid tracking admin or api routes if desired
            if (pathname.startsWith('/admin') || pathname.startsWith('/api')) return;

            try {
                // Get referrer from document if available
                const referrer = document.referrer;

                await fetch('/api/analytics/track', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        path: pathname,
                        referrer: referrer || 'Direct',
                    }),
                });
            } catch (err) {
                // Silently fail for analytics
                console.error('Tracking failed', err);
            }
        };

        handleTrack();
    }, [pathname, searchParams]); // Re-run on route change

    return null; // This component renders nothing
}
