<?php
/**
 * The admin-specific functionality of the plugin.
 *
 * @package Kentroi
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
	die;
}

/**
 * The admin-specific functionality of the plugin.
 */
class Kentroi_Admin {

	/**
	 * The API client instance.
	 *
	 * @var Kentroi_API
	 */
	private $api;

	/**
	 * Initialize the class and set its properties.
	 *
	 * @param Kentroi_API $api The API client instance.
	 */
	public function __construct( $api ) {
		$this->api = $api;
	}

	/**
	 * Register all hooks for the admin area.
	 */
	public function register_hooks() {
		add_action( 'admin_menu', array( $this, 'add_admin_menu' ) );
		add_action( 'admin_init', array( $this, 'register_settings' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_styles' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_scripts' ) );
		add_filter( 'plugin_action_links_' . KENTROI_PLUGIN_BASENAME, array( $this, 'add_action_links' ) );
	}

	/**
	 * Add menu items.
	 */
	public function add_admin_menu() {
		// Main menu item.
		add_menu_page(
			__( 'Kentroi', 'kentroi-for-wordpress' ),
			__( 'Kentroi', 'kentroi-for-wordpress' ),
			'manage_options',
			'kentroi',
			array( $this, 'display_dashboard_page' ),
			'dashicons-calendar-alt',
			30
		);

		// Dashboard submenu (same as main).
		add_submenu_page(
			'kentroi',
			__( 'Dashboard', 'kentroi-for-wordpress' ),
			__( 'Dashboard', 'kentroi-for-wordpress' ),
			'manage_options',
			'kentroi',
			array( $this, 'display_dashboard_page' )
		);

		// Booking submenu.
		add_submenu_page(
			'kentroi',
			__( 'Booking Widget', 'kentroi-for-wordpress' ),
			__( 'Booking', 'kentroi-for-wordpress' ),
			'manage_options',
			'kentroi-booking',
			array( $this, 'display_booking_page' )
		);

		// Forms submenu.
		add_submenu_page(
			'kentroi',
			__( 'Contact Forms', 'kentroi-for-wordpress' ),
			__( 'Forms', 'kentroi-for-wordpress' ),
			'manage_options',
			'kentroi-forms',
			array( $this, 'display_forms_page' )
		);

		// Chatbot submenu.
		add_submenu_page(
			'kentroi',
			__( 'AI Chatbot', 'kentroi-for-wordpress' ),
			__( 'Chatbot', 'kentroi-for-wordpress' ),
			'manage_options',
			'kentroi-chat',
			array( $this, 'display_chat_page' )
		);

		// Settings submenu.
		add_submenu_page(
			'kentroi',
			__( 'Settings', 'kentroi-for-wordpress' ),
			__( 'Settings', 'kentroi-for-wordpress' ),
			'manage_options',
			'kentroi-settings',
			array( $this, 'display_settings_page' )
		);
	}

	/**
	 * Register settings.
	 */
	public function register_settings() {
		// Widget ID setting.
		register_setting(
			'kentroi_settings',
			'kentroi_widget_id',
			array(
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_text_field',
				'default'           => '',
			)
		);

		// GDPR enabled setting.
		register_setting(
			'kentroi_settings',
			'kentroi_gdpr_enabled',
			array(
				'type'              => 'boolean',
				'sanitize_callback' => 'rest_sanitize_boolean',
				'default'           => false,
			)
		);

		// GDPR message setting.
		register_setting(
			'kentroi_settings',
			'kentroi_gdpr_message',
			array(
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_textarea_field',
				'default'           => __( 'Click to load the booking widget. By loading, you agree to our privacy policy.', 'kentroi-for-wordpress' ),
			)
		);

		// Settings section.
		add_settings_section(
			'kentroi_main_section',
			__( 'Connection Settings', 'kentroi-for-wordpress' ),
			array( $this, 'render_main_section' ),
			'kentroi_settings'
		);

		// Widget ID field.
		add_settings_field(
			'kentroi_widget_id',
			__( 'Widget ID', 'kentroi-for-wordpress' ),
			array( $this, 'render_widget_id_field' ),
			'kentroi_settings',
			'kentroi_main_section'
		);

		// GDPR section.
		add_settings_section(
			'kentroi_gdpr_section',
			__( 'Privacy / GDPR Settings', 'kentroi-for-wordpress' ),
			array( $this, 'render_gdpr_section' ),
			'kentroi_settings'
		);

		// GDPR enabled field.
		add_settings_field(
			'kentroi_gdpr_enabled',
			__( 'Require Consent', 'kentroi-for-wordpress' ),
			array( $this, 'render_gdpr_enabled_field' ),
			'kentroi_settings',
			'kentroi_gdpr_section'
		);

		// GDPR message field.
		add_settings_field(
			'kentroi_gdpr_message',
			__( 'Consent Message', 'kentroi-for-wordpress' ),
			array( $this, 'render_gdpr_message_field' ),
			'kentroi_settings',
			'kentroi_gdpr_section'
		);
	}

