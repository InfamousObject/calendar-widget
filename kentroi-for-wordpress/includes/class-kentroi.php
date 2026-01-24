<?php
/**
 * The main plugin class.
 *
 * @package Kentroi
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
	die;
}

/**
 * The main plugin class that orchestrates all functionality.
 */
class Kentroi {

	/**
	 * The API client instance.
	 *
	 * @var Kentroi_API
	 */
	protected $api;

	/**
	 * The admin instance.
	 *
	 * @var Kentroi_Admin
	 */
	protected $admin;

	/**
	 * The public instance.
	 *
	 * @var Kentroi_Public
	 */
	protected $public;

	/**
	 * The shortcodes instance.
	 *
	 * @var Kentroi_Shortcodes
	 */
	protected $shortcodes;

	/**
	 * The privacy instance.
	 *
	 * @var Kentroi_Privacy
	 */
	protected $privacy;

	/**
	 * The i18n instance.
	 *
	 * @var Kentroi_I18n
	 */
	protected $i18n;

	/**
	 * Initialize the class and set its properties.
	 */
	public function __construct() {
		$this->api        = new Kentroi_API();
		$this->privacy    = new Kentroi_Privacy();
		$this->i18n       = new Kentroi_I18n();
		$this->shortcodes = new Kentroi_Shortcodes( $this->api );
		$this->public     = new Kentroi_Public( $this->api );

		if ( is_admin() ) {
			$this->admin = new Kentroi_Admin( $this->api );
		}
	}

	/**
	 * Run the plugin - register all hooks.
	 */
	public function run() {
		// Load text domain.
		$this->i18n->load_textdomain();

		// Register privacy policy content.
		$this->privacy->register_hooks();

		// Register shortcodes.
		$this->shortcodes->register_hooks();

		// Register public hooks.
		$this->public->register_hooks();

		// Register admin hooks.
		if ( is_admin() ) {
			$this->admin->register_hooks();
		}

		// Register REST API endpoints for blocks.
		add_action( 'rest_api_init', array( $this, 'register_rest_routes' ) );
	}

	/**
	 * Register REST API routes for Gutenberg blocks.
	 */
	public function register_rest_routes() {
		register_rest_route(
			'kentroi/v1',
			'/features',
			array(
				'methods'             => 'GET',
				'callback'            => array( $this, 'get_features' ),
				'permission_callback' => function() {
					return current_user_can( 'edit_posts' );
				},
			)
		);

		register_rest_route(
			'kentroi/v1',
			'/validate',
			array(
				'methods'             => 'POST',
				'callback'            => array( $this, 'validate_widget_id' ),
				'permission_callback' => function() {
					return current_user_can( 'manage_options' );
				},
				'args'                => array(
					'widget_id' => array(
						'required'          => true,
						'sanitize_callback' => 'sanitize_text_field',
					),
				),
			)
		);
	}

	/**
	 * Get features from Kentroi API.
	 *
	 * @return WP_REST_Response
	 */
	public function get_features() {
		$features = $this->api->get_features();

		if ( is_wp_error( $features ) ) {
			return new WP_REST_Response(
				array(
					'success' => false,
					'message' => $features->get_error_message(),
				),
				400
			);
		}

		return new WP_REST_Response(
			array(
				'success' => true,
				'data'    => $features,
			),
			200
		);
	}

	/**
	 * Validate a widget ID.
	 *
	 * @param WP_REST_Request $request The request object.
	 * @return WP_REST_Response
	 */
	public function validate_widget_id( $request ) {
		$widget_id = $request->get_param( 'widget_id' );
		$result    = $this->api->validate_widget_id( $widget_id );

		if ( is_wp_error( $result ) ) {
			return new WP_REST_Response(
				array(
					'success' => false,
					'message' => $result->get_error_message(),
				),
				400
			);
		}

		return new WP_REST_Response(
			array(
				'success' => true,
				'data'    => $result,
			),
			200
		);
	}

	/**
	 * Get the API client instance.
	 *
	 * @return Kentroi_API
	 */
	public function get_api() {
		return $this->api;
	}
}
