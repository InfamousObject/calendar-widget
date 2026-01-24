<?php
/**
 * Admin dashboard page template.
 *
 * @package Kentroi
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
	die;
}
?>

<div class="wrap kentroi-admin-wrap">
	<h1><?php echo esc_html( get_admin_page_title() ); ?></h1>

	<div class="kentroi-dashboard">
		<!-- Connection Status Card -->
		<div class="kentroi-card kentroi-status-card">
			<h2><?php esc_html_e( 'Connection Status', 'kentroi-for-wordpress' ); ?></h2>
			<div class="kentroi-status <?php echo $is_connected ? 'kentroi-status-connected' : 'kentroi-status-disconnected'; ?>">
				<span class="kentroi-status-indicator"></span>
				<?php if ( $is_connected ) : ?>
					<span class="kentroi-status-text">
						<?php esc_html_e( 'Connected', 'kentroi-for-wordpress' ); ?>
						<?php if ( $business_name ) : ?>
							- <?php echo esc_html( $business_name ); ?>
						<?php endif; ?>
					</span>
				<?php else : ?>
					<span class="kentroi-status-text"><?php esc_html_e( 'Not Connected', 'kentroi-for-wordpress' ); ?></span>
				<?php endif; ?>
			</div>

			<?php if ( ! $is_connected ) : ?>
				<p class="kentroi-help-text">
					<?php
					printf(
						/* translators: %s: Settings page URL */
						esc_html__( 'Enter your Widget ID in the %s to connect.', 'kentroi-for-wordpress' ),
						'<a href="' . esc_url( admin_url( 'admin.php?page=kentroi-settings' ) ) . '">' . esc_html__( 'Settings', 'kentroi-for-wordpress' ) . '</a>'
					);
					?>
				</p>
			<?php endif; ?>
		</div>

		<!-- Quick Actions Card -->
		<div class="kentroi-card">
			<h2><?php esc_html_e( 'Quick Actions', 'kentroi-for-wordpress' ); ?></h2>
			<ul class="kentroi-quick-actions">
				<li>
					<a href="<?php echo esc_url( admin_url( 'admin.php?page=kentroi-booking' ) ); ?>" class="kentroi-action-link">
						<span class="dashicons dashicons-calendar-alt"></span>
						<?php esc_html_e( 'Add Booking Widget', 'kentroi-for-wordpress' ); ?>
					</a>
				</li>
				<li>
					<a href="<?php echo esc_url( admin_url( 'admin.php?page=kentroi-forms' ) ); ?>" class="kentroi-action-link">
						<span class="dashicons dashicons-feedback"></span>
						<?php esc_html_e( 'Add Contact Form', 'kentroi-for-wordpress' ); ?>
					</a>
				</li>
				<li>
					<a href="<?php echo esc_url( admin_url( 'admin.php?page=kentroi-chat' ) ); ?>" class="kentroi-action-link">
						<span class="dashicons dashicons-format-chat"></span>
						<?php esc_html_e( 'Add AI Chatbot', 'kentroi-for-wordpress' ); ?>
					</a>
				</li>
				<li>
					<a href="<?php echo esc_url( admin_url( 'admin.php?page=kentroi-settings' ) ); ?>" class="kentroi-action-link">
						<span class="dashicons dashicons-admin-settings"></span>
						<?php esc_html_e( 'Configure Settings', 'kentroi-for-wordpress' ); ?>
					</a>
				</li>
			</ul>
		</div>

		<!-- Resources Card -->
		<div class="kentroi-card">
			<h2><?php esc_html_e( 'Resources', 'kentroi-for-wordpress' ); ?></h2>
			<ul class="kentroi-resources">
				<li>
					<a href="https://kentroi.com/dashboard" target="_blank" rel="noopener noreferrer">
						<span class="dashicons dashicons-external"></span>
						<?php esc_html_e( 'Kentroi Dashboard', 'kentroi-for-wordpress' ); ?>
					</a>
				</li>
				<li>
					<a href="https://kentroi.com/docs/wordpress" target="_blank" rel="noopener noreferrer">
						<span class="dashicons dashicons-book"></span>
						<?php esc_html_e( 'Documentation', 'kentroi-for-wordpress' ); ?>
					</a>
				</li>
				<li>
					<a href="https://kentroi.com/support" target="_blank" rel="noopener noreferrer">
						<span class="dashicons dashicons-sos"></span>
						<?php esc_html_e( 'Get Support', 'kentroi-for-wordpress' ); ?>
					</a>
				</li>
			</ul>
		</div>
	</div>
</div>
