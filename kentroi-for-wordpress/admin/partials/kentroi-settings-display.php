<?php
/**
 * Admin settings page template.
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

	<?php settings_errors( 'kentroi_messages' ); ?>

	<form action="options.php" method="post">
		<?php
		settings_fields( 'kentroi_settings' );
		do_settings_sections( 'kentroi_settings' );
		submit_button( __( 'Save Settings', 'kentroi-for-wordpress' ) );
		?>
	</form>

	<div class="kentroi-card" style="margin-top: 20px;">
		<h2><?php esc_html_e( 'Finding Your Widget ID', 'kentroi-for-wordpress' ); ?></h2>
		<ol>
			<li><?php esc_html_e( 'Log in to your Kentroi account', 'kentroi-for-wordpress' ); ?></li>
			<li>
				<?php
				printf(
					/* translators: %s: Settings link */
					esc_html__( 'Go to %s', 'kentroi-for-wordpress' ),
					'<strong>' . esc_html__( 'Settings > Widget', 'kentroi-for-wordpress' ) . '</strong>'
				);
				?>
			</li>
			<li><?php esc_html_e( 'Copy your Widget ID and paste it above', 'kentroi-for-wordpress' ); ?></li>
		</ol>
		<p>
			<a href="https://kentroi.com/dashboard/settings/widget" target="_blank" rel="noopener noreferrer" class="button">
				<?php esc_html_e( 'Open Kentroi Dashboard', 'kentroi-for-wordpress' ); ?>
			</a>
		</p>
	</div>

	<div class="kentroi-card">
		<h2><?php esc_html_e( 'External Service Notice', 'kentroi-for-wordpress' ); ?></h2>
		<p><?php esc_html_e( 'This plugin connects to Kentroi (kentroi.com) to provide booking, form, and chat functionality. When using Kentroi widgets:', 'kentroi-for-wordpress' ); ?></p>
		<ul style="list-style: disc; margin-left: 20px;">
			<li><?php esc_html_e( 'Widget content is loaded from kentroi.com', 'kentroi-for-wordpress' ); ?></li>
			<li><?php esc_html_e( 'Visitor data entered in widgets is processed by Kentroi', 'kentroi-for-wordpress' ); ?></li>
			<li><?php esc_html_e( 'No visitor data is stored in your WordPress database', 'kentroi-for-wordpress' ); ?></li>
		</ul>
		<p>
			<a href="https://kentroi.com/privacy" target="_blank" rel="noopener noreferrer"><?php esc_html_e( 'Privacy Policy', 'kentroi-for-wordpress' ); ?></a> |
			<a href="https://kentroi.com/terms" target="_blank" rel="noopener noreferrer"><?php esc_html_e( 'Terms of Service', 'kentroi-for-wordpress' ); ?></a>
		</p>
	</div>
</div>
