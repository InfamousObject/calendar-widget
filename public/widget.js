(function() {
  // Prevent multiple initializations
  if (window.KentroiLoaded) return;
  window.KentroiLoaded = true;

  // Get widget ID from script tag
  const scriptTag = document.currentScript || document.querySelector('script[data-widget-id]');
  const widgetId = scriptTag?.getAttribute('data-widget-id');

  if (!widgetId) {
    console.error('Kentroi: Missing data-widget-id attribute');
    return;
  }

  // Configuration
  const API_BASE = scriptTag?.getAttribute('data-api-base') || window.location.origin;
  let config = null;

  // Load widget configuration
  async function loadConfig() {
    try {
      const response = await fetch(`${API_BASE}/api/widget/config?widgetId=${widgetId}`);
      if (!response.ok) throw new Error('Failed to load widget config');
      config = await response.json();
      initializeWidget();
    } catch (error) {
      console.error('Kentroi: Failed to load configuration', error);
    }
  }

  // Initialize the widget
  function initializeWidget() {
    if (!config) return;

    // Apply delay if configured
    const delay = (config.behavior?.delaySeconds || 0) * 1000;
    setTimeout(() => {
      createFloatingButton();
    }, delay);
  }

  // Create floating button
  function createFloatingButton() {
    // Don't show on mobile if disabled
    if (!config.behavior?.showOnMobile && window.innerWidth < 768) return;

    // Create button container
    const button = document.createElement('div');
    button.id = 'kentroi-button';
    button.style.cssText = `
      position: fixed;
      ${getPositionStyles()}
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background-color: ${config.appearance?.primaryColor || '#4F46E5'};
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      transition: transform 0.2s, box-shadow 0.2s;
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    `;

    // Add icon
    button.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
    `;

    // Add hover effect
    button.addEventListener('mouseenter', () => {
      button.style.transform = 'scale(1.1)';
      button.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.2)';
    });

    button.addEventListener('mouseleave', () => {
      button.style.transform = 'scale(1)';
      button.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
    });

    // Open widget on click
    button.addEventListener('click', openWidget);

    document.body.appendChild(button);
  }

  // Get position styles based on config
  function getPositionStyles() {
    const position = config.position?.position || 'bottom-right';
    const offsetX = config.position?.offsetX || 20;
    const offsetY = config.position?.offsetY || 20;

    switch (position) {
      case 'bottom-right':
        return `bottom: ${offsetY}px; right: ${offsetX}px;`;
      case 'bottom-left':
        return `bottom: ${offsetY}px; left: ${offsetX}px;`;
      case 'top-right':
        return `top: ${offsetY}px; right: ${offsetX}px;`;
      case 'top-left':
        return `top: ${offsetY}px; left: ${offsetX}px;`;
      default:
        return `bottom: ${offsetY}px; right: ${offsetX}px;`;
    }
  }

  // Open widget modal
  function openWidget() {
    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.id = 'kentroi-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000000;
      padding: 20px;
      animation: fadeIn 0.2s;
    `;

    // Create modal
    const modal = document.createElement('div');
    modal.id = 'kentroi-modal';
    modal.style.cssText = `
      background-color: white;
      border-radius: ${getBorderRadius()};
      max-width: 500px;
      width: 100%;
      max-height: 90vh;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      animation: slideUp 0.3s;
      display: flex;
      flex-direction: column;
    `;

    // Create iframe for widget content
    const iframe = document.createElement('iframe');
    iframe.id = 'kentroi-iframe';
    iframe.src = `${API_BASE}/widget/${widgetId}`;
    iframe.style.cssText = `
      width: 100%;
      height: 100%;
      border: none;
      flex: 1;
    `;

    modal.appendChild(iframe);
    overlay.appendChild(modal);

    // Close on overlay click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeWidget();
      }
    });

    // Add animations
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes slideUp {
        from { transform: translateY(20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);

    document.body.appendChild(overlay);

    // Listen for close messages from iframe
    window.addEventListener('message', (event) => {
      if (event.data === 'kentroi:close') {
        closeWidget();
      }
    });
  }

  // Close widget modal
  function closeWidget() {
    const overlay = document.getElementById('kentroi-overlay');
    if (overlay) {
      overlay.remove();
    }
  }

  // Get border radius based on config
  function getBorderRadius() {
    const borderRadius = config.appearance?.borderRadius || 'medium';
    switch (borderRadius) {
      case 'sharp':
        return '0px';
      case 'medium':
        return '12px';
      case 'rounded':
        return '24px';
      default:
        return '12px';
    }
  }

  // Start loading
  // Note: widget_loaded conversion is tracked inside the iframe (/widget/[widgetId]) via GA4,
  // not here, since this script runs on the customer's domain.
  loadConfig();
})();
