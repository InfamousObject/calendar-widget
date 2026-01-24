<?php
/**
 * Shortcode implementations.
 *
 * @package Kentroi
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
	die;
}

/**
 * Handles all shortcode registrations and rendering.
 */
class Kentroi_Shortcodes {

	/**
	 * The API client instance.
	 *
	 * @var Kentroi_API
	 */
	private $api;

	/**
	 * Whether floating chat has been rendered.
	 *
	 * @var bool
	 */
	private static $floating_chat_rendered = false;

	/**
	 * Initialize the class and set its properties.
	 *
	 * @param Kentroi_API $api The API client instance.
	 */
	public function __construct( $api ) {
		$this->api = $api;
	}

	/**
	 * Register all shortcodes.
	 */
	public function register_hooks() {
		add_shortcode( 'kentroi-booking', array( $this, 'render_booking_shortcode' ) );
		add_shortcode( 'kentroi-form', array( $this, 'render_form_shortcode' ) );
		add_shortcode( 'kentroi-chat', array( $this, 'render_chat_shortcode' ) );
	}

	/**
	 * Render the booking widget shortcode.
	 *
	 * Attributes:
	 * - type: Appointment type ID to pre-select
	 * - height: Initial height in pixels (default: 600, ignored if autoresize=true)
	 * - mode: Display mode - 'inline' (default), 'popup', or 'link'
	 * - autoresize: Auto-adjust height to content - 'true' or 'false' (default: true)
	 * - button_text: Text for popup/link button (default: 'Book Appointment')
	 * - button_class: Custom CSS class for the button
	 *
	 * @param array $atts Shortcode attributes.
	 * @return string The shortcode output.
	 */
	public function render_booking_shortcode( $atts ) {
		$atts = shortcode_atts(
			array(
				'type'         => '',
				'height'       => '600',
				'mode'         => 'inline',
				'autoresize'   => 'true',
				'button_text'  => __( 'Book Appointment', 'kentroi-for-wordpress' ),
				'button_class' => '',
			),
			$atts,
			'kentroi-booking'
		);

		$height     = absint( $atts['height'] );
		$mode       = in_array( $atts['mode'], array( 'inline', 'popup', 'link' ), true ) ? $atts['mode'] : 'inline';
		$autoresize = 'true' === $atts['autoresize'];

		if ( $height < 200 ) {
			$height = 200;
		}
		if ( $height > 1500 ) {
			$height = 1500;
		}

		$iframe_url = $this->api->get_booking_embed_url( sanitize_text_field( $atts['type'] ) );

		if ( empty( $iframe_url ) ) {
			return $this->render_error( __( 'Kentroi Widget ID not configured.', 'kentroi-for-wordpress' ) );
		}

		// Link mode - just a button that opens in new tab.
		if ( 'link' === $mode ) {
			return $this->render_booking_link( $iframe_url, $atts['button_text'], $atts['button_class'] );
		}

		// Popup mode - button that opens modal overlay.
		if ( 'popup' === $mode ) {
			return $this->render_booking_popup( $iframe_url, $atts['button_text'], $atts['button_class'] );
		}

		// Check if GDPR consent is required.
		if ( Kentroi_Privacy::is_gdpr_enabled() ) {
			return Kentroi_Privacy::render_consent_placeholder( 'booking', $iframe_url, $height );
		}

		return $this->render_iframe( $iframe_url, $height, 'kentroi-booking-widget', $autoresize );
	}

	/**
	 * Render the form shortcode.
	 *
	 * @param array $atts Shortcode attributes.
	 * @return string The shortcode output.
	 */
	public function render_form_shortcode( $atts ) {
		$atts = shortcode_atts(
			array(
				'id'     => '',
				'height' => '500',
			),
			$atts,
			'kentroi-form'
		);

		if ( empty( $atts['id'] ) ) {
			return $this->render_error( __( 'Form ID is required.', 'kentroi-for-wordpress' ) );
		}

		$height = absint( $atts['height'] );
		if ( $height < 200 ) {
			$height = 200;
		}
		if ( $height > 1500 ) {
			$height = 1500;
		}

		$iframe_url = $this->api->get_form_embed_url( sanitize_text_field( $atts['id'] ) );

		if ( empty( $iframe_url ) ) {
			return $this->render_error( __( 'Invalid form configuration.', 'kentroi-for-wordpress' ) );
		}

		// Check if GDPR consent is required.
		if ( Kentroi_Privacy::is_gdpr_enabled() ) {
			return Kentroi_Privacy::render_consent_placeholder( 'form', $iframe_url, $height );
		}

		return $this->render_iframe( $iframe_url, $height, 'kentroi-form-widget' );
	}

