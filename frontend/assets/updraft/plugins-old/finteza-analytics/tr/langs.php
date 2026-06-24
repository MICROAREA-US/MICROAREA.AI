<?php

if ( ! defined( 'ABSPATH' ) )
	exit;

if ( ! class_exists( '_WP_Editors' ) ) {
	require ABSPATH . WPINC . '/class-wp-editor.php';
}

function finteza_analytics_tinymce_plugin_translation() {
	$strings    = array(
		'button.title'      => __( 'Add an event in Finteza', 'finteza' ),
		'input.placeholder' => __( 'Event name', 'finteza' ),
		'input.label'       => __( 'The event name to be used in statistics records', 'finteza' ),
		'modal.title'       => __( 'Add an event in Finteza', 'finteza' ),
	);
	$locale     = _WP_Editors::$mce_locale;
	$translated = 'tinyMCE.addI18n("' . $locale . '.fintezaEventTracker", ' . wp_json_encode( $strings ) . ");\n";

	return $translated;
}

$strings = finteza_analytics_tinymce_plugin_translation();
