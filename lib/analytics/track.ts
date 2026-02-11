import { event as gtagEvent } from './gtag';

type ConversionEvent =
  | 'sign_up'
  | 'begin_checkout'
  | 'purchase'
  | 'booking_completed'
  | 'form_submitted'
  | 'chatbot_engaged'
  | 'widget_loaded'
  | 'page_view';

export function trackConversion(eventName: ConversionEvent, params?: Record<string, any>): void {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Analytics] ${eventName}`, params);
  }

  // Send to GA4
  gtagEvent(eventName, params ?? {});
}
