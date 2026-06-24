<?php

if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	die;
}

$option_names = array(
	'finteza_settings',
	'finteza_register',
);

foreach ( $option_names as &$name ) {
	delete_option( $name );
	delete_site_option( $name );
}

unset( $name );


