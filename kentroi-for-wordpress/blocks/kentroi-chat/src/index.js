/**
 * Kentroi Chat Block
 */

import { registerBlockType } from '@wordpress/blocks';
import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import { PanelBody, SelectControl, RangeControl, Placeholder } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

registerBlockType('kentroi/chat', {
	edit: function Edit({ attributes, setAttributes }) {
		const { mode, position, height } = attributes;
		const blockProps = useBlockProps();

		const modeOptions = [
			{ label: __('Inline', 'kentroi-for-wordpress'), value: 'inline' },
			{ label: __('Floating', 'kentroi-for-wordpress'), value: 'floating' },
		];

		const positionOptions = [
			{ label: __('Bottom Right', 'kentroi-for-wordpress'), value: 'bottom-right' },
			{ label: __('Bottom Left', 'kentroi-for-wordpress'), value: 'bottom-left' },
		];

		return (
			<>
				<InspectorControls>
					<PanelBody title={__('Chat Settings', 'kentroi-for-wordpress')}>
						<SelectControl
							label={__('Display Mode', 'kentroi-for-wordpress')}
							value={mode}
							options={modeOptions}
							onChange={(value) => setAttributes({ mode: value })}
						/>
						{mode === 'floating' && (
							<SelectControl
								label={__('Position', 'kentroi-for-wordpress')}
								value={position}
								options={positionOptions}
								onChange={(value) => setAttributes({ position: value })}
							/>
						)}
						{mode === 'inline' && (
							<RangeControl
								label={__('Height (pixels)', 'kentroi-for-wordpress')}
								value={height}
								onChange={(value) => setAttributes({ height: value })}
								min={300}
								max={800}
								step={50}
							/>
						)}
					</PanelBody>
				</InspectorControls>
				<div {...blockProps}>
					<Placeholder
						icon="format-chat"
						label={__('Kentroi Chat', 'kentroi-for-wordpress')}
						instructions={mode === 'floating' ? __('Floating chat bubble', 'kentroi-for-wordpress') : __('Inline chat widget', 'kentroi-for-wordpress')}
					/>
				</div>
			</>
		);
	},
});
