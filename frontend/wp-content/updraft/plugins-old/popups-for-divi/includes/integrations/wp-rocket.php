<?php
/**
 * Integration modules provide compatibility with other plugins, or extend the
 * core features of Divi Areas Pro.
 *
 * Integrates with: WP Rocket
 * Scope: Fix compatibility with code minification
 *
 * @free    include file
 * @package PopupsForDivi
 */

defined( 'ABSPATH' ) || exit;

/**
 * Instructs Caching plugins to NOT combine our loader script. Combined scripts are
 * moved to end of the document, which counteracts the entire purpose of the
 * loader...
 *
 * @see   pfd_assets_inject_loader()
 *
 * @since 1.4.5
 *
 * @param array $exclude_list Default exclude list.
 *
 * @return array Extended exclude list.
 */
function pfd_integration_wp_rocket_exclude_inline_content( $exclude_list ) {
	$exclude_list[] = 'window.DiviPopupData=window.DiviAreaConfig=';

	return $exclude_list;
}

// Do not combine the popup loader script with other scripts,
// to preserve the script position.
add_filter(
	'rocket_excluded_inline_js_content',
	'pfd_integration_wp_rocket_exclude_inline_content'
);

// Do not delay the popup loader script.
add_filter(
	'rocket_delay_js_exclusions',
	'pfd_integration_wp_rocket_exclude_inline_content'
);
