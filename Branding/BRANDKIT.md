# Kentroi Brand Kit

> One embed, endless possibilities

---

## Logo

The Kentroi logo features a custom wordmark with an integrated speech bubble in the "o", representing our core focus on conversations and communication.

### Logo Variations

| Variation | Use Case | Background |
|-----------|----------|------------|
| Primary | Default usage | Light/white backgrounds |
| Reversed | Dark contexts | Dark backgrounds |
| On Brand | Marketing materials | Indigo backgrounds |
| Icon Only | Favicon, app icons, small spaces | Any |

### Logo Clear Space

Maintain a minimum clear space around the logo equal to the height of the "k" character. Never place other elements within this zone.

### Minimum Size

- **Digital:** Never smaller than 80px wide
- **Print:** Never smaller than 20mm wide
- For smaller applications, use the icon-only version

### Logo Don'ts

- Never rotate, skew, or distort the logo
- Don't change the logo colors outside of approved variations
- Don't add effects like drop shadows, gradients, or outlines
- Don't separate the speech bubble from the wordmark

---

## Color Palette

A bold, modern palette built around indigo with warm coral accents for energy and approachability.

### Primary Colors

| Color | Hex | RGB | Usage |
|-------|-----|-----|-------|
| **Indigo** | `#4F46E5` | rgb(79, 70, 229) | Primary brand color, buttons, links |
| **Indigo Dark** | `#4338CA` | rgb(67, 56, 202) | Hover states, emphasis |
| **Indigo Light** | `#818CF8` | rgb(129, 140, 248) | Highlights, secondary elements |
| **Indigo 50** | `#EEF2FF` | rgb(238, 242, 255) | Backgrounds, subtle fills |

### Accent Colors

| Color | Hex | RGB | Usage |
|-------|-----|-----|-------|
| **Coral** | `#F97316` | rgb(249, 115, 22) | CTAs, highlights, chat elements |
| **Coral Light** | `#FB923C` | rgb(251, 146, 60) | Hover states, secondary accents |
| **Coral Dark** | `#EA580C` | rgb(234, 88, 12) | Active states, emphasis |
| **Indigo 500** | `#6366F1` | rgb(99, 102, 241) | Supporting accent |

### Neutrals

| Color | Hex | RGB | Usage |
|-------|-----|-----|-------|
| **Indigo 950** | `#1E1B4B` | rgb(30, 27, 75) | Dark text, dark mode backgrounds |
| **Slate 900** | `#0F172A` | rgb(15, 23, 42) | Headings, primary text |
| **Slate 500** | `#64748B` | rgb(100, 116, 139) | Body text, secondary text |
| **Slate 200** | `#E2E8F0` | rgb(226, 232, 240) | Borders, dividers |

### Semantic Colors

| Color | Hex | Usage |
|-------|-----|-------|
| **Success** | `#22C55E` | Confirmations, positive states |
| **Warning** | `#EAB308` | Alerts, caution states |
| **Error** | `#EF4444` | Errors, destructive actions |

### CSS Variables

```css
:root {
  --primary: #4F46E5;
  --primary-dark: #4338CA;
  --primary-light: #818CF8;
  --primary-lighter: #EEF2FF;
  --secondary: #1E1B4B;
  --accent-coral: #F97316;
  --accent-coral-light: #FB923C;
  --accent-coral-dark: #EA580C;
  --accent-violet: #6366F1;
  --success: #22C55E;
  --warning: #EAB308;
  --error: #EF4444;
  --white: #FFFFFF;
  --off-white: #F8FAFC;
  --gray-100: #F1F5F9;
  --gray-200: #E2E8F0;
  --gray-300: #CBD5E1;
  --gray-400: #94A3B8;
  --gray-500: #64748B;
  --gray-600: #475569;
  --gray-700: #334155;
  --gray-800: #1E293B;
  --gray-900: #0F172A;
}
```

---

## Gradients

Approved gradient combinations for backgrounds, buttons, and decorative elements.

| Name | CSS | Usage |
|------|-----|-------|
| **Primary** | `linear-gradient(135deg, #4F46E5 0%, #4338CA 100%)` | Headers, hero sections |
| **Indigo to Coral** | `linear-gradient(135deg, #4F46E5 0%, #F97316 100%)` | Bold CTAs, marketing |
| **Light Blend** | `linear-gradient(135deg, #818CF8 0%, #FB923C 100%)` | Softer applications |
| **Dark Mode** | `linear-gradient(180deg, #1E1B4B 0%, #0F172A 100%)` | Dark backgrounds |

---

## Typography

A modern, geometric type system using Satoshi for headings and Manrope for body text.

### Font Families

