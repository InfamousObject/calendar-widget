export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

// https://developers.google.com/analytics/devguides/collection/gtagjs/pages
export function pageview(url: string): void {
  if (!GA_MEASUREMENT_ID) return;
  window.gtag('event', 'page_view', {
    page_path: url,
  });
}

// https://developers.google.com/analytics/devguides/collection/gtagjs/events
export function event(action: string, params: Record<string, any>): void {
  if (!GA_MEASUREMENT_ID) return;
  window.gtag('event', action, params);
}

// Grant analytics consent
export function grantConsent(): void {
  if (!GA_MEASUREMENT_ID) return;
  window.gtag('consent', 'update', {
    analytics_storage: 'granted',
  });
}

// Deny analytics consent
export function denyConsent(): void {
  if (!GA_MEASUREMENT_ID) return;
  window.gtag('consent', 'update', {
    analytics_storage: 'denied',
  });
}

// Extend Window interface for gtag
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}
