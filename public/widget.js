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
  let isOpen = false;

  // Load widget configuration
  async function loadConfig() {
    try {
      const response = await fetch(`${API_BASE}/api/widget/config?widgetId=${widgetId}`);
      if (!response.ok) throw new Error('Failed to load widget config');
      config = await response.json();
      injectStyles();
      initializeWidget();
    } catch (error) {
      console.error('Kentroi: Failed to load configuration', error);
    }
  }

  // Inject keyframe animations once
  function injectStyles() {
    if (document.getElementById('kentroi-styles')) return;
    const style = document.createElement('style');
    style.id = 'kentroi-styles';
    style.textContent = `
      @keyframes kentroi-slide-up {
        from { opacity: 0; transform: translateY(16px) scale(0.95); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
      @keyframes kentroi-slide-down {
        from { opacity: 1; transform: translateY(0) scale(1); }
        to { opacity: 0; transform: translateY(16px) scale(0.95); }
      }
    `;
    document.head.appendChild(style);
  }

  // Initialize the widget
  function initializeWidget() {
    if (!config) return;
    const delay = (config.behavior?.delaySeconds || 0) * 1000;
    setTimeout(createFloatingButton, delay);
  }

  // Resolve position config
  function getPosition() {
    const pos = config.position?.position || 'bottom-right';
    const ox = config.position?.offsetX || 20;
    const oy = config.position?.offsetY || 20;
    return { pos, ox, oy };
  }

  // Create floating button
  function createFloatingButton() {
    if (!config.behavior?.showOnMobile && window.innerWidth < 768) return;

    const { pos, ox, oy } = getPosition();
    const primaryColor = config.appearance?.primaryColor || '#4F46E5';

    const button = document.createElement('div');
    button.id = 'kentroi-button';

    // Position
    let posCSS = '';
    if (pos === 'bottom-left') posCSS = `bottom:${oy}px;left:${ox}px;`;
    else if (pos === 'top-right') posCSS = `top:${oy}px;right:${ox}px;`;
    else if (pos === 'top-left') posCSS = `top:${oy}px;left:${ox}px;`;
    else posCSS = `bottom:${oy}px;right:${ox}px;`;

    button.style.cssText = `
      position:fixed;${posCSS}
      width:60px;height:60px;border-radius:50%;
      background-color:${primaryColor};color:#fff;
      display:flex;align-items:center;justify-content:center;
      cursor:pointer;border:none;outline:none;
      box-shadow:0 4px 12px rgba(0,0,0,0.15);
      transition:transform 0.2s,box-shadow 0.2s;
      z-index:999999;
      font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
    `;

    button.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
    `;

    button.addEventListener('mouseenter', () => {
      button.style.transform = 'scale(1.1)';
      button.style.boxShadow = '0 6px 16px rgba(0,0,0,0.2)';
    });
    button.addEventListener('mouseleave', () => {
      button.style.transform = 'scale(1)';
      button.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    });

    button.addEventListener('click', toggleWidget);
    document.body.appendChild(button);
  }

  // Toggle open/close
  function toggleWidget() {
    if (isOpen) {
      closeWidget();
    } else {
      openWidget();
    }
  }

  // Open chat panel (anchored to the button corner)
  function openWidget() {
    if (document.getElementById('kentroi-panel')) return;
    isOpen = true;

    const { pos, ox, oy } = getPosition();
    const borderRadius = getBorderRadius();

    // Panel container — anchored near the floating button
    const panel = document.createElement('div');
    panel.id = 'kentroi-panel';

    // Compute position: panel sits above (or below) the button
    const buttonSize = 60;
    const gap = 12;
    let panelPos = '';
    if (pos === 'bottom-right') {
      panelPos = `bottom:${oy + buttonSize + gap}px;right:${ox}px;`;
    } else if (pos === 'bottom-left') {
      panelPos = `bottom:${oy + buttonSize + gap}px;left:${ox}px;`;
    } else if (pos === 'top-right') {
      panelPos = `top:${oy + buttonSize + gap}px;right:${ox}px;`;
    } else {
      panelPos = `top:${oy + buttonSize + gap}px;left:${ox}px;`;
    }

    panel.style.cssText = `
      position:fixed;${panelPos}
      width:400px;height:550px;
      max-width:calc(100vw - 32px);max-height:calc(100vh - ${oy + buttonSize + gap + 16}px);
      border-radius:${borderRadius};
      background:#fff;
      box-shadow:0 8px 30px rgba(0,0,0,0.12),0 2px 8px rgba(0,0,0,0.08);
      overflow:hidden;
      z-index:999998;
      display:flex;flex-direction:column;
      animation:kentroi-slide-up 0.25s ease-out forwards;
      transform-origin:bottom right;
    `;

    // Iframe — loads the chat view directly
    const iframe = document.createElement('iframe');
    iframe.id = 'kentroi-iframe';
    iframe.src = `${API_BASE}/widget/${widgetId}?view=chat`;
    iframe.style.cssText = `
      width:100%;height:100%;border:none;flex:1;
      border-radius:${borderRadius};
    `;

    panel.appendChild(iframe);
    document.body.appendChild(panel);

    // Listen for close messages from the iframe
    window.addEventListener('message', handleMessage);
  }

  // Close chat panel
  function closeWidget() {
    const panel = document.getElementById('kentroi-panel');
    if (panel) {
      panel.style.animation = 'kentroi-slide-down 0.2s ease-in forwards';
      setTimeout(() => { panel.remove(); }, 200);
    }
    isOpen = false;
    window.removeEventListener('message', handleMessage);
  }

  // Handle postMessage from iframe
  function handleMessage(event) {
    if (event.data === 'kentroi:close' || event.data === 'smartwidget:close') {
      closeWidget();
    }
  }

  // Border radius from config
  function getBorderRadius() {
    const br = config.appearance?.borderRadius || 'medium';
    if (br === 'sharp') return '0px';
    if (br === 'rounded') return '24px';
    return '16px';
  }

  // Start
  loadConfig();
})();
