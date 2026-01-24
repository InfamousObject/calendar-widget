<?php
/**
 * The public-facing functionality of the plugin.
 *
 * @package Kentroi
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
	die;
}

/**
 * The public-facing functionality of the plugin.
 */
class Kentroi_Public {

	/**
	 * The API client instance.
	 *
	 * @var Kentroi_API
	 */
	private $api;

	/**
	 * Whether floating chat has been added.
	 *
	 * @var bool
	 */
	private $floating_chat_added = false;

	/**
	 * Initialize the class and set its properties.
	 *
	 * @param Kentroi_API $api The API client instance.
	 */
	public function __construct( $api ) {
		$this->api = $api;
	}

	/**
	 * Register all hooks for the public-facing side.
	 */
	public function register_hooks() {
		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_styles' ) );
		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_scripts' ) );
	}

	/**
	 * Enqueue public styles.
	 */
	public function enqueue_styles() {
		wp_enqueue_style(
			'kentroi-public',
			KENTROI_PLUGIN_URL . 'public/css/kentroi-public.css',
			array(),
			KENTROI_VERSION
		);
	}

	/**
	 * Enqueue public scripts.
	 */
	public function enqueue_scripts() {
		// Only enqueue if GDPR consent is enabled.
		if ( Kentroi_Privacy::is_gdpr_enabled() ) {
			wp_add_inline_script(
				'jquery',
				$this->get_consent_script(),
				'after'
			);
		}
	}

	/**
	 * Get the consent handling script.
	 *
	 * @return string
	 */
	private function get_consent_script() {
		return "
			(function() {
				document.addEventListener('click', function(e) {
					if (e.target.classList.contains('kentroi-consent-button')) {
						var wrapper = e.target.closest('.kentroi-consent-placeholder');
						if (wrapper) {
							var iframeUrl = wrapper.getAttribute('data-iframe-url');
							var height = wrapper.getAttribute('data-height') || '600';

							var iframe = document.createElement('iframe');
							iframe.src = iframeUrl;
							iframe.style.width = '100%';
							iframe.style.height = height + 'px';
							iframe.style.border = 'none';
							iframe.setAttribute('loading', 'lazy');
							iframe.setAttribute('allow', 'payment');

							wrapper.parentNode.replaceChild(iframe, wrapper);
						}
					}
				});
			})();
		";
	}

	/**
	 * Mark that floating chat has been added.
	 */
	public function mark_floating_chat_added() {
		$this->floating_chat_added = true;
	}

	/**
	 * Check if floating chat has been added.
	 *
	 * @return bool
	 */
	public function is_floating_chat_added() {
		return $this->floating_chat_added;
	}
}
