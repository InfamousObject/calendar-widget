/**
 * Kentroi Embed SDK
 * Shadow DOM inline widgets for booking and contact forms.
 * Usage:
 *   <div data-kentroi-type="booking" data-widget-id="WIDGET_ID"></div>
 *   <div data-kentroi-type="form" data-form-id="FORM_ID"></div>
 *   <script src="https://www.kentroi.com/embed.js" async></script>
 */
(function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // Auto-detect API base from the <script> src that loaded this file
  // ---------------------------------------------------------------------------
  var SCRIPT = document.currentScript;
  var API_BASE = SCRIPT ? new URL(SCRIPT.src).origin : '';

  // ---------------------------------------------------------------------------
  // Load fonts into the main document (fonts penetrate Shadow DOM boundaries)
  // ---------------------------------------------------------------------------
  if (!document.querySelector('link[data-kentroi-fonts]')) {
    var fontLink = document.createElement('link');
    fontLink.rel = 'stylesheet';
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap';
    fontLink.setAttribute('data-kentroi-fonts', 'true');
    document.head.appendChild(fontLink);
  }

  // ---------------------------------------------------------------------------
  // DOM helper — creates an element with attributes and optional children
  // ---------------------------------------------------------------------------
  function el(tag, attrs, children) {
    var element = document.createElement(tag);
    if (attrs) {
      var keys = Object.keys(attrs);
      for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        var value = attrs[key];
        if (key === 'className') { element.className = value; }
        else if (key === 'textContent') { element.textContent = value; }
        else if (key.indexOf('on') === 0 && typeof value === 'function') {
          element.addEventListener(key.slice(2).toLowerCase(), value);
        } else if (key === 'style' && typeof value === 'object') {
          Object.assign(element.style, value);
        } else {
          element.setAttribute(key, value);
        }
      }
    }
    if (children != null) {
      if (Array.isArray(children)) {
        for (var j = 0; j < children.length; j++) {
          if (children[j]) {
            element.appendChild(
              typeof children[j] === 'string'
                ? document.createTextNode(children[j])
                : children[j]
            );
          }
        }
      } else if (typeof children === 'string') {
        element.textContent = children;
      } else {
        element.appendChild(children);
      }
    }
    return element;
  }

  // ---------------------------------------------------------------------------
  // SVG icon helper (no innerHTML — uses createElementNS)
  // ---------------------------------------------------------------------------
  function svgIcon(pathData, size, color) {
    var ns = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('width', String(size || 24));
    svg.setAttribute('height', String(size || 24));
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', color || 'currentColor');
    svg.setAttribute('stroke-width', '2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    for (var i = 0; i < pathData.length; i++) {
      var p = document.createElementNS(ns, 'path');
      p.setAttribute('d', pathData[i]);
      svg.appendChild(p);
    }
    return svg;
  }

  function iconArrowLeft() { return svgIcon(['M19 12H5', 'M12 19l-7-7 7-7'], 16); }
  function iconCheck(size, color) { return svgIcon(['M20 6L9 17l-5-5'], size || 32, color); }
  function iconCalendar(size, color) {
    return svgIcon([
      'M8 2v4', 'M16 2v4',
      'M3 10h18',
      'M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z'
    ], size || 20, color);
  }

  // ---------------------------------------------------------------------------
  // Date utility functions
  // ---------------------------------------------------------------------------
  function startOfDay(d) {
    var r = new Date(d);
    r.setHours(0, 0, 0, 0);
    return r;
  }

  function addDays(d, n) {
    var r = new Date(d);
    r.setDate(r.getDate() + n);
    return r;
  }

  function formatDate(d) {
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + day;
  }

  var DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var MONTH_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  function getDayShort(d) { return DAY_SHORT[d.getDay()]; }
  function getMonthShort(d) { return MONTH_SHORT[d.getMonth()]; }

  function formatDisplayDate(d) {
    if (!d) return '';
    return MONTH_LONG[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
  }

  // ---------------------------------------------------------------------------
  // Styles (injected into each Shadow DOM root)
  // ---------------------------------------------------------------------------
  function getBaseStyles() {
    return [
      /* Reset */
      ':host{display:block}',
      '*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}',

      /* Root */
      '.kr{font-family:"Space Grotesk",system-ui,-apple-system,sans-serif;color:#111827;line-height:1.5;-webkit-font-smoothing:antialiased;font-size:16px}',

      /* Card */
      '.kr-card{background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden}',
      '.kr-card-hd{padding:24px 24px 0}',
      '.kr-card-bd{padding:24px}',
      '.kr-title{font-size:20px;font-weight:600;color:#111827}',
      '.kr-desc{font-size:14px;color:#6b7280;margin-top:4px}',
      '.kr-hdr{display:flex;align-items:center;gap:12px}',

      /* Heading */
      '.kr-h{font-size:16px;font-weight:600;color:#111827;margin-bottom:16px}',

      /* Buttons */
      '.kr-btn{display:inline-flex;align-items:center;justify-content:center;font-family:inherit;font-size:14px;font-weight:500;line-height:1;border-radius:8px;padding:10px 16px;cursor:pointer;transition:all 150ms ease;border:none;outline:none;text-decoration:none}',
      '.kr-btn:focus-visible{outline:2px solid #4F46E5;outline-offset:2px}',
      '.kr-btn:disabled{opacity:.5;cursor:not-allowed}',
      '.kr-btn-p{background:#4F46E5;color:#fff}',
      '.kr-btn-p:hover:not(:disabled){background:#4338CA}',
      '.kr-btn-o{background:#fff;color:#111827;border:1px solid #e5e7eb}',
      '.kr-btn-o:hover:not(:disabled){background:#f9fafb;border-color:#d1d5db}',
      '.kr-btn-o.active{background:#4F46E5;color:#fff;border-color:#4F46E5}',
      '.kr-btn-g{background:transparent;color:#6b7280;padding:8px;border:none;cursor:pointer;border-radius:8px;display:inline-flex;align-items:center;justify-content:center}',
      '.kr-btn-g:hover{background:#f3f4f6;color:#111827}',
      '.kr-btn-f{width:100%}',

      /* Form elements */
      '.kr-inp,.kr-ta,.kr-sel{display:block;width:100%;font-family:inherit;font-size:14px;padding:10px 12px;border:1px solid #e5e7eb;border-radius:8px;background:#fff;color:#111827;transition:border-color 150ms ease;outline:none}',
      '.kr-inp:focus,.kr-ta:focus,.kr-sel:focus{border-color:#4F46E5;box-shadow:0 0 0 3px rgba(79,70,229,.1)}',
      '.kr-inp::placeholder,.kr-ta::placeholder{color:#9ca3af}',
      '.kr-ta{resize:vertical;min-height:80px}',
      '.kr-lbl{display:block;font-size:14px;font-weight:500;color:#374151;margin-bottom:6px}',
      '.kr-req{color:#ef4444;margin-left:2px}',
      '.kr-fld{margin-bottom:16px}',
      '.kr-cb-wrap{display:flex;align-items:center;gap:8px;margin-bottom:16px}',
      '.kr-cb{width:18px;height:18px;accent-color:#4F46E5;cursor:pointer}',

      /* Date grid */
      '.kr-dg{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}',
      '@media(max-width:400px){.kr-dg{grid-template-columns:repeat(3,1fr)}}',
      '.kr-db{display:flex;flex-direction:column;align-items:center;padding:12px 8px;border:1px solid #e5e7eb;border-radius:8px;background:#fff;cursor:pointer;transition:all 150ms ease;font-family:inherit}',
      '.kr-db:hover{border-color:#4F46E5;background:#f5f3ff}',
      '.kr-db.active{background:#4F46E5;color:#fff;border-color:#4F46E5}',
      '.kr-db .dn{font-size:12px;font-weight:500;text-transform:uppercase;letter-spacing:.5px}',
      '.kr-db .dd{font-size:20px;font-weight:700;line-height:1.2}',
      '.kr-db .dm{font-size:12px}',

      /* Time grid */
      '.kr-tg{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}',
      '@media(max-width:400px){.kr-tg{grid-template-columns:repeat(2,1fr)}}',
      '.kr-tb{padding:10px;border:1px solid #e5e7eb;border-radius:8px;background:#fff;cursor:pointer;font-family:inherit;font-size:14px;font-weight:500;transition:all 150ms ease;text-align:center}',
      '.kr-tb:hover{border-color:#4F46E5;background:#f5f3ff}',
      '.kr-tb.active{background:#4F46E5;color:#fff;border-color:#4F46E5}',

      /* Type cards */
      '.kr-tc{padding:16px;border:1px solid #e5e7eb;border-radius:8px;cursor:pointer;transition:all 150ms ease;margin-bottom:8px}',
      '.kr-tc:hover{border-color:#4F46E5;box-shadow:0 2px 8px rgba(79,70,229,.1)}',
      '.kr-tc:last-child{margin-bottom:0}',
      '.kr-tn{display:flex;align-items:center;gap:8px;font-size:16px;font-weight:600}',
      '.kr-td{width:10px;height:10px;border-radius:50%;flex-shrink:0}',
      '.kr-tdesc{font-size:14px;color:#6b7280;margin-top:4px}',
      '.kr-tdur{font-size:13px;color:#9ca3af;margin-top:8px}',

      /* Loading */
      '.kr-ld{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:48px 24px;min-height:200px}',
      '.kr-sp{width:32px;height:32px;border:3px solid #e5e7eb;border-top-color:#4F46E5;border-radius:50%;animation:kr-spin .6s linear infinite}',
      '@keyframes kr-spin{to{transform:rotate(360deg)}}',
      '.kr-lt{margin-top:12px;font-size:14px;color:#6b7280}',

      /* Success */
      '.kr-ok{text-align:center;padding:32px 24px}',
      '.kr-ok-ic{width:64px;height:64px;border-radius:50%;background:#ecfdf5;display:flex;align-items:center;justify-content:center;margin:0 auto 16px}',
      '.kr-ok-t{font-size:20px;font-weight:700;margin-bottom:8px}',
      '.kr-ok-d{font-size:14px;color:#6b7280;margin-bottom:4px}',

      /* Error / Alert */
      '.kr-err{text-align:center;padding:32px 24px;color:#991b1b}',
      '.kr-err-t{font-size:14px;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:12px 16px;color:#991b1b}',
      '.kr-alert{font-size:13px;color:#fff;background:#ef4444;border-radius:8px;padding:10px 14px;margin-bottom:16px;animation:kr-fade 200ms ease}',

      /* Fade animation */
      '.kr-fi{animation:kr-fade 200ms ease}',
      '@keyframes kr-fade{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}',
    ].join('\n');
  }

  // =========================================================================
  // KentroiBooking — Multi-step booking flow in Shadow DOM
  // =========================================================================
  function KentroiBooking(container, widgetId, appointmentTypeId) {
    this.container = container;
    this.widgetId = widgetId;
    this.preselectedTypeId = appointmentTypeId || null;
    this.shadow = container.attachShadow({ mode: 'open' });
    this.state = {
      step: 'loading', // loading | error | select-type | select-date | select-time | details | success
      config: null,
      selectedType: null,
      selectedDate: null,
      selectedSlot: null,
      availableSlots: [],
      loadingSlots: false,
      submitting: false,
      formData: { name: '', email: '', phone: '', notes: '' },
      customFieldData: {},
      error: null,
      validationError: null,
    };
    this._init();
  }

  KentroiBooking.prototype._init = async function () {
    // Styles
    var styleEl = document.createElement('style');
    styleEl.textContent = getBaseStyles();
    this.shadow.appendChild(styleEl);

    // Root wrapper
    this.root = el('div', { className: 'kr' });
    this.shadow.appendChild(this.root);

    // Fetch config
    try {
      var resp = await fetch(API_BASE + '/api/embed/booking/' + this.widgetId);
      if (!resp.ok) throw new Error('Failed to load booking configuration');
      this.state.config = await resp.json();

      if (this.preselectedTypeId) {
        var match = this.state.config.appointmentTypes.find(function (t) { return t.id === this.preselectedTypeId; }.bind(this));
        if (match) {
          this.state.selectedType = match;
          this.state.step = 'select-date';
        } else {
          this.state.step = 'select-type';
        }
      } else if (this.state.config.appointmentTypes.length === 1) {
        this.state.selectedType = this.state.config.appointmentTypes[0];
        this.state.step = 'select-date';
      } else {
        this.state.step = 'select-type';
      }
    } catch (e) {
      this.state.error = e.message || 'Failed to load booking widget';
      this.state.step = 'error';
    }

    this._render();
  };

  KentroiBooking.prototype._render = function () {
    // Preserve nothing — full re-render (values stored in state)
    while (this.root.firstChild) this.root.removeChild(this.root.firstChild);

    var card = el('div', { className: 'kr-card kr-fi' });

    switch (this.state.step) {
      case 'loading':  card.appendChild(this._loading('Loading booking options...')); break;
      case 'error':    card.appendChild(this._error()); break;
      case 'select-type':
        card.appendChild(this._header(false));
        card.appendChild(this._selectType());
        break;
      case 'select-date':
        card.appendChild(this._header(true));
        card.appendChild(this._selectDate());
        break;
      case 'select-time':
        card.appendChild(this._header(true));
        card.appendChild(this._selectTime());
        break;
      case 'details':
        card.appendChild(this._header(true));
        card.appendChild(this._details());
        break;
      case 'success':
        card.appendChild(this._success());
        break;
    }

    this.root.appendChild(card);
  };

  // --- Shared renderers ---

  KentroiBooking.prototype._loading = function (text) {
    var wrap = el('div', { className: 'kr-ld' });
    wrap.appendChild(el('div', { className: 'kr-sp' }));
    wrap.appendChild(el('div', { className: 'kr-lt', textContent: text }));
    return wrap;
  };

  KentroiBooking.prototype._error = function () {
    var wrap = el('div', { className: 'kr-err' });
    wrap.appendChild(el('div', { className: 'kr-err-t', textContent: this.state.error || 'Something went wrong.' }));
    return wrap;
  };

  KentroiBooking.prototype._header = function (showBack) {
    var self = this;
    var hd = el('div', { className: 'kr-card-hd' });
    var row = el('div', { className: 'kr-hdr' });

    if (showBack) {
      var back = el('button', {
        className: 'kr-btn-g',
        'aria-label': 'Go back',
        onClick: function () { self._goBack(); },
      });
      back.appendChild(iconArrowLeft());
      row.appendChild(back);
    }

    var block = el('div');
    block.appendChild(el('div', { className: 'kr-title', textContent: 'Book with ' + this.state.config.businessName }));
    if (this.state.selectedType && this.state.step !== 'select-type') {
      block.appendChild(el('div', { className: 'kr-desc', textContent: this.state.selectedType.name + ' (' + this.state.selectedType.duration + ' min)' }));
    }
    row.appendChild(block);
    hd.appendChild(row);
    return hd;
  };

  KentroiBooking.prototype._validationAlert = function (parent) {
    if (this.state.validationError) {
      parent.appendChild(el('div', { className: 'kr-alert', textContent: this.state.validationError }));
    }
  };

  // --- Step: Select Type ---

  KentroiBooking.prototype._selectType = function () {
    var self = this;
    var bd = el('div', { className: 'kr-card-bd kr-fi' });
    bd.appendChild(el('h3', { className: 'kr-h', textContent: 'Select appointment type' }));

    this.state.config.appointmentTypes.forEach(function (type) {
      var tc = el('div', {
        className: 'kr-tc',
        onClick: function () {
          self.state.selectedType = type;
          self.state.step = 'select-date';
          self._render();
        },
      });

      // Name row with color dot
      var nameRow = el('div', { className: 'kr-tn' });
      var dot = el('span', { className: 'kr-td' });
      dot.style.backgroundColor = type.color || '#4F46E5';
      nameRow.appendChild(dot);
      nameRow.appendChild(document.createTextNode(type.name));
      tc.appendChild(nameRow);

      if (type.description) {
        tc.appendChild(el('div', { className: 'kr-tdesc', textContent: type.description }));
      }
      // Duration and price row
      var infoText = type.duration + ' minutes';
      if (type.requirePayment && type.price) {
        var priceStr = new Intl.NumberFormat('en-US', { style: 'currency', currency: (type.currency || 'usd').toUpperCase() }).format(type.price / 100);
        infoText += ' · ' + priceStr;
        if (type.depositPercent) infoText += ' (' + type.depositPercent + '% deposit)';
      } else {
        infoText += ' · Free';
      }
      tc.appendChild(el('div', { className: 'kr-tdur', textContent: infoText }));
      bd.appendChild(tc);
    });

    return bd;
  };

  // --- Step: Select Date ---

  KentroiBooking.prototype._selectDate = function () {
    var self = this;
    var bd = el('div', { className: 'kr-card-bd kr-fi' });
    bd.appendChild(el('h3', { className: 'kr-h', textContent: 'Select a date' }));

    var days = (this.state.config.bookingSettings && this.state.config.bookingSettings.widgetDaysToDisplay) || 4;
    var grid = el('div', { className: 'kr-dg' });
    var today = startOfDay(new Date());

    for (var i = 0; i < days; i++) {
      (function (date) {
        var isActive = self.state.selectedDate && formatDate(date) === formatDate(self.state.selectedDate);
        var btn = el('button', {
          className: 'kr-db' + (isActive ? ' active' : ''),
          onClick: function () {
            self.state.selectedDate = date;
            self.state.selectedSlot = null;
            self.state.step = 'select-time';
            self._render();
            self._fetchSlots(date);
          },
        });
        btn.appendChild(el('span', { className: 'dn', textContent: getDayShort(date) }));
        btn.appendChild(el('span', { className: 'dd', textContent: String(date.getDate()) }));
        btn.appendChild(el('span', { className: 'dm', textContent: getMonthShort(date) }));
        grid.appendChild(btn);
      })(addDays(today, i));
    }

    bd.appendChild(grid);
    return bd;
  };

  // --- Step: Select Time ---

  KentroiBooking.prototype._selectTime = function () {
    var self = this;
    var bd = el('div', { className: 'kr-card-bd kr-fi' });
    bd.appendChild(el('h3', { className: 'kr-h', textContent: 'Select a time on ' + formatDisplayDate(this.state.selectedDate) }));

    if (this.state.loadingSlots) {
      bd.appendChild(this._loading('Loading available times...'));
    } else if (this.state.availableSlots.length === 0) {
      bd.appendChild(el('p', {
        style: { color: '#6b7280', fontSize: '14px', textAlign: 'center', padding: '24px 0' },
        textContent: 'No available times for this date. Please try another date.',
      }));
    } else {
      var grid = el('div', { className: 'kr-tg' });
      this.state.availableSlots.forEach(function (slot) {
        var isActive = self.state.selectedSlot && self.state.selectedSlot.start === slot.start;
        var btn = el('button', {
          className: 'kr-tb' + (isActive ? ' active' : ''),
          textContent: slot.startLocal,
          onClick: function () {
            self.state.selectedSlot = slot;
            self.state.step = 'details';
            self._render();
          },
        });
        grid.appendChild(btn);
      });
      bd.appendChild(grid);
    }

    return bd;
  };

  // --- Step: Details ---

  KentroiBooking.prototype._details = function () {
    var self = this;
    var bd = el('div', { className: 'kr-card-bd kr-fi' });

    this._validationAlert(bd);

    bd.appendChild(el('h3', { className: 'kr-h', textContent: 'Your information' }));

    // Standard fields
    bd.appendChild(this._inputField('name', 'Name', 'text', 'Your name', true, this.state.formData));
    bd.appendChild(this._inputField('email', 'Email', 'email', 'your@email.com', true, this.state.formData));

    if (this.state.config.bookingSettings && this.state.config.bookingSettings.requirePhone) {
      bd.appendChild(this._inputField('phone', 'Phone', 'tel', '(555) 123-4567', true, this.state.formData));
    }

    // Custom fields
    var customFields = this.state.config.customFields || [];
    for (var i = 0; i < customFields.length; i++) {
      bd.appendChild(this._customField(customFields[i], this.state.customFieldData));
    }

    // Notes
    if (!this.state.config.bookingSettings || this.state.config.bookingSettings.showNotes !== false) {
      bd.appendChild(this._textareaField('notes', 'Notes', 'Any special requests?', false, this.state.formData));
    }

    // TODO: hCaptcha integration — server-side rate limiting provides baseline protection

    // Payment notice for paid appointments
    var type = this.state.selectedType;
    var requiresPayment = type && type.requirePayment && type.price;
    if (requiresPayment) {
      var priceStr = new Intl.NumberFormat('en-US', { style: 'currency', currency: (type.currency || 'usd').toUpperCase() }).format(type.price / 100);
      var payNotice = el('div', { className: 'kr-pay-notice', style: { padding: '12px', borderRadius: '8px', backgroundColor: 'rgba(79,70,229,0.08)', marginBottom: '12px', fontSize: '14px' } });
      payNotice.appendChild(el('div', { style: { fontWeight: '600', marginBottom: '4px' }, textContent: 'Payment Required' }));
      var payText = priceStr;
      if (type.depositPercent) payText += ' (' + type.depositPercent + '% deposit)';
      payNotice.appendChild(el('div', { style: { color: '#6b7280' }, textContent: payText + ' — You will be redirected to complete payment.' }));
      bd.appendChild(payNotice);
    }

    // Submit
    var submitBtn = el('button', {
      className: 'kr-btn kr-btn-p kr-btn-f',
      textContent: self.state.submitting ? 'Processing...' : (requiresPayment ? 'Continue to Payment' : 'Confirm Booking'),
      onClick: function () { self._submit(); },
    });
    if (self.state.submitting) submitBtn.disabled = true;
    bd.appendChild(submitBtn);

    return bd;
  };

  // --- Step: Success ---

  KentroiBooking.prototype._success = function () {
    var wrap = el('div', { className: 'kr-ok kr-fi' });

    var ic = el('div', { className: 'kr-ok-ic' });
    ic.appendChild(iconCheck(32, '#10b981'));
    wrap.appendChild(ic);

    wrap.appendChild(el('h3', { className: 'kr-ok-t', textContent: 'Appointment Confirmed!' }));

    var typeName = this.state.selectedType ? this.state.selectedType.name : 'Your';
    var dateStr = formatDisplayDate(this.state.selectedDate);
    var timeStr = this.state.selectedSlot ? this.state.selectedSlot.startLocal : '';
    wrap.appendChild(el('p', { className: 'kr-ok-d', textContent: 'Your ' + typeName + ' appointment is scheduled for ' + dateStr + ' at ' + timeStr + '.' }));
    wrap.appendChild(el('p', { className: 'kr-ok-d', textContent: 'A confirmation email has been sent to ' + this.state.formData.email + '.' }));

    return wrap;
  };

  // --- Navigation ---

  KentroiBooking.prototype._goBack = function () {
    this.state.validationError = null;
    switch (this.state.step) {
      case 'select-date':
        if (this.preselectedTypeId || (this.state.config && this.state.config.appointmentTypes.length === 1)) return;
        this.state.step = 'select-type';
        this.state.selectedType = null;
        break;
      case 'select-time':
        this.state.step = 'select-date';
        this.state.selectedSlot = null;
        break;
      case 'details':
        this.state.step = 'select-time';
        break;
    }
    this._render();
  };

  // --- API: Fetch Slots ---

  KentroiBooking.prototype._fetchSlots = async function (date) {
    this.state.loadingSlots = true;
    this._render();

    try {
      var dateStr = formatDate(date);
      var sd = startOfDay(date).toISOString();
      var ed = addDays(startOfDay(date), 1).toISOString();

      var resp = await fetch(
        API_BASE + '/api/availability/slots?widgetId=' + this.widgetId +
        '&appointmentTypeId=' + this.state.selectedType.id +
        '&startDate=' + encodeURIComponent(sd) +
        '&endDate=' + encodeURIComponent(ed)
      );

      if (!resp.ok) throw new Error('Failed to fetch availability');
      var data = await resp.json();
      var daySlots = data.slots ? data.slots.find(function (s) { return s.date === dateStr; }) : null;

      this.state.availableSlots = daySlots
        ? daySlots.slots.filter(function (s) { return s.available; })
        : [];
    } catch (e) {
      this.state.availableSlots = [];
    } finally {
      this.state.loadingSlots = false;
      this._render();
    }
  };

  // --- API: Submit Booking ---

  KentroiBooking.prototype._submit = async function () {
    if (this.state.submitting) return;

    var fd = this.state.formData;
    var cfd = this.state.customFieldData;
    var cfg = this.state.config;

    // Validation
    if (!fd.name || !fd.name.trim()) { this._showError('Please enter your name'); return; }
    if (!fd.email || !fd.email.trim()) { this._showError('Please enter your email address'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fd.email)) { this._showError('Please enter a valid email address'); return; }
    if (cfg.bookingSettings && cfg.bookingSettings.requirePhone && (!fd.phone || !fd.phone.trim())) {
      this._showError('Please enter your phone number'); return;
    }

    var customFields = cfg.customFields || [];
    var missing = customFields.filter(function (f) { return f.required && !cfd[f.id]; });
    if (missing.length > 0) {
      this._showError('Please fill in: ' + missing.map(function (f) { return f.label; }).join(', '));
      return;
    }

    // For paid appointments, redirect to the full booking page which has Stripe payment
    var selectedType = this.state.selectedType;
    if (selectedType && selectedType.requirePayment && selectedType.price) {
      var bookUrl = API_BASE + '/book/' + this.widgetId + '?appointmentTypeId=' + selectedType.id;
      window.open(bookUrl, '_blank');
      return;
    }

    this.state.submitting = true;
    this.state.validationError = null;
    this._render();

    try {
      var body = {
        widgetId: this.widgetId,
        appointmentTypeId: selectedType.id,
        startTime: this.state.selectedSlot.start,
        visitorName: fd.name,
        visitorEmail: fd.email,
        visitorPhone: fd.phone || undefined,
        notes: fd.notes || undefined,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };
      if (Object.keys(cfd).length > 0) body.formResponses = cfd;

      var resp = await fetch(API_BASE + '/api/appointments/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (resp.ok) {
        this.state.step = 'success';
      } else {
        var err = await resp.json().catch(function () { return {}; });
        this._showError(err.error || 'Failed to book appointment');
      }
    } catch (e) {
      this._showError('Failed to book appointment. Please try again.');
    } finally {
      this.state.submitting = false;
      this._render();
    }
  };

  KentroiBooking.prototype._showError = function (msg) {
    var self = this;
    this.state.validationError = msg;
    this._render();
    setTimeout(function () {
      if (self.state.validationError === msg) {
        self.state.validationError = null;
        self._render();
      }
    }, 5000);
  };

  // --- Field builders (shared by Booking & Form) ---

  KentroiBooking.prototype._inputField = function (name, label, type, placeholder, required, store) {
    var fld = el('div', { className: 'kr-fld' });
    var lbl = el('label', { className: 'kr-lbl', textContent: label });
    if (required) lbl.appendChild(el('span', { className: 'kr-req', textContent: ' *' }));
    fld.appendChild(lbl);

    var inp = el('input', { className: 'kr-inp', type: type, placeholder: placeholder });
    inp.value = store[name] || '';
    inp.addEventListener('input', function (e) { store[name] = e.target.value; });
    fld.appendChild(inp);
    return fld;
  };

  KentroiBooking.prototype._textareaField = function (name, label, placeholder, required, store) {
    var fld = el('div', { className: 'kr-fld' });
    var lbl = el('label', { className: 'kr-lbl', textContent: label });
    if (required) lbl.appendChild(el('span', { className: 'kr-req', textContent: ' *' }));
    fld.appendChild(lbl);

    var ta = el('textarea', { className: 'kr-ta', placeholder: placeholder });
    ta.value = store[name] || '';
    ta.addEventListener('input', function (e) { store[name] = e.target.value; });
    fld.appendChild(ta);
    return fld;
  };

  KentroiBooking.prototype._customField = function (field, store) {
    var fld;
    var val = store[field.id] || '';

    switch (field.fieldType) {
      case 'text': case 'email': case 'phone': case 'number': case 'url': {
        fld = el('div', { className: 'kr-fld' });
        var lbl = el('label', { className: 'kr-lbl', textContent: field.label });
        if (field.required) lbl.appendChild(el('span', { className: 'kr-req', textContent: ' *' }));
        fld.appendChild(lbl);
        var inp = el('input', {
          className: 'kr-inp',
          type: field.fieldType === 'phone' ? 'tel' : field.fieldType,
          placeholder: field.placeholder || field.label,
        });
        inp.value = val;
        inp.addEventListener('input', function (e) { store[field.id] = e.target.value; });
        fld.appendChild(inp);
        break;
      }
      case 'textarea': {
        fld = el('div', { className: 'kr-fld' });
        var lbl2 = el('label', { className: 'kr-lbl', textContent: field.label });
        if (field.required) lbl2.appendChild(el('span', { className: 'kr-req', textContent: ' *' }));
        fld.appendChild(lbl2);
        var ta = el('textarea', { className: 'kr-ta', placeholder: field.placeholder || field.label });
        ta.value = val;
        ta.addEventListener('input', function (e) { store[field.id] = e.target.value; });
        fld.appendChild(ta);
        break;
      }
      case 'select': case 'dropdown': {
        fld = el('div', { className: 'kr-fld' });
        var lbl3 = el('label', { className: 'kr-lbl', textContent: field.label });
        if (field.required) lbl3.appendChild(el('span', { className: 'kr-req', textContent: ' *' }));
        fld.appendChild(lbl3);
        var sel = el('select', { className: 'kr-sel' });
        var defOpt = el('option', { value: '', textContent: 'Select ' + field.label.toLowerCase() });
        sel.appendChild(defOpt);
        if (field.options) {
          field.options.forEach(function (opt) {
            var o = el('option', { value: opt, textContent: opt });
            if (val === opt) o.selected = true;
            sel.appendChild(o);
          });
        }
        sel.addEventListener('change', function (e) { store[field.id] = e.target.value; });
        fld.appendChild(sel);
        break;
      }
      case 'checkbox': {
        fld = el('div', { className: 'kr-cb-wrap' });
        var cb = el('input', { className: 'kr-cb', type: 'checkbox' });
        cb.checked = !!val;
        cb.addEventListener('change', function (e) { store[field.id] = e.target.checked; });
        fld.appendChild(cb);
        var lbl4 = el('label', { className: 'kr-lbl', style: { marginBottom: '0', cursor: 'pointer' } });
        lbl4.textContent = field.label;
        if (field.required) lbl4.appendChild(el('span', { className: 'kr-req', textContent: ' *' }));
        lbl4.addEventListener('click', function () { cb.checked = !cb.checked; store[field.id] = cb.checked; });
        fld.appendChild(lbl4);
        break;
      }
      default:
        fld = el('div');
    }

    return fld;
  };


  // =========================================================================
  // KentroiForm — Contact form in Shadow DOM
  // =========================================================================
  function KentroiForm(container, formId) {
    this.container = container;
    this.formId = formId;
    this.shadow = container.attachShadow({ mode: 'open' });
    this.state = {
      step: 'loading', // loading | error | form | success
      config: null,
      formData: {},
      submitting: false,
      error: null,
      validationError: null,
    };
    this._init();
  }

  KentroiForm.prototype._init = async function () {
    var styleEl = document.createElement('style');
    styleEl.textContent = getBaseStyles();
    this.shadow.appendChild(styleEl);

    this.root = el('div', { className: 'kr' });
    this.shadow.appendChild(this.root);

    try {
      var resp = await fetch(API_BASE + '/api/embed/form/' + this.formId);
      if (!resp.ok) throw new Error('Failed to load form');
      this.state.config = await resp.json();
      // Normalise fields — could be stringified JSON in some edge cases
      if (typeof this.state.config.fields === 'string') {
        this.state.config.fields = JSON.parse(this.state.config.fields);
      }
      if (typeof this.state.config.settings === 'string') {
        this.state.config.settings = JSON.parse(this.state.config.settings);
      }
      this.state.step = 'form';
    } catch (e) {
      this.state.error = e.message || 'Failed to load form';
      this.state.step = 'error';
    }

    this._render();
  };

  KentroiForm.prototype._render = function () {
    while (this.root.firstChild) this.root.removeChild(this.root.firstChild);

    var card = el('div', { className: 'kr-card kr-fi' });

    switch (this.state.step) {
      case 'loading':
        card.appendChild(this._loading('Loading form...'));
        break;
      case 'error':
        card.appendChild(this._error());
        break;
      case 'form':
        card.appendChild(this._formContent());
        break;
      case 'success':
        card.appendChild(this._success());
        break;
    }

    this.root.appendChild(card);
  };

  // Reuse loading / error renderers from KentroiBooking
  KentroiForm.prototype._loading = KentroiBooking.prototype._loading;
  KentroiForm.prototype._error = function () {
    var wrap = el('div', { className: 'kr-err' });
    wrap.appendChild(el('div', { className: 'kr-err-t', textContent: this.state.error || 'Something went wrong.' }));
    return wrap;
  };

  KentroiForm.prototype._formContent = function () {
    var self = this;
    var frag = document.createDocumentFragment();

    // Header
    var hd = el('div', { className: 'kr-card-hd' });
    hd.appendChild(el('div', { className: 'kr-title', textContent: this.state.config.name }));
    if (this.state.config.description) {
      hd.appendChild(el('div', { className: 'kr-desc', textContent: this.state.config.description }));
    }
    frag.appendChild(hd);

    // Body
    var bd = el('div', { className: 'kr-card-bd' });

    // Validation alert
    if (this.state.validationError) {
      bd.appendChild(el('div', { className: 'kr-alert', textContent: this.state.validationError }));
    }

    // Fields
    var fields = this.state.config.fields || [];
    for (var i = 0; i < fields.length; i++) {
      bd.appendChild(this._field(fields[i]));
    }

    // Submit
    var btn = el('button', {
      className: 'kr-btn kr-btn-p kr-btn-f',
      textContent: self.state.submitting ? 'Submitting...' : 'Submit',
      onClick: function () { self._submitForm(); },
    });
    if (self.state.submitting) btn.disabled = true;
    bd.appendChild(btn);

    frag.appendChild(bd);
    return frag;
  };

  KentroiForm.prototype._field = function (field) {
    // Reuse the booking custom field builder
    return KentroiBooking.prototype._customField.call(this, field, this.state.formData);
  };

  KentroiForm.prototype._success = function () {
    var self = this;
    var wrap = el('div', { className: 'kr-ok kr-fi' });

    var ic = el('div', { className: 'kr-ok-ic' });
    ic.appendChild(iconCheck(32, '#10b981'));
    wrap.appendChild(ic);

    wrap.appendChild(el('h3', { className: 'kr-ok-t', textContent: 'Success!' }));

    var settings = this.state.config.settings || {};
    wrap.appendChild(el('p', { className: 'kr-ok-d', textContent: settings.successMessage || 'Thank you for your submission!' }));

    var resetBtn = el('button', {
      className: 'kr-btn kr-btn-o',
      style: { marginTop: '16px' },
      textContent: 'Submit Another Response',
      onClick: function () {
        self.state.formData = {};
        self.state.step = 'form';
        self._render();
      },
    });
    wrap.appendChild(resetBtn);

    return wrap;
  };

  KentroiForm.prototype._submitForm = async function () {
    if (this.state.submitting) return;

    var fields = this.state.config.fields || [];
    var missing = fields.filter(function (f) { return f.required && !this.state.formData[f.id]; }.bind(this));
    if (missing.length > 0) {
      this._showError('Please fill in: ' + missing.map(function (f) { return f.label; }).join(', '));
      return;
    }

    this.state.submitting = true;
    this.state.validationError = null;
    this._render();

    try {
      var resp = await fetch(API_BASE + '/api/forms/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formId: this.state.config.id,
          data: this.state.formData,
        }),
      });

      if (resp.ok) {
        this.state.step = 'success';
      } else {
        var err = await resp.json().catch(function () { return {}; });
        this._showError(err.error || 'Failed to submit form');
      }
    } catch (e) {
      this._showError('Failed to submit form. Please try again.');
    } finally {
      this.state.submitting = false;
      this._render();
    }
  };

  KentroiForm.prototype._showError = function (msg) {
    var self = this;
    this.state.validationError = msg;
    this._render();
    setTimeout(function () {
      if (self.state.validationError === msg) {
        self.state.validationError = null;
        self._render();
      }
    }, 5000);
  };


  // =========================================================================
  // Auto-initialization
  // =========================================================================
  function initEmbeds() {
    // Booking widgets
    var bookings = document.querySelectorAll('[data-kentroi-type="booking"]:not([data-kentroi-initialized])');
    for (var i = 0; i < bookings.length; i++) {
      var el_ = bookings[i];
      el_.setAttribute('data-kentroi-initialized', 'true');
      new KentroiBooking(el_, el_.getAttribute('data-widget-id'), el_.getAttribute('data-appointment-type'));
    }

    // Contact forms
    var forms = document.querySelectorAll('[data-kentroi-type="form"]:not([data-kentroi-initialized])');
    for (var j = 0; j < forms.length; j++) {
      var el2 = forms[j];
      el2.setAttribute('data-kentroi-initialized', 'true');
      new KentroiForm(el2, el2.getAttribute('data-form-id'));
    }
  }

  // Run on DOMContentLoaded or immediately if already loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEmbeds);
  } else {
    initEmbeds();
  }
})();