	/**
	 * Render main settings section description.
	 */
	public function render_main_section() {
		echo '<p>' . esc_html__( 'Enter your Kentroi Widget ID to connect your WordPress site to your Kentroi account.', 'kentroi-for-wordpress' ) . '</p>';
	}

	/**
	 * Render GDPR settings section description.
	 */
	public function render_gdpr_section() {
		echo '<p>' . esc_html__( 'Configure privacy consent settings for embedded widgets.', 'kentroi-for-wordpress' ) . '</p>';
	}

	/**
	 * Render the Widget ID field.
	 */
	public function render_widget_id_field() {
		$widget_id = get_option( 'kentroi_widget_id', '' );
		?>
		<input type="text"
			id="kentroi_widget_id"
			name="kentroi_widget_id"
			value="<?php echo esc_attr( $widget_id ); ?>"
			class="regular-text"
			placeholder="<?php esc_attr_e( 'Enter your Widget ID', 'kentroi-for-wordpress' ); ?>">
		<p class="description">
			<?php
			printf(
				/* translators: %s: Kentroi dashboard URL */
				esc_html__( 'Find your Widget ID in your %s.', 'kentroi-for-wordpress' ),
				'<a href="https://kentroi.com/dashboard/settings/widget" target="_blank" rel="noopener noreferrer">' . esc_html__( 'Kentroi Dashboard', 'kentroi-for-wordpress' ) . '</a>'
			);
			?>
		</p>
		<div id="kentroi-connection-status" style="margin-top: 10px;"></div>
		<?php
	}

	/**
	 * Render the GDPR enabled field.
	 */
	public function render_gdpr_enabled_field() {
		$enabled = get_option( 'kentroi_gdpr_enabled', false );
		?>
		<label>
			<input type="checkbox"
				id="kentroi_gdpr_enabled"
				name="kentroi_gdpr_enabled"
				value="1"
				<?php checked( $enabled, true ); ?>>
			<?php esc_html_e( 'Show consent placeholder before loading widgets', 'kentroi-for-wordpress' ); ?>
		</label>
		<p class="description">
			<?php esc_html_e( 'When enabled, visitors must click to consent before booking widgets, forms, or chat are loaded.', 'kentroi-for-wordpress' ); ?>
		</p>
		<?php
	}

	/**
	 * Render the GDPR message field.
	 */
	public function render_gdpr_message_field() {
		$message = get_option( 'kentroi_gdpr_message', __( 'Click to load the booking widget. By loading, you agree to our privacy policy.', 'kentroi-for-wordpress' ) );
		?>
		<textarea
			id="kentroi_gdpr_message"
			name="kentroi_gdpr_message"
			rows="3"
			class="large-text"><?php echo esc_textarea( $message ); ?></textarea>
		<p class="description">
			<?php esc_html_e( 'This message is shown to visitors before loading external widgets.', 'kentroi-for-wordpress' ); ?>
		</p>
		<?php
	}

