<?php
/*Este archivo es parte de childdivi, Divi child theme.

Todas las funciones de este archivo se cargarán antes que las funciones del tema padre.
Aprende más en https://codex.wordpress.org/Child_Themes.

Nota: esta función carga antes la hoja de estilos padre, después la hoja de estilos del tema hijo
(déjalo en su lugar, salvo que sepas lo que estás haciendo).
*/

if ( ! function_exists( 'suffice_child_enqueue_child_styles' ) ) {
	function childdivi_enqueue_child_styles() {
	    // loading parent style
	    wp_register_style(
	      'parente2-style',
	      get_template_directory_uri() . '/style.css'
	    );

	    wp_enqueue_style( 'parente2-style' );
	    // loading child style
	    wp_register_style(
	      'childe2-style',
	      get_stylesheet_directory_uri() . '/style.css'
	    );
	    wp_enqueue_style( 'childe2-style');
	 }
}
add_action( 'wp_enqueue_scripts', 'childdivi_enqueue_child_styles' );

/*Escribe aquí tus propias funciones */

// Habilitar la subida de imágenes en formato SVG en WordPress
function dmc_add_svg_mime_types($mimes) {
	$mimes['svg'] = 'image/svg+xml';
	return $mimes;
}
add_filter('upload_mimes', 'dmc_add_svg_mime_types');
