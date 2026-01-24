<?php
/**
 * Fired when the plugin is uninstalled.
 *
 * @package Kentroi
 */

// If uninstall not called from WordPress, exit.
if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

// Delete plugin options.
delete_option( 'kentroi_widget_id' );
delete_option( 'kentroi_gdpr_enabled' );
delete_option( 'kentroi_gdpr_message' );

// Delete transients.
delete_transient( 'kentroi_connection_status' );
delete_transient( 'kentroi_features' );

// For multisite, clean up each site.
if ( is_multisite() ) {
	$sites = get_sites( array( 'fields' => 'ids' ) );
	foreach ( $sites as $site_id ) {
		switch_to_blog( $site_id );

		delete_option( 'kentroi_widget_id' );
		delete_option( 'kentroi_gdpr_enabled' );
		delete_option( 'kentroi_gdpr_message' );
		delete_transient( 'kentroi_connection_status' );
		delete_transient( 'kentroi_features' );

		restore_current_blog();
	}
}
