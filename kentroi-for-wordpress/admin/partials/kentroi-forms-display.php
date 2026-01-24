<?php
/**
 * Admin forms page template.
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
			<h2><?php esc_html_e( 'Contact Form Shortcode', 'kentroi-for-wordpress' ); ?></h2>
			<p><?php esc_html_e( 'Use the shortcode below to embed a contact form on any page or post.', 'kentroi-for-wordpress' ); ?></p>

			<div class="kentroi-shortcode-generator">
				<h3><?php esc_html_e( 'Options', 'kentroi-for-wordpress' ); ?></h3>

				<table class="form-table">
					<tr>
						<th scope="row">
							<label for="kentroi-form-id"><?php esc_html_e( 'Form', 'kentroi-for-wordpress' ); ?></label>
						</th>
						<td>
							<select id="kentroi-form-id" class="kentroi-shortcode-option" data-attr="id" required>
								<option value=""><?php esc_html_e( '-- Select Form --', 'kentroi-for-wordpress' ); ?></option>
								<?php if ( ! empty( $forms ) ) : ?>
									<?php foreach ( $forms as $form ) : ?>
										<option value="<?php echo esc_attr( $form['id'] ); ?>">
											<?php echo esc_html( $form['name'] ); ?>
										</option>
									<?php endforeach; ?>
								<?php endif; ?>
							</select>
							<p class="description"><?php esc_html_e( 'Select the form to embed.', 'kentroi-for-wordpress' ); ?></p>
						</td>
					</tr>
					<tr>
						<th scope="row">
							<label for="kentroi-form-height"><?php esc_html_e( 'Height (pixels)', 'kentroi-for-wordpress' ); ?></label>
						</th>
						<td>
							<input type="number" id="kentroi-form-height" class="kentroi-shortcode-option small-text" data-attr="height" value="500" min="200" max="1200">
							<p class="description"><?php esc_html_e( 'Height of the form in pixels.', 'kentroi-for-wordpress' ); ?></p>
						</td>
					</tr>
				</table>

				<h3><?php esc_html_e( 'Generated Shortcode', 'kentroi-for-wordpress' ); ?></h3>
				<div class="kentroi-shortcode-output">
					<code id="kentroi-form-shortcode">[kentroi-form id="" height="500"]</code>
					<button type="button" class="button kentroi-copy-button" data-target="kentroi-form-shortcode">
						<?php esc_html_e( 'Copy', 'kentroi-for-wordpress' ); ?>
					</button>
				</div>
			</div>
		</div>

		<div class="kentroi-card">
			<h2><?php esc_html_e( 'Gutenberg Block', 'kentroi-for-wordpress' ); ?></h2>
			<p><?php esc_html_e( 'You can also use the Kentroi Form block in the block editor. Search for "Kentroi Form" when adding a new block.', 'kentroi-for-wordpress' ); ?></p>
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
						<td><code>id</code></td>
						<td><?php esc_html_e( 'Form ID (required).', 'kentroi-for-wordpress' ); ?></td>
						<td>-</td>
					</tr>
					<tr>
						<td><code>height</code></td>
						<td><?php esc_html_e( 'Height of the form in pixels.', 'kentroi-for-wordpress' ); ?></td>
						<td>500</td>
					</tr>
				</tbody>
			</table>
		</div>

		<?php if ( empty( $forms ) ) : ?>
		<div class="kentroi-card kentroi-notice-card">
			<h2><?php esc_html_e( 'No Forms Found', 'kentroi-for-wordpress' ); ?></h2>
			<p>
				<?php
				printf(
					/* translators: %s: Kentroi forms URL */
					esc_html__( 'You don\'t have any forms yet. %s to get started.', 'kentroi-for-wordpress' ),
					'<a href="https://kentroi.com/dashboard/forms" target="_blank" rel="noopener noreferrer">' . esc_html__( 'Create a form in Kentroi', 'kentroi-for-wordpress' ) . '</a>'
				);
				?>
			</p>
		</div>
		<?php endif; ?>
	</div>
</div>
