<?php
/**
 * Server-side rendering for the Kentroi Chat block.
 *
 * @package Kentroi
 *
 * @var array    $attributes Block attributes.
 * @var string   $content    Block content.
 * @var WP_Block $block      Block instance.
 */

// Get attributes with defaults.
$mode     = isset( $attributes['mode'] ) && in_array( $attributes['mode'], array( 'inline', 'floating' ), true ) ? $attributes['mode'] : 'inline';
$position = isset( $attributes['position'] ) && in_array( $attributes['position'], array( 'bottom-right', 'bottom-left' ), true ) ? $attributes['position'] : 'bottom-right';
$height   = isset( $attributes['height'] ) ? absint( $attributes['height'] ) : 500;

// Validate height.
if ( $height < 200 ) {
	$height = 200;
}
if ( $height > 1000 ) {
	$height = 1000;
}

// Get widget ID.
$widget_id = get_option( 'kentroi_widget_id', '' );

if ( empty( $widget_id ) ) {
	if ( current_user_can( 'manage_options' ) ) {
		echo '<div class="kentroi-error" style="padding: 15px; background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 4px; color: #721c24;">';
		echo esc_html__( 'Kentroi Widget ID not configured.', 'kentroi-for-wordpress' );
		echo '</div>';
	}
	return;
}

// Build iframe URL.
$iframe_url = KENTROI_EMBED_URL . '/widget/' . rawurlencode( $widget_id );
$iframe_url = add_query_arg( 'view', 'chat', $iframe_url );

if ( 'floating' === $mode ) {
	$iframe_url = add_query_arg( 'mode', 'floating', $iframe_url );
}

// Check GDPR consent.
$gdpr_enabled = get_option( 'kentroi_gdpr_enabled', false );

// Track floating chat to prevent duplicates.
static $floating_chat_rendered = false;

if ( 'floating' === $mode ) {
	if ( $floating_chat_rendered ) {
		return; // Only render one floating chat per page.
	}
	$floating_chat_rendered = true;

	$position_style = 'bottom-right' === $position ? 'right: 20px;' : 'left: 20px;';

	if ( $gdpr_enabled ) {
		$message = get_option( 'kentroi_gdpr_message', __( 'Click to load the booking widget. By loading, you agree to our privacy policy.', 'kentroi-for-wordpress' ) );
		printf(
			'<div class="kentroi-floating-chat kentroi-consent-placeholder" data-iframe-url="%s" data-position="%s" style="position: fixed; bottom: 20px; %s z-index: 9999; width: 300px; background: #fff; border-radius: 12px; box-shadow: 0 4px 24px rgba(0,0,0,0.15); padding: 20px; text-align: center;">
				<p style="margin: 0 0 15px; color: #666; font-size: 14px;">%s</p>
				<button type="button" class="kentroi-consent-button" style="background: #0073aa; color: #fff; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-size: 14px;">%s</button>
			</div>',
			esc_url( $iframe_url ),
			esc_attr( $position ),
			esc_attr( $position_style ),
			esc_html( $message ),
			esc_html__( 'Load Chat', 'kentroi-for-wordpress' )
		);
	} else {
		printf(
			'<div class="kentroi-floating-chat" style="position: fixed; bottom: 20px; %s z-index: 9999;">
				<iframe src="%s" style="width: 400px; height: 600px; border: none; border-radius: 12px; box-shadow: 0 4px 24px rgba(0,0,0,0.15);" loading="lazy" allow="payment"></iframe>
			</div>',
			esc_attr( $position_style ),
			esc_url( $iframe_url )
		);
	}
} else {
	// Inline mode.
	$wrapper_attributes = get_block_wrapper_attributes( array( 'class' => 'kentroi-widget-wrapper kentroi-chat-widget' ) );

	if ( $gdpr_enabled ) {
		echo Kentroi_Privacy::render_consent_placeholder( 'chat', $iframe_url, $height );
	} else {
		printf(
			'<div %s><iframe src="%s" style="width: 100%%; height: %dpx; border: none;" loading="lazy" allow="payment"></iframe></div>',
			$wrapper_attributes,
			esc_url( $iframe_url ),
			absint( $height )
		);
	}
}
