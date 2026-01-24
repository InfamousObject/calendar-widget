<?php
/**
 * The API client class for communicating with Kentroi SaaS.
 *
 * @package Kentroi
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
	die;
}

/**
 * Handles all API communication with kentroi.com.
 */
class Kentroi_API {

	/**
	 * The base API URL.
	 *
	 * @var string
	 */
	private $api_url;

	/**
	 * Cache duration in seconds (5 minutes).
	 *
	 * @var int
	 */
	private $cache_duration = 300;

	/**
	 * Initialize the class.
	 */
	public function __construct() {
		$this->api_url = KENTROI_API_URL;
	}

	/**
	 * Get the configured widget ID.
	 *
	 * @return string
	 */
	public function get_widget_id() {
		return get_option( 'kentroi_widget_id', '' );
	}

	/**
	 * Make an API request to Kentroi.
	 *
	 * @param string $endpoint The API endpoint.
	 * @param string $method   The HTTP method (GET, POST).
	 * @param array  $body     The request body for POST requests.
	 * @return array|WP_Error The response data or error.
	 */
	private function request( $endpoint, $method = 'GET', $body = array() ) {
		$url = trailingslashit( $this->api_url ) . ltrim( $endpoint, '/' );

		$args = array(
			'method'  => $method,
			'timeout' => 15,
			'headers' => array(
				'Content-Type' => 'application/json',
				'Accept'       => 'application/json',
			),
		);

		if ( 'POST' === $method && ! empty( $body ) ) {
			$args['body'] = wp_json_encode( $body );
		}

		$response = wp_remote_request( $url, $args );

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$response_code = wp_remote_retrieve_response_code( $response );
		$response_body = wp_remote_retrieve_body( $response );
		$data          = json_decode( $response_body, true );

		if ( $response_code >= 400 ) {
			$message = isset( $data['error'] ) ? $data['error'] : __( 'API request failed', 'kentroi-for-wordpress' );
			return new WP_Error( 'kentroi_api_error', $message, array( 'status' => $response_code ) );
		}

		return $data;
	}

	/**
	 * Validate a widget ID with the Kentroi API.
	 *
	 * @param string $widget_id The widget ID to validate.
	 * @return array|WP_Error The validation result or error.
	 */
	public function validate_widget_id( $widget_id ) {
		if ( empty( $widget_id ) ) {
			return new WP_Error( 'kentroi_invalid_widget_id', __( 'Widget ID is required', 'kentroi-for-wordpress' ) );
		}

		$result = $this->request( 'wordpress/validate?widgetId=' . rawurlencode( $widget_id ) );

		if ( is_wp_error( $result ) ) {
			return $result;
		}

		// Cache the result.
		if ( isset( $result['valid'] ) && $result['valid'] ) {
			set_transient( 'kentroi_connection_status', $result, $this->cache_duration );
		}

		return $result;
	}

	/**
	 * Get the connection status.
	 *
	 * @param bool $force_refresh Whether to force a refresh of the status.
	 * @return array|WP_Error The connection status or error.
	 */
	public function get_connection_status( $force_refresh = false ) {
		$widget_id = $this->get_widget_id();

		if ( empty( $widget_id ) ) {
			return array(
				'valid'   => false,
				'message' => __( 'No Widget ID configured', 'kentroi-for-wordpress' ),
			);
		}

		if ( ! $force_refresh ) {
			$cached = get_transient( 'kentroi_connection_status' );
			if ( false !== $cached ) {
				return $cached;
			}
		}

		return $this->validate_widget_id( $widget_id );
	}

	/**
	 * Get available features (appointment types, forms) for the widget.
	 *
	 * @param bool $force_refresh Whether to force a refresh.
	 * @return array|WP_Error The features data or error.
	 */
	public function get_features( $force_refresh = false ) {
		$widget_id = $this->get_widget_id();

		if ( empty( $widget_id ) ) {
			return new WP_Error( 'kentroi_no_widget_id', __( 'No Widget ID configured', 'kentroi-for-wordpress' ) );
		}

		if ( ! $force_refresh ) {
			$cached = get_transient( 'kentroi_features' );
			if ( false !== $cached ) {
				return $cached;
			}
		}

		$result = $this->request( 'wordpress/features?widgetId=' . rawurlencode( $widget_id ) );

		if ( is_wp_error( $result ) ) {
			return $result;
		}

		// Cache the features.
		set_transient( 'kentroi_features', $result, $this->cache_duration );

		return $result;
	}

	/**
	 * Get the booking embed URL.
	 *
	 * @param string $appointment_type_id Optional appointment type ID.
	 * @return string The embed URL.
	 */
	public function get_booking_embed_url( $appointment_type_id = '' ) {
		$widget_id = $this->get_widget_id();

		if ( empty( $widget_id ) ) {
			return '';
		}

		$url = KENTROI_EMBED_URL . '/embed/booking/' . rawurlencode( $widget_id );

		if ( ! empty( $appointment_type_id ) ) {
			$url = add_query_arg( 'type', rawurlencode( $appointment_type_id ), $url );
		}

		return $url;
	}

	/**
	 * Get the form embed URL.
	 *
	 * @param string $form_id The form ID.
	 * @return string The embed URL.
	 */
	public function get_form_embed_url( $form_id ) {
		if ( empty( $form_id ) ) {
			return '';
		}

		return KENTROI_EMBED_URL . '/embed/form/' . rawurlencode( $form_id );
	}

	/**
	 * Get the chat widget URL.
	 *
	 * @param string $mode The chat mode (inline or floating).
	 * @return string The widget URL.
	 */
	public function get_chat_widget_url( $mode = 'inline' ) {
		$widget_id = $this->get_widget_id();

		if ( empty( $widget_id ) ) {
			return '';
		}

		$url = KENTROI_EMBED_URL . '/widget/' . rawurlencode( $widget_id );
		$url = add_query_arg( 'view', 'chat', $url );

		if ( 'floating' === $mode ) {
			$url = add_query_arg( 'mode', 'floating', $url );
		}

		return $url;
	}

	/**
	 * Clear all cached data.
	 */
	public function clear_cache() {
		delete_transient( 'kentroi_connection_status' );
		delete_transient( 'kentroi_features' );
	}
}