	/**
	 * Render the chat shortcode.
	 *
	 * @param array $atts Shortcode attributes.
	 * @return string The shortcode output.
	 */
	public function render_chat_shortcode( $atts ) {
		$atts = shortcode_atts(
			array(
				'mode'     => 'inline',
				'position' => 'bottom-right',
				'height'   => '500',
			),
			$atts,
			'kentroi-chat'
		);

		$mode     = in_array( $atts['mode'], array( 'inline', 'floating' ), true ) ? $atts['mode'] : 'inline';
		$position = in_array( $atts['position'], array( 'bottom-right', 'bottom-left' ), true ) ? $atts['position'] : 'bottom-right';

		$height = absint( $atts['height'] );
		if ( $height < 200 ) {
			$height = 200;
		}
		if ( $height > 1000 ) {
			$height = 1000;
		}

		$iframe_url = $this->api->get_chat_widget_url( $mode );

		if ( empty( $iframe_url ) ) {
			return $this->render_error( __( 'Kentroi Widget ID not configured.', 'kentroi-for-wordpress' ) );
		}

		// For floating mode, only render once per page.
		if ( 'floating' === $mode ) {
			if ( self::$floating_chat_rendered ) {
				return '';
			}
			self::$floating_chat_rendered = true;

			// Check if GDPR consent is required.
			if ( Kentroi_Privacy::is_gdpr_enabled() ) {
				return $this->render_floating_consent( $iframe_url, $position );
			}

			return $this->render_floating_chat( $iframe_url, $position );
		}

		// Inline mode.
		if ( Kentroi_Privacy::is_gdpr_enabled() ) {
			return Kentroi_Privacy::render_consent_placeholder( 'chat', $iframe_url, $height );
		}

		return $this->render_iframe( $iframe_url, $height, 'kentroi-chat-widget' );
	}

	/**
	 * Render an iframe.
	 *
	 * @param string $url        The iframe URL.
	 * @param int    $height     The iframe height.
	 * @param string $class      Additional CSS class.
	 * @param bool   $autoresize Whether to auto-resize based on content.
	 * @return string The iframe HTML.
	 */
	private function render_iframe( $url, $height, $class = '', $autoresize = false ) {
		$iframe_id = 'kentroi-iframe-' . wp_rand( 1000, 9999 );

		if ( $autoresize ) {
			return sprintf(
				'<div class="kentroi-widget-wrapper %s">
					<iframe id="%s" src="%s" style="width: 100%%; min-height: %dpx; height: %dpx; border: none; overflow: hidden;" loading="lazy" allow="payment" scrolling="no"></iframe>
				</div>
				<script>
				(function() {
					var iframe = document.getElementById("%s");
					window.addEventListener("message", function(e) {
						if (e.data && e.data.type === "kentroi-resize" && e.data.height) {
							iframe.style.height = (e.data.height + 20) + "px";
						}
					});
				})();
				</script>',
				esc_attr( $class ),
				esc_attr( $iframe_id ),
				esc_url( $url ),
				absint( $height ),
				absint( $height ),
				esc_attr( $iframe_id )
			);
		}

		return sprintf(
			'<div class="kentroi-widget-wrapper %s"><iframe src="%s" style="width: 100%%; height: %dpx; border: none;" loading="lazy" allow="payment"></iframe></div>',
			esc_attr( $class ),
			esc_url( $url ),
			absint( $height )
		);
	}

	/**
	 * Render a booking link button.
	 *
	 * @param string $url          The booking URL.
	 * @param string $button_text  The button text.
	 * @param string $button_class Custom CSS class.
	 * @return string The button HTML.
	 */
	private function render_booking_link( $url, $button_text, $button_class = '' ) {
		$class = 'kentroi-booking-button' . ( $button_class ? ' ' . esc_attr( $button_class ) : '' );

		return sprintf(
			'<a href="%s" target="_blank" rel="noopener" class="%s">%s</a>',
			esc_url( $url ),
			esc_attr( $class ),
			esc_html( $button_text )
		);
	}

