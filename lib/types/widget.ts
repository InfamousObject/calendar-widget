/**
 * Widget configuration and initialization types
 */

export interface WidgetConfig {
  widgetId: string;
  appearance: {
    primaryColor: string;
    backgroundColor: string;
    textColor: string;
    borderRadius: 'sharp' | 'medium' | 'rounded';
    fontFamily: string;
  };
  position: {
    location: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
    offsetX: number;
    offsetY: number;
  };
  behavior: {
    showOnMobile: boolean;
    delaySeconds: number;
  };
  branding?: {
    logoUrl?: string;
    businessName?: string;
  };
}

export interface WidgetInitOptions {
  widgetId: string;
  debug?: boolean;
}
