/**
 * Kentroi Booking Block
 */

import { registerBlockType } from '@wordpress/blocks';
import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import {
	PanelBody,
	SelectControl,
	RangeControl,
	ToggleControl,
	TextControl,
	Placeholder,
	Spinner,
	ColorPalette,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
} from '@wordpress/components';
import { useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';

registerBlockType('kentroi/booking', {
	edit: function Edit({ attributes, setAttributes }) {
		const { mode, appointmentType, height, autoresize, buttonText, buttonAlign, buttonSize, buttonColor, modalSize } = attributes;
		const blockProps = useBlockProps();
		const [appointmentTypes, setAppointmentTypes] = useState([]);
		const [isLoading, setIsLoading] = useState(true);
		const [error, setError] = useState(null);

		useEffect(() => {
			apiFetch({ path: '/kentroi/v1/features' })
				.then((response) => {
					if (response.success && response.data?.appointmentTypes) {
						setAppointmentTypes(response.data.appointmentTypes);
					}
					setIsLoading(false);
				})
				.catch((err) => {
					setError(err.message || __('Failed to load', 'kentroi-for-wordpress'));
					setIsLoading(false);
				});
		}, []);

		const typeOptions = [
			{ label: __('All Types', 'kentroi-for-wordpress'), value: '' },
			...appointmentTypes.map((type) => ({
				label: type.name,
				value: type.id,
			})),
		];

		const modeOptions = [
			{ label: __('Inline (embedded on page)', 'kentroi-for-wordpress'), value: 'inline' },
			{ label: __('Popup (button opens modal)', 'kentroi-for-wordpress'), value: 'popup' },
			{ label: __('Link (button opens new tab)', 'kentroi-for-wordpress'), value: 'link' },
		];

		const modalSizeOptions = [
			{ label: __('Small (400px)', 'kentroi-for-wordpress'), value: 'small' },
			{ label: __('Medium (500px)', 'kentroi-for-wordpress'), value: 'medium' },
			{ label: __('Large (600px)', 'kentroi-for-wordpress'), value: 'large' },
			{ label: __('Full Width', 'kentroi-for-wordpress'), value: 'full' },
		];

		const buttonColors = [
			{ name: 'Blue', color: '#3b82f6' },
			{ name: 'Green', color: '#22c55e' },
			{ name: 'Purple', color: '#8b5cf6' },
			{ name: 'Red', color: '#ef4444' },
			{ name: 'Orange', color: '#f97316' },
			{ name: 'Gray', color: '#6b7280' },
			{ name: 'Black', color: '#1f2937' },
		];

		const isInlineMode = mode === 'inline';
		const isPopupMode = mode === 'popup';

		// Button size styles
		const buttonSizeStyles = {
			small: { padding: '8px 16px', fontSize: '14px' },
			medium: { padding: '12px 24px', fontSize: '16px' },
			large: { padding: '16px 32px', fontSize: '18px' },
		};

		// Button alignment styles
		const alignmentStyles = {
			left: 'flex-start',
			center: 'center',
			right: 'flex-end',
		};

		// Generate preview text based on mode
		const getPreviewText = () => {
			if (isLoading) return __('Loading...', 'kentroi-for-wordpress');
			if (mode === 'popup') return __('Button will open booking in a popup modal', 'kentroi-for-wordpress');
			if (mode === 'link') return __('Button will open booking in a new tab', 'kentroi-for-wordpress');
			return __('Booking widget will display here', 'kentroi-for-wordpress');
		};

		return (
			<>
				<InspectorControls>
					<PanelBody title={__('Display Settings', 'kentroi-for-wordpress')}>
						<SelectControl
							label={__('Display Mode', 'kentroi-for-wordpress')}
							value={mode}
							options={modeOptions}
							onChange={(value) => setAttributes({ mode: value })}
							help={
								mode === 'inline'
									? __('Widget is embedded directly on the page.', 'kentroi-for-wordpress')
									: mode === 'popup'
									? __('Shows a button that opens the booking form in a modal overlay.', 'kentroi-for-wordpress')
									: __('Shows a button that opens the booking page in a new tab.', 'kentroi-for-wordpress')
							}
						/>

						{isInlineMode && (
							<>
								<ToggleControl
									label={__('Auto-resize', 'kentroi-for-wordpress')}
									checked={autoresize}
									onChange={(value) => setAttributes({ autoresize: value })}
									help={__('Automatically adjust height to fit content. Prevents scrolling inside the widget.', 'kentroi-for-wordpress')}
								/>
								<RangeControl
									label={autoresize ? __('Minimum Height (pixels)', 'kentroi-for-wordpress') : __('Height (pixels)', 'kentroi-for-wordpress')}
									value={height}
									onChange={(value) => setAttributes({ height: value })}
									min={300}
									max={1200}
									step={50}
								/>
							</>
						)}

						{isPopupMode && (
							<SelectControl
								label={__('Modal Size', 'kentroi-for-wordpress')}
								value={modalSize}
								options={modalSizeOptions}
								onChange={(value) => setAttributes({ modalSize: value })}
							/>
						)}
					</PanelBody>

					{!isInlineMode && (
						<PanelBody title={__('Button Settings', 'kentroi-for-wordpress')}>
							<TextControl
								label={__('Button Text', 'kentroi-for-wordpress')}
								value={buttonText}
								onChange={(value) => setAttributes({ buttonText: value })}
							/>

							<ToggleGroupControl
								label={__('Alignment', 'kentroi-for-wordpress')}
								value={buttonAlign}
								onChange={(value) => setAttributes({ buttonAlign: value })}
								isBlock
							>
								<ToggleGroupControlOption value="left" label={__('Left', 'kentroi-for-wordpress')} />
								<ToggleGroupControlOption value="center" label={__('Center', 'kentroi-for-wordpress')} />
								<ToggleGroupControlOption value="right" label={__('Right', 'kentroi-for-wordpress')} />
							</ToggleGroupControl>

							<SelectControl
								label={__('Button Size', 'kentroi-for-wordpress')}
								value={buttonSize}
								options={[
									{ label: __('Small', 'kentroi-for-wordpress'), value: 'small' },
									{ label: __('Medium', 'kentroi-for-wordpress'), value: 'medium' },
									{ label: __('Large', 'kentroi-for-wordpress'), value: 'large' },
								]}
								onChange={(value) => setAttributes({ buttonSize: value })}
							/>

							<div style={{ marginTop: '16px' }}>
								<label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
									{__('Button Color', 'kentroi-for-wordpress')}
								</label>
								<ColorPalette
									colors={buttonColors}
									value={buttonColor}
									onChange={(value) => setAttributes({ buttonColor: value || '#3b82f6' })}
								/>
							</div>
						</PanelBody>
					)}

					<PanelBody title={__('Booking Settings', 'kentroi-for-wordpress')} initialOpen={false}>
						{!isLoading && !error && (
							<SelectControl
								label={__('Appointment Type', 'kentroi-for-wordpress')}
								value={appointmentType}
								options={typeOptions}
								onChange={(value) => setAttributes({ appointmentType: value })}
								help={__('Pre-select a specific appointment type or show all.', 'kentroi-for-wordpress')}
							/>
						)}
					</PanelBody>
				</InspectorControls>
				<div {...blockProps}>
					<Placeholder
						icon="calendar-alt"
						label={__('Kentroi Booking', 'kentroi-for-wordpress')}
						instructions={getPreviewText()}
					>
						{isLoading && <Spinner />}
						{!isLoading && !isInlineMode && (
							<div style={{
								width: '100%',
								display: 'flex',
								justifyContent: alignmentStyles[buttonAlign] || 'flex-start',
							}}>
								<div style={{
									display: 'inline-block',
									...buttonSizeStyles[buttonSize],
									background: buttonColor || '#3b82f6',
									color: '#fff',
									borderRadius: '8px',
									fontWeight: '500',
								}}>
									{buttonText || __('Book Appointment', 'kentroi-for-wordpress')}
								</div>
							</div>
						)}
					</Placeholder>
				</div>
			</>
		);
	},
});