	/**
	 * Render a booking popup button.
	 *
	 * @param string $url          The booking URL.
	 * @param string $button_text  The button text.
	 * @param string $button_class Custom CSS class.
	 * @return string The popup button and modal HTML.
	 */
	private function render_booking_popup( $url, $button_text, $button_class = '' ) {
		static $popup_id = 0;
		$popup_id++;

		$class    = 'kentroi-booking-button' . ( $button_class ? ' ' . esc_attr( $button_class ) : '' );
		$modal_id = 'kentroi-modal-' . $popup_id;

		return sprintf(
			'<button type="button" class="%s" onclick="document.getElementById(\'%s\').style.display=\'flex\'">%s</button>
			<div id="%s" class="kentroi-modal" style="display:none; position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.7); z-index:99999; justify-content:center; align-items:center; padding:20px;">
				<div class="kentroi-modal-content" style="background:#fff; border-radius:12px; width:100%%; max-width:600px; max-height:90vh; overflow:hidden; position:relative; box-shadow:0 4px 24px rgba(0,0,0,0.3);">
					<button type="button" onclick="document.getElementById(\'%s\').style.display=\'none\'" style="position:absolute; top:10px; right:10px; background:none; border:none; font-size:24px; cursor:pointer; z-index:10; color:#666;">&times;</button>
					<iframe src="%s" style="width:100%%; height:80vh; border:none;" allow="payment"></iframe>
				</div>
			</div>
			<script>
			document.getElementById("%s").addEventListener("click", function(e) {
				if (e.target === this) this.style.display = "none";
			});
			</script>',
			esc_attr( $class ),
			esc_attr( $modal_id ),
			esc_html( $button_text ),
			esc_attr( $modal_id ),
			esc_attr( $modal_id ),
			esc_url( $url ),
			esc_attr( $modal_id )
		);
	}

	/**
	 * Render the floating chat widget.
	 *
	 * @param string $url      The iframe URL.
	 * @param string $position The position (bottom-right or bottom-left).
	 * @return string The floating chat HTML.
	 */
	private function render_floating_chat( $url, $position ) {
		$position_style = 'bottom-right' === $position ? 'right: 20px;' : 'left: 20px;';

		return sprintf(
			'<div class="kentroi-floating-chat" style="position: fixed; bottom: 20px; %s z-index: 9999;">
				<iframe src="%s" style="width: 400px; height: 600px; border: none; border-radius: 12px; box-shadow: 0 4px 24px rgba(0,0,0,0.15);" loading="lazy" allow="payment"></iframe>
			</div>',
			esc_attr( $position_style ),
			esc_url( $url )
		);
	}

	/**
	 * Render the floating consent placeholder.
	 *
	 * @param string $url      The iframe URL.
	 * @param string $position The position.
	 * @return string The consent placeholder HTML.
	 */
	private function render_floating_consent( $url, $position ) {
		$position_style = 'bottom-right' === $position ? 'right: 20px;' : 'left: 20px;';
		$message        = Kentroi_Privacy::get_gdpr_message();

		return sprintf(
			'<div class="kentroi-floating-chat kentroi-consent-placeholder" data-iframe-url="%s" data-position="%s" style="position: fixed; bottom: 20px; %s z-index: 9999; width: 300px; background: #fff; border-radius: 12px; box-shadow: 0 4px 24px rgba(0,0,0,0.15); padding: 20px; text-align: center;">
				<p style="margin: 0 0 15px; color: #666; font-size: 14px;">%s</p>
				<button type="button" class="kentroi-consent-button" style="background: #0073aa; color: #fff; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-size: 14px;">%s</button>
			</div>',
			esc_url( $url ),
			esc_attr( $position ),
			esc_attr( $position_style ),
			esc_html( $message ),
			esc_html__( 'Load Chat', 'kentroi-for-wordpress' )
		);
	}

	/**
	 * Render an error message.
	 *
	 * @param string $message The error message.
	 * @return string The error HTML.
	 */
	private function render_error( $message ) {
		// Only show errors to admins.
		if ( ! current_user_can( 'manage_options' ) ) {
			return '';
		}

		return sprintf(
			'<div class="kentroi-error" style="padding: 15px; background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 4px; color: #721c24;">%s</div>',
			esc_html( $message )
		);
	}
}
