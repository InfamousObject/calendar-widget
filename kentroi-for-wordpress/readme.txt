=== Kentroi for WordPress ===
Contributors: kentroi
Tags: booking, appointments, calendar, contact form, chatbot
Requires at least: 6.0
Tested up to: 6.7
Requires PHP: 7.4
Stable tag: 1.0.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Embed Kentroi booking widgets, contact forms, and AI chatbots on your WordPress site.

== Description ==

Kentroi for WordPress allows you to easily embed booking widgets, contact forms, and AI-powered chatbots from your Kentroi account onto any WordPress page or post.

= Features =

* **Booking Widget** - Let visitors schedule appointments directly on your website
* **Contact Forms** - Embed customizable contact forms
* **AI Chatbot** - Add an intelligent chatbot to assist your visitors
* **Gutenberg Blocks** - Native block editor support for easy embedding
* **Shortcodes** - Classic editor support with simple shortcodes
* **GDPR Compliant** - Optional consent placeholder before loading widgets

= How It Works =

1. Create a free Kentroi account at [kentroi.com](https://kentroi.com)
2. Set up your booking types, forms, or chatbot in the Kentroi dashboard
3. Install this plugin and enter your Widget ID
4. Use shortcodes or Gutenberg blocks to embed widgets on your pages

= Shortcodes =

**Booking Widget:**
`[kentroi-booking height="600"]`
`[kentroi-booking type="apt_123" height="600"]`

**Contact Form:**
`[kentroi-form id="form_456" height="500"]`

**AI Chatbot:**
`[kentroi-chat mode="inline" height="500"]`
`[kentroi-chat mode="floating" position="bottom-right"]`

= Requirements =

* A Kentroi account (free tier available)
* WordPress 6.0 or higher
* PHP 7.4 or higher

== External Services ==

This plugin connects to Kentroi (kentroi.com), a third-party service, to provide booking, form, and chat functionality.

**What data is transmitted:**

When you use this plugin, the following occurs:

1. **Widget ID Validation** - Your Widget ID is sent to kentroi.com/api/wordpress/validate to verify your account connection
2. **Feature Loading** - Your Widget ID is sent to kentroi.com/api/wordpress/features to retrieve your appointment types and forms for the block editor
3. **Widget Embedding** - Iframes load content from kentroi.com/embed/* and kentroi.com/widget/* URLs

**Visitor Data:**

When visitors interact with embedded widgets:
- Booking information (name, email, appointment details) is collected by Kentroi
- Contact form submissions are processed by Kentroi
- Chat conversations are handled by Kentroi
- IP addresses and browser information may be logged by Kentroi

**Important:** Visitor data is NOT stored in your WordPress database. All data is processed and stored by Kentroi.

**Service Links:**

* [Kentroi Website](https://kentroi.com)
* [Privacy Policy](https://kentroi.com/privacy)
* [Terms of Service](https://kentroi.com/terms)

By using this plugin, you agree to Kentroi's Terms of Service and Privacy Policy.

== Installation ==

1. Upload the `kentroi-for-wordpress` folder to the `/wp-content/plugins/` directory
2. Activate the plugin through the 'Plugins' menu in WordPress
3. Go to **Kentroi > Settings** and enter your Widget ID
4. Use shortcodes or Gutenberg blocks to embed widgets on your pages

= Finding Your Widget ID =

1. Log in to your Kentroi account at [kentroi.com/dashboard](https://kentroi.com/dashboard)
2. Navigate to **Settings > Widget**
3. Copy your Widget ID
4. Paste it in **Kentroi > Settings** in WordPress

== Frequently Asked Questions ==

= Do I need a Kentroi account? =

Yes, you need a Kentroi account to use this plugin. You can create a free account at [kentroi.com](https://kentroi.com).

= Is Kentroi free? =

Kentroi offers a free tier with basic features. Premium plans are available for additional functionality.

= How do I customize the widget appearance? =

Widget appearance is configured in your Kentroi dashboard. The plugin embeds your configured widgets as-is.

= Does this plugin store visitor data? =

No. All visitor data (bookings, form submissions, chat messages) is processed and stored by Kentroi, not in your WordPress database.

= Is this plugin GDPR compliant? =

The plugin includes an optional GDPR consent feature that shows a placeholder with consent message before loading external widgets. Enable this in **Kentroi > Settings**.

= Can I use multiple widgets on one page? =

Yes, you can use multiple booking widgets and forms on the same page. However, only one floating chatbot can be displayed per page.

= Does this work with the Classic Editor? =

Yes, you can use shortcodes with both the Classic Editor and the Block Editor (Gutenberg).

== Screenshots ==

1. Dashboard overview showing connection status
2. Settings page with Widget ID configuration
3. Booking widget shortcode generator
4. Gutenberg block in the editor
5. Booking widget on the frontend
6. GDPR consent placeholder

== Changelog ==

= 1.0.0 =
* Initial release
* Booking widget shortcode and Gutenberg block
* Contact form shortcode and Gutenberg block
* AI chatbot shortcode and Gutenberg block (inline and floating modes)
* GDPR consent placeholder option
* Admin settings page with connection validation
* Privacy policy integration

== Upgrade Notice ==

= 1.0.0 =
Initial release of Kentroi for WordPress.
