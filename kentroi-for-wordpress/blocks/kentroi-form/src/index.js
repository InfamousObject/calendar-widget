/**
 * Kentroi Form Block
 */

import { registerBlockType } from '@wordpress/blocks';
import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import { PanelBody, SelectControl, RangeControl, Placeholder, Spinner } from '@wordpress/components';
import { useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';

registerBlockType('kentroi/form', {
	edit: function Edit({ attributes, setAttributes }) {
		const { formId, height } = attributes;
		const blockProps = useBlockProps();
		const [forms, setForms] = useState([]);
		const [isLoading, setIsLoading] = useState(true);
		const [error, setError] = useState(null);

		useEffect(() => {
			apiFetch({ path: '/kentroi/v1/features' })
				.then((response) => {
					if (response.success && response.data?.forms) {
						setForms(response.data.forms);
					}
					setIsLoading(false);
				})
				.catch((err) => {
					setError(err.message || __('Failed to load', 'kentroi-for-wordpress'));
					setIsLoading(false);
				});
		}, []);

		const formOptions = [
			{ label: __('Select a form...', 'kentroi-for-wordpress'), value: '' },
			...forms.map((form) => ({
				label: form.name,
				value: form.id,
			})),
		];

		return (
			<>
				<InspectorControls>
					<PanelBody title={__('Form Settings', 'kentroi-for-wordpress')}>
						{!isLoading && !error && (
							<SelectControl
								label={__('Form', 'kentroi-for-wordpress')}
								value={formId}
								options={formOptions}
								onChange={(value) => setAttributes({ formId: value })}
							/>
						)}
						<RangeControl
							label={__('Height (pixels)', 'kentroi-for-wordpress')}
							value={height}
							onChange={(value) => setAttributes({ height: value })}
							min={200}
							max={1200}
							step={50}
						/>
					</PanelBody>
				</InspectorControls>
				<div {...blockProps}>
					<Placeholder
						icon="feedback"
						label={__('Kentroi Form', 'kentroi-for-wordpress')}
						instructions={isLoading ? __('Loading...', 'kentroi-for-wordpress') : formId ? __('Form preview', 'kentroi-for-wordpress') : __('Select a form', 'kentroi-for-wordpress')}
					>
						{isLoading && <Spinner />}
					</Placeholder>
				</div>
			</>
		);
	},
});
