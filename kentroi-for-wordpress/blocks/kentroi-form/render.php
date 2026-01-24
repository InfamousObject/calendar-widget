<?php
/**
 * Server-side rendering for the Kentroi Form block.
 *
 * @package Kentroi
 *
 * @var array    $attributes Block attributes.
 * @var string   $content    Block content.
 * @var WP_Block $block      Block instance.
 */

// Get attributes with defaults.
$form_id = isset( $attributes['formId'] ) ? sanitize_text_field( $attributes['formId'] ) : '';
$height  = isset( $attributes['height'] ) ? absint( $attributes['height'] ) : 500;

// Validate height.
if ( $height < 200 ) {
	$height = 200;
}
if ( $height > 1500 ) {
	$height = 1500;
}

if ( empty( $form_id ) ) {
	if ( current_user_can( 'manage_options' ) ) {
		echo '<div class="kentroi-error" style="padding: 15px; background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 4px; color: #721c24;">';
		echo esc_html__( 'Form ID is required.', 'kentroi-for-wordpress' );
		echo '</div>';
	}
	return;
}

// Build iframe URL.
$iframe_url = KENTROI_EMBED_URL . '/embed/form/' . rawurlencode( $form_id );

// Check GDPR consent.
$gdpr_enabled = get_option( 'kentroi_gdpr_enabled', false );

$wrapper_attributes = get_block_wrapper_attributes( array( 'class' => 'kentroi-widget-wrapper kentroi-form-widget' ) );

if ( $gdpr_enabled ) {
	echo Kentroi_Privacy::render_consent_placeholder( 'form', $iframe_url, $height );
} else {
	printf(
		'<div %s><iframe src="%s" style="width: 100%%; height: %dpx; border: none;" loading="lazy" allow="payment"></iframe></div>',
		$wrapper_attributes,
		esc_url( $iframe_url ),
		absint( $height )
	);
}
