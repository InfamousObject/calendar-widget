<?php
/**
 * Plugin Name:       Kentroi for WordPress
 * Plugin URI:        https://kentroi.com/integrations/wordpress
 * Description:       Embed Kentroi booking widgets, contact forms, and AI chatbots on your WordPress site.
 * Version:           1.0.0
 * Requires at least: 6.0
 * Requires PHP:      7.4
 * Author:            Kentroi
 * Author URI:        https://kentroi.com
 * License:           GPL v2 or later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       kentroi-for-wordpress
 * Domain Path:       /languages
 *
 * @package Kentroi
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
	die;
}

/**
 * Current plugin version.
 */
define( 'KENTROI_VERSION', '1.0.0' );

/**
 * Plugin base path.
 */
define( 'KENTROI_PLUGIN_PATH', plugin_dir_path( __FILE__ ) );

/**
 * Plugin base URL.
 */
define( 'KENTROI_PLUGIN_URL', plugin_dir_url( __FILE__ ) );

/**
 * Plugin basename.
 */
define( 'KENTROI_PLUGIN_BASENAME', plugin_basename( __FILE__ ) );

/**
 * Kentroi API base URL.
 */
define( 'KENTROI_API_URL', 'https://kentroi.com/api' );

/**
 * Kentroi embed base URL.
 */
define( 'KENTROI_EMBED_URL', 'https://kentroi.com' );

/**
 * The code that runs during plugin activation.
 */
function kentroi_activate() {
	// Set default options.
	$defaults = array(
		'widget_id'     => '',
		'gdpr_enabled'  => false,
		'gdpr_message'  => __( 'Click to load the booking widget. By loading, you agree to our privacy policy.', 'kentroi-for-wordpress' ),
	);

	foreach ( $defaults as $key => $value ) {
		if ( false === get_option( 'kentroi_' . $key ) ) {
			add_option( 'kentroi_' . $key, $value );
		}
	}

	// Clear any cached data.
	delete_transient( 'kentroi_connection_status' );
}
register_activation_hook( __FILE__, 'kentroi_activate' );

/**
 * The code that runs during plugin deactivation.
 */
function kentroi_deactivate() {
	// Clear cached data.
	delete_transient( 'kentroi_connection_status' );
	delete_transient( 'kentroi_features' );
}
register_deactivation_hook( __FILE__, 'kentroi_deactivate' );

/**
 * Load the required dependencies for this plugin.
 */
function kentroi_load_dependencies() {
	// Core classes.
	require_once KENTROI_PLUGIN_PATH . 'includes/class-kentroi.php';
	require_once KENTROI_PLUGIN_PATH . 'includes/class-kentroi-api.php';
	require_once KENTROI_PLUGIN_PATH . 'includes/class-kentroi-privacy.php';
	require_once KENTROI_PLUGIN_PATH . 'includes/class-kentroi-i18n.php';

	// Admin classes.
	if ( is_admin() ) {
		require_once KENTROI_PLUGIN_PATH . 'admin/class-kentroi-admin.php';
	}

	// Public classes.
	require_once KENTROI_PLUGIN_PATH . 'public/class-kentroi-public.php';
	require_once KENTROI_PLUGIN_PATH . 'public/class-kentroi-shortcodes.php';
}

/**
 * Begin execution of the plugin.
 */
function kentroi_init() {
	kentroi_load_dependencies();

	// Initialize the main plugin class.
	$plugin = new Kentroi();
	$plugin->run();
}
add_action( 'plugins_loaded', 'kentroi_init' );

/**
 * Register Gutenberg blocks.
 */
function kentroi_register_blocks() {
	// Only register if blocks exist and are built.
	$blocks = array( 'kentroi-booking', 'kentroi-form', 'kentroi-chat' );

	foreach ( $blocks as $block ) {
		$block_path = KENTROI_PLUGIN_PATH . 'blocks/' . $block;
		if ( file_exists( $block_path . '/block.json' ) ) {
			register_block_type( $block_path );
		}
	}
}
add_action( 'init', 'kentroi_register_blocks' );
