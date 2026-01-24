<?php
/**
 * Admin chat page template.
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
			<h2><?php esc_html_e( 'AI Chatbot Shortcode', 'kentroi-for-wordpress' ); ?></h2>
			<p><?php esc_html_e( 'Use the shortcode below to add an AI chatbot to your site.', 'kentroi-for-wordpress' ); ?></p>

			<div class="kentroi-shortcode-generator">
				<h3><?php esc_html_e( 'Options', 'kentroi-for-wordpress' ); ?></h3>

				<table class="form-table">
					<tr>
						<th scope="row">
							<label for="kentroi-chat-mode"><?php esc_html_e( 'Display Mode', 'kentroi-for-wordpress' ); ?></label>
						</th>
						<td>
							<select id="kentroi-chat-mode" class="kentroi-shortcode-option" data-attr="mode">
								<option value="inline"><?php esc_html_e( 'Inline (embedded in page)', 'kentroi-for-wordpress' ); ?></option>
								<option value="floating"><?php esc_html_e( 'Floating (chat bubble)', 'kentroi-for-wordpress' ); ?></option>
							</select>
							<p class="description"><?php esc_html_e( 'Choose how the chatbot is displayed.', 'kentroi-for-wordpress' ); ?></p>
						</td>
					</tr>
					<tr class="kentroi-chat-position-row">
						<th scope="row">
							<label for="kentroi-chat-position"><?php esc_html_e( 'Position', 'kentroi-for-wordpress' ); ?></label>
						</th>
						<td>
							<select id="kentroi-chat-position" class="kentroi-shortcode-option" data-attr="position" disabled>
								<option value="bottom-right"><?php esc_html_e( 'Bottom Right', 'kentroi-for-wordpress' ); ?></option>
								<option value="bottom-left"><?php esc_html_e( 'Bottom Left', 'kentroi-for-wordpress' ); ?></option>
							</select>
							<p class="description"><?php esc_html_e( 'Position of the floating chat bubble.', 'kentroi-for-wordpress' ); ?></p>
						</td>
					</tr>
					<tr class="kentroi-chat-height-row">
						<th scope="row">
							<label for="kentroi-chat-height"><?php esc_html_e( 'Height (pixels)', 'kentroi-for-wordpress' ); ?></label>
						</th>
						<td>
							<input type="number" id="kentroi-chat-height" class="kentroi-shortcode-option small-text" data-attr="height" value="500" min="300" max="800">
							<p class="description"><?php esc_html_e( 'Height of the inline chat widget.', 'kentroi-for-wordpress' ); ?></p>
						</td>
					</tr>
				</table>

				<h3><?php esc_html_e( 'Generated Shortcode', 'kentroi-for-wordpress' ); ?></h3>
				<div class="kentroi-shortcode-output">
					<code id="kentroi-chat-shortcode">[kentroi-chat mode="inline" height="500"]</code>
					<button type="button" class="button kentroi-copy-button" data-target="kentroi-chat-shortcode">
						<?php esc_html_e( 'Copy', 'kentroi-for-wordpress' ); ?>
					</button>
				</div>
			</div>
		</div>

		<div class="kentroi-card">
			<h2><?php esc_html_e( 'Display Modes', 'kentroi-for-wordpress' ); ?></h2>

			<div class="kentroi-mode-description">
				<h4><?php esc_html_e( 'Inline Mode', 'kentroi-for-wordpress' ); ?></h4>
				<p><?php esc_html_e( 'The chatbot is embedded directly into your page content. Use this when you want the chat to be part of a specific page.', 'kentroi-for-wordpress' ); ?></p>

				<h4><?php esc_html_e( 'Floating Mode', 'kentroi-for-wordpress' ); ?></h4>
				<p><?php esc_html_e( 'A floating chat bubble appears in the corner of your site. Use this for site-wide chat availability. Add the shortcode to your theme footer or use a widget.', 'kentroi-for-wordpress' ); ?></p>
			</div>
		</div>

		<div class="kentroi-card">
			<h2><?php esc_html_e( 'Gutenberg Block', 'kentroi-for-wordpress' ); ?></h2>
			<p><?php esc_html_e( 'You can also use the Kentroi Chat block in the block editor. Search for "Kentroi Chat" when adding a new block.', 'kentroi-for-wordpress' ); ?></p>
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
						<td><?php esc_html_e( 'Display mode: "inline" or "floating".', 'kentroi-for-wordpress' ); ?></td>
						<td>inline</td>
					</tr>
					<tr>
						<td><code>position</code></td>
						<td><?php esc_html_e( 'Floating mode position: "bottom-right" or "bottom-left".', 'kentroi-for-wordpress' ); ?></td>
						<td>bottom-right</td>
					</tr>
					<tr>
						<td><code>height</code></td>
						<td><?php esc_html_e( 'Height of inline chat in pixels.', 'kentroi-for-wordpress' ); ?></td>
						<td>500</td>
					</tr>
				</tbody>
			</table>
		</div>
	</div>
</div>
