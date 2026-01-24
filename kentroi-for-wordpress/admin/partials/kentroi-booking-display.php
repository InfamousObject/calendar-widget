<?php
/**
 * Admin booking page template.
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

	<div class="kentroi-page-content">
		<div class="kentroi-card">
			<h2><?php esc_html_e( 'Booking Widget Shortcode', 'kentroi-for-wordpress' ); ?></h2>
			<p><?php esc_html_e( 'Use the shortcode below to embed a booking widget on any page or post.', 'kentroi-for-wordpress' ); ?></p>

			<div class="kentroi-shortcode-generator">
				<h3><?php esc_html_e( 'Options', 'kentroi-for-wordpress' ); ?></h3>

				<table class="form-table">
					<tr>
						<th scope="row">
							<label for="kentroi-booking-mode"><?php esc_html_e( 'Display Mode', 'kentroi-for-wordpress' ); ?></label>
						</th>
						<td>
							<select id="kentroi-booking-mode" class="kentroi-shortcode-option" data-attr="mode">
								<option value="inline"><?php esc_html_e( 'Inline (embedded on page)', 'kentroi-for-wordpress' ); ?></option>
								<option value="popup"><?php esc_html_e( 'Popup (button opens modal)', 'kentroi-for-wordpress' ); ?></option>
								<option value="link"><?php esc_html_e( 'Link (button opens new tab)', 'kentroi-for-wordpress' ); ?></option>
							</select>
							<p class="description"><?php esc_html_e( 'Choose how the booking widget is displayed.', 'kentroi-for-wordpress' ); ?></p>
						</td>
					</tr>
					<tr>
						<th scope="row">
							<label for="kentroi-booking-type"><?php esc_html_e( 'Appointment Type', 'kentroi-for-wordpress' ); ?></label>
						</th>
						<td>
							<select id="kentroi-booking-type" class="kentroi-shortcode-option" data-attr="type">
								<option value=""><?php esc_html_e( '-- All Types --', 'kentroi-for-wordpress' ); ?></option>
								<?php if ( ! empty( $appointment_types ) ) : ?>
									<?php foreach ( $appointment_types as $type ) : ?>
										<option value="<?php echo esc_attr( $type['id'] ); ?>">
											<?php echo esc_html( $type['name'] ); ?>
										</option>
									<?php endforeach; ?>
								<?php endif; ?>
							</select>
							<p class="description"><?php esc_html_e( 'Select a specific appointment type or show all.', 'kentroi-for-wordpress' ); ?></p>
						</td>
					</tr>
					<tr id="kentroi-height-row">
						<th scope="row">
							<label for="kentroi-booking-height"><?php esc_html_e( 'Height (pixels)', 'kentroi-for-wordpress' ); ?></label>
						</th>
						<td>
							<input type="number" id="kentroi-booking-height" class="kentroi-shortcode-option small-text" data-attr="height" value="600" min="300" max="1200">
							<p class="description"><?php esc_html_e( 'Initial height of the widget. With auto-resize enabled, this is the minimum height.', 'kentroi-for-wordpress' ); ?></p>
						</td>
					</tr>
					<tr id="kentroi-autoresize-row">
						<th scope="row">
							<label for="kentroi-booking-autoresize"><?php esc_html_e( 'Auto-Resize', 'kentroi-for-wordpress' ); ?></label>
						</th>
						<td>
							<label>
								<input type="checkbox" id="kentroi-booking-autoresize" class="kentroi-shortcode-option" data-attr="autoresize" checked>
								<?php esc_html_e( 'Automatically adjust height to fit content', 'kentroi-for-wordpress' ); ?>
							</label>
							<p class="description"><?php esc_html_e( 'Recommended. Prevents scrolling inside the widget.', 'kentroi-for-wordpress' ); ?></p>
						</td>
					</tr>
					<tr id="kentroi-button-text-row" style="display: none;">
						<th scope="row">
							<label for="kentroi-booking-button-text"><?php esc_html_e( 'Button Text', 'kentroi-for-wordpress' ); ?></label>
						</th>
						<td>
							<input type="text" id="kentroi-booking-button-text" class="kentroi-shortcode-option regular-text" data-attr="button_text" value="Book Appointment">
							<p class="description"><?php esc_html_e( 'Text displayed on the button.', 'kentroi-for-wordpress' ); ?></p>
						</td>
					</tr>
				</table>

				<h3><?php esc_html_e( 'Generated Shortcode', 'kentroi-for-wordpress' ); ?></h3>
				<div class="kentroi-shortcode-output">
					<code id="kentroi-booking-shortcode">[kentroi-booking height="600"]</code>
					<button type="button" class="button kentroi-copy-button" data-target="kentroi-booking-shortcode">
						<?php esc_html_e( 'Copy', 'kentroi-for-wordpress' ); ?>
					</button>
				</div>
			</div>
		</div>

		<div class="kentroi-card">
			<h2><?php esc_html_e( 'Gutenberg Block', 'kentroi-for-wordpress' ); ?></h2>
			<p><?php esc_html_e( 'You can also use the Kentroi Booking block in the block editor. Search for "Kentroi Booking" when adding a new block.', 'kentroi-for-wordpress' ); ?></p>
		</div>

		<div class="kentroi-card">
			<h2><?php esc_html_e( 'Shortcode Reference', 'kentroi-for-wordpress' ); ?></h2>
			<table class="widefat">
				<thead>
					<tr>
						<th><?php esc_html_e( 'Attribute', 'kentroi-for-wordpress' ); ?></th>
						<th><?php esc_html_e( 'Description', 'kentroi-for-wordpress' ); ?></th>
						<th><?php esc_html_e( 'Default', 'kentroi-for-wordpress' ); ?></th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td><code>mode</code></td>
						<td><?php esc_html_e( 'Display mode: inline, popup, or link.', 'kentroi-for-wordpress' ); ?></td>
						<td>inline</td>
					</tr>
					<tr>
						<td><code>type</code></td>
						<td><?php esc_html_e( 'Appointment type ID to show a specific type.', 'kentroi-for-wordpress' ); ?></td>
						<td><?php esc_html_e( '(all types)', 'kentroi-for-wordpress' ); ?></td>
					</tr>
					<tr>
						<td><code>height</code></td>
						<td><?php esc_html_e( 'Height of the widget in pixels (inline mode).', 'kentroi-for-wordpress' ); ?></td>
						<td>600</td>
					</tr>
					<tr>
						<td><code>autoresize</code></td>
						<td><?php esc_html_e( 'Auto-adjust height to content: true or false (inline mode).', 'kentroi-for-wordpress' ); ?></td>
						<td>true</td>
					</tr>
					<tr>
						<td><code>button_text</code></td>
						<td><?php esc_html_e( 'Button text (popup and link modes).', 'kentroi-for-wordpress' ); ?></td>
						<td>Book Appointment</td>
					</tr>
					<tr>
						<td><code>button_class</code></td>
						<td><?php esc_html_e( 'Custom CSS class for the button (popup and link modes).', 'kentroi-for-wordpress' ); ?></td>
						<td><?php esc_html_e( '(none)', 'kentroi-for-wordpress' ); ?></td>
					</tr>
				</tbody>
			</table>
		</div>
	</div>
</div>