	/**
	 * Enqueue admin styles.
	 *
	 * @param string $hook The current admin page.
	 */
	public function enqueue_styles( $hook ) {
		if ( strpos( $hook, 'kentroi' ) === false ) {
			return;
		}

		wp_enqueue_style(
			'kentroi-admin',
			KENTROI_PLUGIN_URL . 'admin/css/kentroi-admin.css',
			array(),
			KENTROI_VERSION
		);
	}

	/**
	 * Enqueue admin scripts.
	 *
	 * @param string $hook The current admin page.
	 */
	public function enqueue_scripts( $hook ) {
		if ( strpos( $hook, 'kentroi' ) === false ) {
			return;
		}

		wp_enqueue_script(
			'kentroi-admin',
			KENTROI_PLUGIN_URL . 'admin/js/kentroi-admin.js',
			array( 'jquery' ),
			KENTROI_VERSION,
			true
		);

		wp_localize_script(
			'kentroi-admin',
			'kentroiAdmin',
			array(
				'ajaxUrl'      => admin_url( 'admin-ajax.php' ),
				'restUrl'      => rest_url( 'kentroi/v1/' ),
				'nonce'        => wp_create_nonce( 'wp_rest' ),
				'i18n'         => array(
					'validating'   => __( 'Validating...', 'kentroi-for-wordpress' ),
					'connected'    => __( 'Connected', 'kentroi-for-wordpress' ),
					'disconnected' => __( 'Not connected', 'kentroi-for-wordpress' ),
					'error'        => __( 'Error', 'kentroi-for-wordpress' ),
					'copied'       => __( 'Copied!', 'kentroi-for-wordpress' ),
				),
			)
		);
	}

	/**
	 * Add action links to the plugins page.
	 *
	 * @param array $links Existing links.
	 * @return array Modified links.
	 */
	public function add_action_links( $links ) {
		$settings_link = sprintf(
			'<a href="%s">%s</a>',
			admin_url( 'admin.php?page=kentroi-settings' ),
			__( 'Settings', 'kentroi-for-wordpress' )
		);

		array_unshift( $links, $settings_link );

		return $links;
	}

	/**
	 * Display the dashboard page.
	 */
	public function display_dashboard_page() {
		$connection_status = $this->api->get_connection_status();
		$is_connected      = ! is_wp_error( $connection_status ) && isset( $connection_status['valid'] ) && $connection_status['valid'];
		$business_name     = isset( $connection_status['businessName'] ) ? $connection_status['businessName'] : '';

		include KENTROI_PLUGIN_PATH . 'admin/partials/kentroi-dashboard-display.php';
	}

	/**
	 * Display the booking page.
	 */
	public function display_booking_page() {
		$features          = $this->api->get_features();
		$appointment_types = ! is_wp_error( $features ) && isset( $features['appointmentTypes'] ) ? $features['appointmentTypes'] : array();

		include KENTROI_PLUGIN_PATH . 'admin/partials/kentroi-booking-display.php';
	}

	/**
	 * Display the forms page.
	 */
	public function display_forms_page() {
		$features = $this->api->get_features();
		$forms    = ! is_wp_error( $features ) && isset( $features['forms'] ) ? $features['forms'] : array();

		include KENTROI_PLUGIN_PATH . 'admin/partials/kentroi-forms-display.php';
	}

	/**
	 * Display the chat page.
	 */
	public function display_chat_page() {
		include KENTROI_PLUGIN_PATH . 'admin/partials/kentroi-chat-display.php';
	}

	/**
	 * Display the settings page.
	 */
	public function display_settings_page() {
		// Check user capabilities.
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}

		// Show settings saved message.
		if ( isset( $_GET['settings-updated'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			add_settings_error( 'kentroi_messages', 'kentroi_message', __( 'Settings saved.', 'kentroi-for-wordpress' ), 'updated' );
			// Clear cache when settings are updated.
			$this->api->clear_cache();
		}

		include KENTROI_PLUGIN_PATH . 'admin/partials/kentroi-settings-display.php';
	}
}
