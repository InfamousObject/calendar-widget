/**
 * Kentroi Admin JavaScript
 *
 * @package Kentroi
 */

(function($) {
	'use strict';

	/**
	 * Copy to clipboard functionality.
	 */
	function initCopyButtons() {
		$('.kentroi-copy-button').on('click', function() {
			var targetId = $(this).data('target');
			var $target = $('#' + targetId);
			var text = $target.text();
			var $button = $(this);

			navigator.clipboard.writeText(text).then(function() {
				var originalText = $button.text();
				$button.text(kentroiAdmin.i18n.copied).addClass('copied');
				setTimeout(function() {
					$button.text(originalText).removeClass('copied');
				}, 2000);
			});
		});
	}

	/**
	 * Shortcode generator for booking page.
	 */
	function initBookingShortcodeGenerator() {
		var $mode = $('#kentroi-booking-mode');
		var $type = $('#kentroi-booking-type');
		var $height = $('#kentroi-booking-height');
		var $autoresize = $('#kentroi-booking-autoresize');
		var $buttonText = $('#kentroi-booking-button-text');
		var $output = $('#kentroi-booking-shortcode');

		var $heightRow = $('#kentroi-height-row');
		var $autoresizeRow = $('#kentroi-autoresize-row');
		var $buttonTextRow = $('#kentroi-button-text-row');

		if (!$output.length) return;

		function updateUI() {
			var mode = $mode.val();

			if (mode === 'inline') {
				$heightRow.show();
				$autoresizeRow.show();
				$buttonTextRow.hide();
			} else {
				// popup or link mode
				$heightRow.hide();
				$autoresizeRow.hide();
				$buttonTextRow.show();
			}
		}

		function updateShortcode() {
			var mode = $mode.val();
			var type = $type.val();
			var height = $height.val() || '600';
			var autoresize = $autoresize.is(':checked');
			var buttonText = $buttonText.val() || 'Book Appointment';

			var shortcode = '[kentroi-booking';

			// Always include mode if not default
			if (mode !== 'inline') {
				shortcode += ' mode="' + mode + '"';
			}

			// Type is always included if set
			if (type) {
				shortcode += ' type="' + type + '"';
			}

			// Mode-specific attributes
			if (mode === 'inline') {
				shortcode += ' height="' + height + '"';
				if (!autoresize) {
					shortcode += ' autoresize="false"';
				}
			} else {
				// popup or link
				if (buttonText !== 'Book Appointment') {
					shortcode += ' button_text="' + buttonText + '"';
				}
			}

			shortcode += ']';
			$output.text(shortcode);
		}

		$mode.on('change', function() {
			updateUI();
			updateShortcode();
		});
		$type.on('change', updateShortcode);
		$height.on('input', updateShortcode);
		$autoresize.on('change', updateShortcode);
		$buttonText.on('input', updateShortcode);

		// Initial state
		updateUI();
		updateShortcode();
	}

	/**
	 * Shortcode generator for forms page.
	 */
	function initFormShortcodeGenerator() {
		var $id = $('#kentroi-form-id');
		var $height = $('#kentroi-form-height');
		var $output = $('#kentroi-form-shortcode');

		if (!$output.length) return;

		function updateShortcode() {
			var id = $id.val();
			var height = $height.val() || '500';

			var shortcode = '[kentroi-form id="' + id + '" height="' + height + '"]';
			$output.text(shortcode);
		}

		$id.on('change', updateShortcode);
		$height.on('input', updateShortcode);
	}

	/**
	 * Shortcode generator for chat page.
	 */
	function initChatShortcodeGenerator() {
		var $mode = $('#kentroi-chat-mode');
		var $position = $('#kentroi-chat-position');
		var $height = $('#kentroi-chat-height');
		var $output = $('#kentroi-chat-shortcode');
		var $positionRow = $('.kentroi-chat-position-row');
		var $heightRow = $('.kentroi-chat-height-row');

		if (!$output.length) return;

		function updateUI() {
			var mode = $mode.val();
			if (mode === 'floating') {
				$position.prop('disabled', false);
				$positionRow.show();
				$heightRow.hide();
			} else {
				$position.prop('disabled', true);
				$positionRow.hide();
				$heightRow.show();
			}
		}

		function updateShortcode() {
			var mode = $mode.val();
			var position = $position.val();
			var height = $height.val() || '500';

			var shortcode = '[kentroi-chat mode="' + mode + '"';
			if (mode === 'floating' && position !== 'bottom-right') {
				shortcode += ' position="' + position + '"';
			}
			if (mode === 'inline') {
				shortcode += ' height="' + height + '"';
			}
			shortcode += ']';

			$output.text(shortcode);
		}

		$mode.on('change', function() {
			updateUI();
			updateShortcode();
		});
		$position.on('change', updateShortcode);
		$height.on('input', updateShortcode);

		// Initial UI state
		updateUI();
	}

	/**
	 * Widget ID validation.
	 */
	function initWidgetIdValidation() {
		var $widgetId = $('#kentroi_widget_id');
		var $status = $('#kentroi-connection-status');

		if (!$widgetId.length || !$status.length) return;

		var debounceTimer;

		$widgetId.on('input', function() {
			clearTimeout(debounceTimer);
			var widgetId = $(this).val().trim();

			if (!widgetId) {
				$status.removeClass('validating connected error').hide();
				return;
			}

			debounceTimer = setTimeout(function() {
				validateWidgetId(widgetId);
			}, 500);
		});

		function validateWidgetId(widgetId) {
			$status
				.removeClass('connected error')
				.addClass('validating')
				.text(kentroiAdmin.i18n.validating)
				.show();

			$.ajax({
				url: kentroiAdmin.restUrl + 'validate',
				method: 'POST',
				headers: {
					'X-WP-Nonce': kentroiAdmin.nonce
				},
				contentType: 'application/json',
				data: JSON.stringify({ widget_id: widgetId }),
				success: function(response) {
					if (response.success && response.data.valid) {
						var message = kentroiAdmin.i18n.connected;
						if (response.data.businessName) {
							message += ' - ' + response.data.businessName;
						}
						$status
							.removeClass('validating error')
							.addClass('connected')
							.text(message);
					} else {
						$status
							.removeClass('validating connected')
							.addClass('error')
							.text(response.message || kentroiAdmin.i18n.disconnected);
					}
				},
				error: function(xhr) {
					var message = kentroiAdmin.i18n.error;
					if (xhr.responseJSON && xhr.responseJSON.message) {
						message = xhr.responseJSON.message;
					}
					$status
						.removeClass('validating connected')
						.addClass('error')
						.text(message);
				}
			});
		}

		// Validate on page load if widget ID exists
		var initialWidgetId = $widgetId.val().trim();
		if (initialWidgetId) {
			validateWidgetId(initialWidgetId);
		}
	}

	/**
	 * Initialize all functionality.
	 */
	$(document).ready(function() {
		initCopyButtons();
		initBookingShortcodeGenerator();
		initFormShortcodeGenerator();
		initChatShortcodeGenerator();
		initWidgetIdValidation();
	});

})(jQuery);
