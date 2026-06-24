<?php

function finteza_analytics_register_buttons_editor( $buttons ) {
	array_push( $buttons, 'fintezaEventTracker.setEventBtn' );
	return $buttons;
}

add_filter( 'mce_buttons', 'finteza_analytics_register_buttons_editor' );

function finteza_analytics_enqueue_plugin_scripts( $plugin_array ) {
	$plugin_array['fintezaEventTracker'] = plugin_dir_url( __FILE__ ) . 'js/tinymce_plugin.js';
	return $plugin_array;
}

add_filter( 'mce_external_plugins', 'finteza_analytics_enqueue_plugin_scripts' );

function finteza_analytics_load_tinymce_languages( $locales ) {
	$locales['fintezaEventTracker'] = plugin_dir_path( __FILE__ ) . 'langs.php';
	return $locales;
}

add_filter( 'mce_external_languages', 'finteza_analytics_load_tinymce_languages');

function finteza_analytics_add_mce_custom_locale() {
	?>
	<script type='text/javascript'>
		tinyMCE.addI18n('<?php echo explode('_', get_user_locale())[0]; ?>.fintezaEventTracker',
			{
				'button.title': '<?php echo __( 'Add an event in Finteza', 'finteza' ); ?>',
				'input.placeholder': '<?php echo __( 'Event name', 'finteza' ); ?>',
				'input.label': '<?php echo __( 'The event name to be used in statistics records', 'finteza' ); ?>',
				'modal.title': '<?php echo __( 'Add an event in Finteza', 'finteza' ); ?>',
			});
	</script>
	<?php
}

// Fix of the Finteza MCE button translation for the versions 5.0.0 and higher.
global $wp_version;

if ( version_compare( $wp_version, '5.0.0' ) >= 0 ) {
	add_action( 'print_default_editor_scripts', 'finteza_analytics_add_mce_custom_locale' );
}
