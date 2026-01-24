<?php
/**
 * Internationalization handling class.
 *
 * @package Kentroi
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
	die;
}

/**
 * Handles loading of text domain for translations.
 */
class Kentroi_I18n {

	/**
	 * Load the plugin text domain for translation.
	 */
	public function load_textdomain() {
		load_plugin_textdomain(
			'kentroi-for-wordpress',
			false,
			dirname( KENTROI_PLUGIN_BASENAME ) . '/languages/'
		);
	}
}
