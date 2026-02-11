'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { grantConsent, denyConsent, GA_MEASUREMENT_ID } from '@/lib/analytics/gtag';

const CONSENT_KEY = 'kentroi-cookie-consent';

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!GA_MEASUREMENT_ID) return;

    const stored = localStorage.getItem(CONSENT_KEY);
    if (stored === null) {
      setVisible(true);
    } else if (stored === 'granted') {
      grantConsent();
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(CONSENT_KEY, 'granted');
    grantConsent();
    setVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem(CONSENT_KEY, 'denied');
    denyConsent();
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
      <div className="mx-auto max-w-xl rounded-lg border border-border bg-background p-4 shadow-lg flex flex-col sm:flex-row items-center gap-4">
        <p className="text-sm text-muted-foreground flex-1">
          We use cookies to analyze traffic and improve your experience.
        </p>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={handleDecline}>
            Decline
          </Button>
          <Button size="sm" onClick={handleAccept}>
            Accept
          </Button>
        </div>
      </div>
    </div>
  );
}
