<?php
/*
Plugin Name: Microarea
Plugin URI: http://localhost:8000/
Description: Facturación Clientes
Version: 1.0
Author: Eva Rico
Author URI: http://localhost:8000/
*/

/* Copyright 2021 microarea.ai (email: microarea.ai) */

/** AGREGAR FICHEROS CSS Y JS PARA ADMINISTRACION **/
function micro_admin() {
	wp_register_style('micro-admin-css', 
					  plugins_url('css/sytle-micro-admin.css',__FILE__), 
					  array(), 
					  '1.0', 
					  'screen'
	);
	wp_enqueue_style('micro-admin-css');
	
	wp_register_script('micro-admin-js',
					  plugins_url('js/script-micro-admin.js',__FILE__),
					  array(),
					  '1.0',
					  true
	);
	
	wp_enqueue_script('micro-admin-js');
}
add_action('admin_enqueue_scripts','micro_admin');

/** AGREGAR CSS Y JS PARA EL USUARIO **/
function micro_user() {
	if (!is_admin()) {
		wp_enqueue_script('jquery');
		wp_register_script('micro-user-js',
					  plugins_url('js/script-micro-user.js',__FILE__),
					  array(),
					  '1.0',
					  true
		);
		wp_enqueue_script('micro-user-js');
		wp_register_style('micro-user-css', 
					  plugins_url('css/style-micro-user.css',__FILE__), 
					  array(), 
					  '1.0', 
					  'screen'
		);
		wp_enqueue_style('micro-user-css');
	}
}
add_action('wp_enqueue_scripts','micro_user');

function micro_register_setting() {}

function micro_plugin_sanitize_options($input) {return $input;}

/** ----------------------------------------------------------------------------------------------------------------- **/

/** AGREGAR ENTRADA AL MENU DE ADMINISTRACIÓN DE WP Y PAGINA DE GESTIÓN**/
function micro_admin_menu() {
	add_menu_page(
		'Microarea', 
		'Facturas', 
		'manage_options',
		'micro-plugin', 
		'micro_menu_page', 
		plugins_url('img/micro-plugin.png',__FILE__),
		66
	);
	
	add_action('admin_init','micro_register_setting');
}
function micro_menu_page() {
?>
	<div class="micro_div">
		<h2 class="tituloPrueba">AREA DE ADMINISTRACION</h2>
	</div>
<?php
}
add_action('admin_menu','micro_admin_menu');


/** -------------------------------------------------------------------------------------------------------------- **/

/** CONTENIDO DEL SHORTCODE **/
function microarea_shortcode() {
	$html = '';
	$html .= '<h2 class="tituloPrueba">Contenido del shortcode</h2>';
	return $html;
}
add_shortcode('facturas-microarea','microarea_shortcode');

function microarea_shortcode_parametros($atts='') {
 
      $atributos = shortcode_atts(['par1' => 'par1','par2' => 'par2'], $atts);
	  $html = '';

      if ($atributos['par1'] == 'hola') {
      	 $html .= '<div class="bnn">BANNER BLACK FRIDAY</div>';
      }

       if ($atributos['par2'] == 'par2') {
      	 $html .= '<div class="bnn">BANNER POR DEFECTO</div>';
      }

      return $html;
  }

add_shortcode('facturas-microarea-pars','microarea_shortcode_parametros');

/** CREAMOS UN NUEVO ROL CLIENTES-MICROAREA */

$resultado = add_role(
    'cliente_ma',
    __( 'Cliente Microarea' ),
    array(
        'read'         => true,
        'edit_posts'   => false,
        'delete_posts' => false,
        'read_private_pages' => true,
        'read_private_posts' => true,
    )
);

add_action('check_admin_referer', 'logout_without_confirm', 10, 2);

/** QUITAMOS LA CONFIRMACI��N DE CERRAR SESI��N**/
function logout_without_confirm($action, $result)
{
    /**
     * Allow logout without confirmation
     */
    if ($action == "log-out" && !isset($_GET['_wpnonce'])) {
        $redirect_to = isset($_REQUEST['redirect_to']) ? $_REQUEST['redirect_to'] : 'https://new.microarea.ai';
        $location = str_replace('&amp;', '&', wp_logout_url($redirect_to));
        header("Location: $location");
        die;
    }
}
/**OCULTAR BARRA DE HERRAMIENTAS AL ROL CLIENTES-MICROAREA**/
//Ocultar admin bar a todos los suscriptores
add_action('after_setup_theme', 'bld_ocultar_admin_bar');
function bld_ocultar_admin_bar() {
	if (current_user_can('cliente_ma')) {
		add_filter( 'show_admin_bar', '__return_false' );
	}
}