| Role | Font | Weights | Source |
|------|------|---------|--------|
| **Headlines** | Satoshi | 400, 500, 700 | [Fontshare](https://www.fontshare.com/fonts/satoshi) |
| **Body / UI** | Manrope | 400, 500, 600, 700 | [Google Fonts](https://fonts.google.com/specimen/Manrope) |

### Font Installation

```html
<!-- Satoshi from Fontshare -->
<link href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700&display=swap" rel="stylesheet">

<!-- Manrope from Google Fonts -->
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&display=swap" rel="stylesheet">
```

```css
/* CSS Usage */
font-family: 'Satoshi', sans-serif;  /* Headlines */
font-family: 'Manrope', sans-serif;  /* Body text */
```

### Type Scale

| Element | Font | Size | Weight | Line Height |
|---------|------|------|--------|-------------|
| H1 | Satoshi | 3.5rem (56px) | 700 | 1.2 |
| H2 | Satoshi | 2rem (32px) | 600 | 1.3 |
| H3 | Satoshi | 1.5rem (24px) | 600 | 1.4 |
| H4 | Satoshi | 1.25rem (20px) | 600 | 1.4 |
| Body | Manrope | 1rem (16px) | 400 | 1.7 |
| Body Small | Manrope | 0.875rem (14px) | 400 | 1.6 |
| Caption | Manrope | 0.75rem (12px) | 500 | 1.5 |
| Button | Manrope | 0.875rem (14px) | 500 | 1 |

---

## Iconography

Custom icons derived from the speech bubble motif. Use consistent 2px stroke width and rounded line caps.

### Recommended Icon Set

Use [Lucide Icons](https://lucide.dev/) or [Heroicons](https://heroicons.com/) for UI consistency.

### Core Icons

- **Chat** — Primary brand icon (speech bubble)
- **Calendar** — Scheduling features
- **User** — Account, profiles
- **Email** — Contact forms
- **Clock** — Time, availability
- **Check** — Confirmations
- **Alert** — Warnings, notifications
- **Search** — Search functionality

### Icon Styling

```css
/* Default icon style */
svg {
  width: 24px;
  height: 24px;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
  fill: none;
}
```

---

## UI Components

### Buttons

**Primary Button**
```css
.btn-primary {
  background: #4F46E5;
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  font-family: 'Manrope', sans-serif;
  font-weight: 500;
  font-size: 0.875rem;
}

.btn-primary:hover {
  background: #4338CA;
}
```

**Secondary/Accent Button**
```css
.btn-secondary {
  background: #F97316;
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  font-family: 'Manrope', sans-serif;
  font-weight: 500;
  font-size: 0.875rem;
}

.btn-secondary:hover {
  background: #EA580C;
}
```

### Border Radius

| Element | Radius |
|---------|--------|
| Buttons | 8px |
| Cards | 12px - 16px |
| Inputs | 6px - 8px |
| Modals | 16px |
| Avatars | 50% (circle) |

### Shadows

```css
/* Subtle shadow for cards */
box-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04);

/* Elevated shadow for modals/dropdowns */
box-shadow: 0 4px 20px rgba(0,0,0,0.15);

/* Focus ring */
box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.3);
```

---

## Spacing

Use a consistent 4px base unit for spacing.

| Token | Value | Usage |
|-------|-------|-------|
| `space-1` | 4px | Tight spacing |
| `space-2` | 8px | Related elements |
| `space-3` | 12px | Default gap |
| `space-4` | 16px | Section padding |
| `space-6` | 24px | Card padding |
| `space-8` | 32px | Section margins |
| `space-12` | 48px | Large sections |
| `space-16` | 64px | Page sections |

---

## Brand Voice

### Tone

- **Confident** — We know our product solves real problems
- **Approachable** — Friendly, not corporate
- **Clear** — Simple language, no jargon
- **Helpful** — Always focused on the user's success

### Writing Guidelines

- Use active voice
- Keep sentences short and scannable
- Lead with benefits, not features
- Address the reader directly ("you" not "users")

### Tagline

> One embed, endless possibilities

### Boilerplate

> Kentroi combines appointment scheduling, contact forms, and AI chat into a single embeddable widget. Capture more leads and convert them while you sleep.

---

## File Naming

- Logo files: `kentroi-logo-[variant].[format]`
- Icons: `kentroi-icon-[size].[format]`
- Social: `kentroi-social-[platform].[format]`

### Recommended Exports

| Asset | Formats | Sizes |
|-------|---------|-------|
| Logo | SVG, PNG | 1x, 2x |
| Favicon | ICO, PNG | 16px, 32px, 180px |
| Social | PNG, JPG | 1200x630 (OG), 1080x1080 (Square) |

---

## Quick Reference

### Primary Brand Colors
- **Indigo:** `#4F46E5`
- **Coral:** `#F97316`

### Fonts
- **Headlines:** Satoshi (700, 600, 500)
- **Body:** Manrope (400, 500, 600)

### Key Links
- Satoshi: https://www.fontshare.com/fonts/satoshi
- Manrope: https://fonts.google.com/specimen/Manrope
- Lucide Icons: https://lucide.dev/

---

*Kentroi Brand Kit • 2025*
