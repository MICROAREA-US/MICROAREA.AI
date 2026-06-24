<?php
/*
Plugin Name: My Wordpress Login Logo
Plugin URI: https://afsal.me
Description: My Wordpress Login Logo lets you to add a custom logo in your wordpress login page instead of the usual wordpress logo.
Version: 2.5.2
Tested up to: 6.9.1
Author: Afsal Rahim
Author URI: https://afsal.me
*/

if (!defined('DC_MyWP_LoginLogo_URL'))
	define('DC_MyWP_LoginLogo_URL', plugin_dir_url(__FILE__));
if (!defined('DC_MyWP_LoginLogo_PATH'))
	define('DC_MyWP_LoginLogo_PATH', plugin_dir_path(__FILE__));

class DC_MyWP_LoginLogo
{

	function __construct()
	{
		add_action('login_head', array($this, 'DC_MyWP_login_logo'));
		add_action('login_head', array($this, 'DC_MyWP_login_fadein'));
		add_action('login_form', array($this, 'DC_MyWP_login_form_message'));
		add_action('admin_menu', array($this, 'DC_MyWP_login_logo_actions'));

		add_filter('login_headerurl', array($this, 'DC_MyWP_login_url'));

		// login_headertitle is deprecated above wp_version 5.2
		if (version_compare($GLOBALS['wp_version'], '5.2', '<')) {
			add_filter('login_headertitle', array($this, 'DC_MyWP_login_title'));
		} else {
			add_filter('login_headertext', array($this, 'DC_MyWP_login_title'));
		}
	}

	function DC_MyWP_login_logo()
	{
		include_once(DC_MyWP_LoginLogo_PATH . '/core/custom-styles.php');
	}

	function DC_MyWP_login_url()
	{
		$custom_login_url = esc_url(get_option('wp_custom_login_url', home_url()));
		return $custom_login_url;
	}

	function DC_MyWP_login_title()
	{
		$custom_login_title = sanitize_text_field(get_option('wp_custom_login_title', get_bloginfo('description')));
		return $custom_login_title;
	}

	function DC_MyWP_login_fadein()
	{
		include_once(DC_MyWP_LoginLogo_PATH . '/core/custom-js.php');
	}

	function DC_MyWP_login_form_message()
	{
		$custom_logo_message = esc_html(get_option('wp_custom_login_logo_message', ''));
		if ($custom_logo_message != '') {
			echo '<p>' . $custom_logo_message . '</p><br/>';
		}
	}

	function DC_MyWP_login_logo_options()
	{
		require(DC_MyWP_LoginLogo_PATH . '/views/dashboard.php');
	}

	function DC_MyWP_login_logo_actions()
	{
		add_menu_page('Login Logo', 'Login Logo', 'manage_options', 'DC_MyWP_login_logo_dashboard', array($this, 'DC_MyWP_login_logo_options'));

		/* Add settings link on plugins page*/
		add_filter('plugin_action_links_' . plugin_basename(__FILE__), 'DC_MyWP_add_settings_link');
		function DC_MyWP_add_settings_link($links)
		{
			$settings_link = array('<a href="' . admin_url('admin.php?page=DC_MyWP_login_logo_dashboard') . ', ">Settings</a>');
			return array_merge($links, $settings_link);
		}
	}
}
$MyWordpressLoginLogo = new DC_MyWP_LoginLogo();
