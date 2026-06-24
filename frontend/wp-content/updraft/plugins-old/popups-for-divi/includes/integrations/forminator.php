<?php
/**
 * Integration modules provide compatibility with other plugins, or extend the
 * core features of Divi Areas Pro.
 *
 * Integrates with: Forminator
 * Scope: ReCaptcha compatibility
 *
 * @free include file
 * @package PopupsForDivi
 */

defined( 'ABSPATH' ) || exit;

/**
 * Disable the default Divi ReCaptcha module, when a Forminator form with
 * ReCaptcha is found on the current page.
 *
 * Note: This fixes an issue between Divi and Forminator. It's not related to
 * Divi Areas Pro, other than many people reported ReCaptcha issues and blamed
 * DAP for it...
 *
 * @todo -- https://wordpress.org/support/topic/conflict-between-forminator-recaptcha-and-the-plugin-recaptcha/
 *
 * @since 2.3.0
 */
function pfd_integration_forminator_recaptcha_fix() {
	if ( wp_script_is( 'forminator-google-recaptcha' ) ) {
		wp_dequeue_script( 'forminator-google-recaptcha' );

		printf(
			'<script>!function(d,t,s,e,a){e=d.createElement(t);a=d.getElementsByTagName(t)[0];e.async=!0;e.src=s;a.parentNode.insertBefore(e,a)}(document,"script","%s")</script>',
			esc_attr( $GLOBALS['wp_scripts']->registered['forminator-google-recaptcha']->src )
		);
	}
}

add_action( 'wp_footer', 'pfd_integration_forminator_recaptcha_fix', 10 );
