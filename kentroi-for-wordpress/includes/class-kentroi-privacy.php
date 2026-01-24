<?php
/**
 * Privacy and GDPR handling class.
 *
 * @package Kentroi
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
	die;
}

/**
 * Handles GDPR compliance and privacy policy integration.
 */
class Kentroi_Privacy {

	/**
	 * Register hooks.
	 */
	public function register_hooks() {
		add_action( 'admin_init', array( $this, 'add_privacy_policy_content' ) );
	}

	/**
	 * Add suggested privacy policy content.
	 */
	public function add_privacy_policy_content() {
		if ( ! function_exists( 'wp_add_privacy_policy_content' ) ) {
			return;
		}

		$content = $this->get_privacy_policy_content();
		wp_add_privacy_policy_content( 'Kentroi for WordPress', $content );
	}

	/**
	 * Get the suggested privacy policy content.
	 *
	 * @return string The privacy policy content.
	 */
	private function get_privacy_policy_content() {
		$content = '<h2>' . esc_html__( 'Kentroi Booking & Forms', 'kentroi-for-wordpress' ) . '</h2>';

		$content .= '<p>' . esc_html__( 'This website uses Kentroi, a third-party service, to provide booking widgets, contact forms, and chat functionality.', 'kentroi-for-wordpress' ) . '</p>';

		$content .= '<h3>' . esc_html__( 'What data is collected', 'kentroi-for-wordpress' ) . '</h3>';

		$content .= '<p>' . esc_html__( 'When you use our booking widget, contact form, or chat feature, the following data may be collected by Kentroi:', 'kentroi-for-wordpress' ) . '</p>';

		$content .= '<ul>';
		$content .= '<li>' . esc_html__( 'Name and contact information you provide', 'kentroi-for-wordpress' ) . '</li>';
		$content .= '<li>' . esc_html__( 'Appointment or booking details', 'kentroi-for-wordpress' ) . '</li>';
		$content .= '<li>' . esc_html__( 'Messages sent through contact forms or chat', 'kentroi-for-wordpress' ) . '</li>';
		$content .= '<li>' . esc_html__( 'IP address and browser information', 'kentroi-for-wordpress' ) . '</li>';
		$content .= '</ul>';

		$content .= '<h3>' . esc_html__( 'How the data is used', 'kentroi-for-wordpress' ) . '</h3>';

		$content .= '<p>' . esc_html__( 'This data is processed by Kentroi to:', 'kentroi-for-wordpress' ) . '</p>';

		$content .= '<ul>';
		$content .= '<li>' . esc_html__( 'Schedule and manage appointments', 'kentroi-for-wordpress' ) . '</li>';
		$content .= '<li>' . esc_html__( 'Respond to your inquiries', 'kentroi-for-wordpress' ) . '</li>';
		$content .= '<li>' . esc_html__( 'Send confirmation and reminder emails', 'kentroi-for-wordpress' ) . '</li>';
		$content .= '</ul>';

		$content .= '<h3>' . esc_html__( 'Third-party service', 'kentroi-for-wordpress' ) . '</h3>';

		$content .= '<p>';
		$content .= sprintf(
			/* translators: 1: Privacy policy URL, 2: Terms of service URL */
			esc_html__( 'Kentroi is a third-party service. Please review their %1$s and %2$s for more information about how they handle your data.', 'kentroi-for-wordpress' ),
			'<a href="https://kentroi.com/privacy" target="_blank" rel="noopener noreferrer">' . esc_html__( 'Privacy Policy', 'kentroi-for-wordpress' ) . '</a>',
			'<a href="https://kentroi.com/terms" target="_blank" rel="noopener noreferrer">' . esc_html__( 'Terms of Service', 'kentroi-for-wordpress' ) . '</a>'
		);
		$content .= '</p>';

		$content .= '<h3>' . esc_html__( 'Data storage', 'kentroi-for-wordpress' ) . '</h3>';

		$content .= '<p>' . esc_html__( 'Data collected through Kentroi widgets is stored on Kentroi\'s servers and is not stored in this website\'s database.', 'kentroi-for-wordpress' ) . '</p>';

		return $content;
	}

	/**
	 * Check if GDPR consent is enabled.
	 *
	 * @return bool
	 */
	public static function is_gdpr_enabled() {
		return (bool) get_option( 'kentroi_gdpr_enabled', false );
	}

	/**
	 * Get the GDPR consent message.
	 *
	 * @return string
	 */
	public static function get_gdpr_message() {
		return get_option(
			'kentroi_gdpr_message',
			__( 'Click to load the booking widget. By loading, you agree to our privacy policy.', 'kentroi-for-wordpress' )
		);
	}

	/**
	 * Render the GDPR consent placeholder.
	 *
	 * @param string $type        The widget type (booking, form, chat).
	 * @param string $iframe_url  The iframe URL to load after consent.
	 * @param string $height      The iframe height.
	 * @param array  $extra_attrs Extra attributes for the consent wrapper.
	 * @return string The consent placeholder HTML.
	 */
	public static function render_consent_placeholder( $type, $iframe_url, $height = '600', $extra_attrs = array() ) {
		$message = self::get_gdpr_message();

		$button_text = __( 'Load Widget', 'kentroi-for-wordpress' );
		switch ( $type ) {
			case 'booking':
				$button_text = __( 'Load Booking Widget', 'kentroi-for-wordpress' );
				break;
			case 'form':
				$button_text = __( 'Load Form', 'kentroi-for-wordpress' );
				break;
			case 'chat':
				$button_text = __( 'Load Chat', 'kentroi-for-wordpress' );
				break;
		}

		$attrs_string = '';
		foreach ( $extra_attrs as $key => $value ) {
			$attrs_string .= ' data-' . esc_attr( $key ) . '="' . esc_attr( $value ) . '"';
		}

		$html = sprintf(
			'<div class="kentroi-consent-placeholder kentroi-consent-%1$s" style="min-height: %2$spx; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #f5f5f5; border: 1px solid #ddd; border-radius: 4px; padding: 20px; text-align: center;" data-iframe-url="%3$s" data-height="%2$s"%4$s>
				<p style="margin: 0 0 15px; color: #666;">%5$s</p>
				<button type="button" class="kentroi-consent-button" style="background: #0073aa; color: #fff; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-size: 14px;">%6$s</button>
				<p style="margin: 15px 0 0; font-size: 12px; color: #999;">
					<a href="%7$s" target="_blank" rel="noopener noreferrer">%8$s</a> |
					<a href="%9$s" target="_blank" rel="noopener noreferrer">%10$s</a>
				</p>
			</div>',
			esc_attr( $type ),
			esc_attr( $height ),
			esc_url( $iframe_url ),
			$attrs_string,
			esc_html( $message ),
			esc_html( $button_text ),
			esc_url( 'https://kentroi.com/privacy' ),
			esc_html__( 'Privacy Policy', 'kentroi-for-wordpress' ),
			esc_url( 'https://kentroi.com/terms' ),
			esc_html__( 'Terms of Service', 'kentroi-for-wordpress' )
		);

		return $html;
	}
}
