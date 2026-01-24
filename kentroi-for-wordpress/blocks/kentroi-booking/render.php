<?php
/**
 * Server-side rendering for the Kentroi Booking block.
 *
 * @package Kentroi
 *
 * @var array    $attributes Block attributes.
 * @var string   $content    Block content.
 * @var WP_Block $block      Block instance.
 */

// Get attributes with defaults.
$mode             = isset( $attributes['mode'] ) ? sanitize_text_field( $attributes['mode'] ) : 'inline';
$appointment_type = isset( $attributes['appointmentType'] ) ? sanitize_text_field( $attributes['appointmentType'] ) : '';
$height           = isset( $attributes['height'] ) ? absint( $attributes['height'] ) : 600;
$autoresize       = isset( $attributes['autoresize'] ) ? (bool) $attributes['autoresize'] : true;
$button_text      = isset( $attributes['buttonText'] ) ? sanitize_text_field( $attributes['buttonText'] ) : __( 'Book Appointment', 'kentroi-for-wordpress' );
$button_align     = isset( $attributes['buttonAlign'] ) ? sanitize_text_field( $attributes['buttonAlign'] ) : 'left';
$button_size      = isset( $attributes['buttonSize'] ) ? sanitize_text_field( $attributes['buttonSize'] ) : 'medium';
$button_color     = isset( $attributes['buttonColor'] ) ? sanitize_hex_color( $attributes['buttonColor'] ) : '#3b82f6';
$modal_size       = isset( $attributes['modalSize'] ) ? sanitize_text_field( $attributes['modalSize'] ) : 'medium';

// Validate mode.
if ( ! in_array( $mode, array( 'inline', 'popup', 'link' ), true ) ) {
	$mode = 'inline';
}

// Validate button alignment.
if ( ! in_array( $button_align, array( 'left', 'center', 'right' ), true ) ) {
	$button_align = 'left';
}

// Validate button size.
if ( ! in_array( $button_size, array( 'small', 'medium', 'large' ), true ) ) {
	$button_size = 'medium';
}

// Validate modal size.
if ( ! in_array( $modal_size, array( 'small', 'medium', 'large', 'full' ), true ) ) {
	$modal_size = 'medium';
}

// Button size styles.
$button_sizes = array(
	'small'  => 'padding: 8px 16px; font-size: 14px;',
	'medium' => 'padding: 12px 24px; font-size: 16px;',
	'large'  => 'padding: 16px 32px; font-size: 18px;',
);
$button_size_style = $button_sizes[ $button_size ];

// Button alignment styles.
$align_styles = array(
	'left'   => 'justify-content: flex-start;',
	'center' => 'justify-content: center;',
	'right'  => 'justify-content: flex-end;',
);
$align_style = $align_styles[ $button_align ];

// Modal size styles.
$modal_sizes = array(
	'small'  => 'max-width: 400px;',
	'medium' => 'max-width: 500px;',
	'large'  => 'max-width: 600px;',
	'full'   => 'max-width: 95vw; width: 95vw;',
);
$modal_size_style = $modal_sizes[ $modal_size ];

// Validate height.
if ( $height < 200 ) {
	$height = 200;
}
if ( $height > 1500 ) {
	$height = 1500;
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
$iframe_url = KENTROI_EMBED_URL . '/embed/booking/' . rawurlencode( $widget_id );
if ( ! empty( $appointment_type ) ) {
	$iframe_url = add_query_arg( 'type', rawurlencode( $appointment_type ), $iframe_url );
}

// Check GDPR consent.
$gdpr_enabled = get_option( 'kentroi_gdpr_enabled', false );

$wrapper_attributes = get_block_wrapper_attributes( array( 'class' => 'kentroi-widget-wrapper kentroi-booking-widget' ) );

// Render based on mode.
if ( 'link' === $mode ) {
	// Link mode - button that opens in new tab.
	printf(
		'<div %s style="display: flex; %s">
			<a href="%s" target="_blank" rel="noopener" class="kentroi-booking-button" style="background: %s; %s">%s</a>
		</div>',
		$wrapper_attributes,
		esc_attr( $align_style ),
		esc_url( $iframe_url ),
		esc_attr( $button_color ),
		esc_attr( $button_size_style ),
		esc_html( $button_text )
	);
} elseif ( 'popup' === $mode ) {
	// Popup mode - button that opens modal.
	static $popup_id = 0;
	$popup_id++;
	$modal_id = 'kentroi-modal-block-' . $popup_id;

	printf(
		'<div %s style="display: flex; %s">
			<button type="button" class="kentroi-booking-button" style="background: %s; %s" onclick="document.getElementById(\'%s\').style.display=\'flex\'">%s</button>
			<div id="%s" class="kentroi-modal" style="display:none; position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.7); z-index:99999; justify-content:center; align-items:center; padding:20px;">
				<div class="kentroi-modal-content" style="background:#fff; border-radius:12px; width:100%%; %s max-height:90vh; overflow:hidden; position:relative; box-shadow:0 4px 24px rgba(0,0,0,0.3);">
					<button type="button" onclick="document.getElementById(\'%s\').style.display=\'none\'" style="position:absolute; top:10px; right:10px; background:none; border:none; font-size:24px; cursor:pointer; z-index:10; color:#666;">&times;</button>
					<iframe src="%s" style="width:100%%; height:80vh; border:none;" allow="payment"></iframe>
				</div>
			</div>
			<script>
			document.getElementById("%s").addEventListener("click", function(e) {
				if (e.target === this) this.style.display = "none";
			});
			</script>
		</div>',
		$wrapper_attributes,
		esc_attr( $align_style ),
		esc_attr( $button_color ),
		esc_attr( $button_size_style ),
		esc_attr( $modal_id ),
		esc_html( $button_text ),
		esc_attr( $modal_id ),
		esc_attr( $modal_size_style ),
		esc_attr( $modal_id ),
		esc_url( $iframe_url ),
		esc_attr( $modal_id )
	);
} else {
	// Inline mode.
	if ( $gdpr_enabled ) {
		echo Kentroi_Privacy::render_consent_placeholder( 'booking', $iframe_url, $height );
	} elseif ( $autoresize ) {
		// Auto-resize enabled.
		$iframe_id = 'kentroi-iframe-block-' . wp_rand( 1000, 9999 );
		printf(
			'<div %s>
				<iframe id="%s" src="%s" style="width: 100%%; min-height: %dpx; height: %dpx; border: none; overflow: hidden;" loading="lazy" allow="payment" scrolling="no"></iframe>
			</div>
			<script>
			(function() {
				var iframe = document.getElementById("%s");
				window.addEventListener("message", function(e) {
					if (e.data && e.data.type === "kentroi-resize" && e.data.height) {
						iframe.style.height = (e.data.height + 20) + "px";
					}
				});
			})();
			</script>',
			$wrapper_attributes,
			esc_attr( $iframe_id ),
			esc_url( $iframe_url ),
			absint( $height ),
			absint( $height ),
			esc_attr( $iframe_id )
		);
	} else {
		// Fixed height.
		printf(
			'<div %s><iframe src="%s" style="width: 100%%; height: %dpx; border: none;" loading="lazy" allow="payment"></iframe></div>',
			$wrapper_attributes,
			esc_url( $iframe_url ),
			absint( $height )
		);
	}
}
