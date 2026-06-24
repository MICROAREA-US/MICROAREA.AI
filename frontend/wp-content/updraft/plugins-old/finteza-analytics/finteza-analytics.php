<?php
/**
 * Plugin Name: Finteza Analytics
 * Plugin URI: https://wordpress.org/plugins/finteza-analytics
 * Description: Enable Finteza Analytics on your WordPress site.
 * Author: finteza
 * Author URI: https://www.finteza.com
 * Version: 1.3
 * Version Date: 19 Apr 2019
 * License: GPLv2 (or later)
 * License URI: http://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: finteza
 * Domain Path: /languages
 */

if ( ! defined( 'FINTEZA_ANALYTICS_WEBSITE_URL' ) ) define('FINTEZA_ANALYTICS_WEBSITE_URL', 'https://www.finteza.com?utm_source=wordpress.admin&utm_medium=link&utm_term=finteza.website&utm_content=finteza.plugin.wordpress&utm_campaign=finteza.wordpress' );
if ( ! defined( 'FINTEZA_ANALYTICS_REGISTRATION_URL' ) ) define( 'FINTEZA_ANALYTICS_REGISTRATION_URL', 'https://www.finteza.com?utm_source=wordpress.admin&utm_medium=link&utm_term=finteza.website&utm_content=finteza.plugin.wordpress&utm_campaign=finteza.wordpress' );
if ( ! defined( 'FINTEZA_ANALYTICS_DEMO_URL' ) ) define( 'FINTEZA_ANALYTICS_DEMO_URL', 'https://panel.finteza.com/login?login=demo@finteza.com&pass=fintezademo7&utm_source=wordpress.admin&utm_medium=link&utm_content=finteza.plugin.wordpress&utm_term=finteza.demo&utm_campaign=finteza.wordpress' );
if ( ! defined( 'FINTEZA_ANALYTICS_STATS_URL' ) ) define( 'FINTEZA_ANALYTICS_STATS_URL', 'https://panel.finteza.com?utm_source=wordpress.admin&utm_medium=link&utm_content=finteza.plugin.wordpress&utm_term=finteza.panel&utm_campaign=finteza.wordpress' );
if ( ! defined( 'FINTEZA_ANALYTICS_API_URL' ) ) define( 'FINTEZA_ANALYTICS_API_URL', 'https://panel.finteza.com/register?utm_source=wordpress.admin&utm_term=finteza.register&utm_content=finteza.plugin.wordpress&utm_campaign=finteza.wordpress' );
if ( ! defined( 'FINTEZA_ANALYTICS_URL' ) )          define( 'FINTEZA_ANALYTICS_URL', plugin_dir_url( __FILE__ ) );
if ( ! defined( 'FINTEZA_ANALYTICS_DIR' ) )          define( 'FINTEZA_ANALYTICS_DIR', plugin_dir_path( __FILE__ ) );
if ( ! defined( 'FINTEZA_ANALYTICS_FILE' ) )         define( 'FINTEZA_ANALYTICS_FILE', plugin_basename( __FILE__ ) );
if ( ! defined( 'FINTEZA_ANALYTICS_SLUG' ) )         define( 'FINTEZA_ANALYTICS_SLUG', basename( dirname( __FILE__ ) ) );
if ( ! defined( 'FINTEZA_ANALYTICS_TRACK_INSTALL_URL' ) ) define( 'FINTEZA_ANALYTICS_TRACK_INSTALL_URL', 'https://content.mql5.com/tr?event=Plugin%2BWordpress%2BActivate&id=cbgspzdebnimbhhkhankjnebjfajvaceho&ref=https%3A%2F%2Fwww.finteza.com%2F' );
if ( ! defined( 'FINTEZA_ANALYTICS_TRACK_UNINSTALL_URL' ) ) define( 'FINTEZA_ANALYTICS_TRACK_UNINSTALL_URL', 'https://content.mql5.com/tr?event=Plugin%2BWordpress%2BDeactivate&id=cbgspzdebnimbhhkhankjnebjfajvaceho&ref=https%3A%2F%2Fwww.finteza.com%2F' );

require_once FINTEZA_ANALYTICS_DIR . 'tr/main.php';

register_activation_hook( __FILE__, array( 'Finteza_Analytics_Plugin', 'activate' ) );
register_deactivation_hook( __FILE__, array( 'Finteza_Analytics_Plugin', 'deactivate' ) );

/**
 * Entry point class
 */
class Finteza_Analytics_Plugin {
	/**
	 * Setup WordPress hooks
	 */
	public function __construct() {
		add_action( 'init', array( $this, 'init' ) );
		add_action( 'admin_init', array( $this, 'admin_init' ) );
		add_action( 'admin_menu', array( $this, 'admin_menu' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'admin_enqueue_scripts' ) );
		add_action( 'wp_head', array( $this, 'wp_head' ) );
		add_action( 'pre_update_option_finteza_register', array( $this, 'pre_update_option_finteza_register' ), 10, 2 );
		add_action( 'pre_update_option_finteza_settings', array( $this, 'pre_update_option_finteza_settings' ), 10, 2 );
		add_action( 'parse_request', array( $this, 'proxy_finteza_requests' ) );
	}

	/**
	 * Initialize plugin
	 */
	public function init() {
		$this->is_reg_needed = ! get_option( 'finteza_settings' )['website_id'];

		load_plugin_textdomain( 'finteza', false, dirname( plugin_basename( __FILE__ ) ) . '/languages/' );
	}

	/**
	 * Registering the plugin setting. Settings are saving in an Array.
	 */
	public function admin_init() {
		require_once FINTEZA_ANALYTICS_DIR . 'inc/input-settings.php';
		require_once FINTEZA_ANALYTICS_DIR . 'inc/input-register.php';

		register_setting( 'finteza_settings', 'finteza_settings', 'sanitize_callback' );
		add_settings_section( 'finteza_settings_id', '', '', 'finteza_settings_section' );
		add_settings_field( 'finteza_api-id', __( 'Website ID', 'finteza' ), 'finteza_analytics_api', 'finteza_settings_section', 'finteza_settings_id' );
		add_settings_field( 'finteza_tracking-id', __( 'Tracking settings', 'finteza' ), 'finteza_analytics_tracking', 'finteza_settings_section', 'finteza_settings_id' );
		add_settings_field( 'finteza_proxy-token', __( 'Proxy token', 'finteza' ), 'finteza_analytics_proxy_token', 'finteza_settings_section', 'finteza_settings_id' );

		register_setting( 'finteza_register', 'finteza_register', 'sanitize_callback' );
		add_settings_section( 'finteza_register_id', '', '', 'finteza_register_section' );
		add_settings_field( 'finteza_domain-id', __( 'Domain', 'finteza' ), 'finteza_analytics_domain', 'finteza_register_section', 'finteza_register_id', [ 'class' => 'hidden' ] );
		add_settings_field( 'finteza_offset-id', __( 'UTC offset', 'finteza' ), 'finteza_analytics_offset', 'finteza_register_section', 'finteza_register_id', [ 'class' => 'hidden' ] );
		add_settings_field( 'finteza_name-id', __( 'Your full name', 'finteza' ), 'finteza_analytics_name', 'finteza_register_section', 'finteza_register_id' );
		add_settings_field( 'finteza_company-id', __( 'Company', 'finteza' ), 'finteza_analytics_company', 'finteza_register_section', 'finteza_register_id' );
		add_settings_field( 'finteza_email-id', __( 'Email', 'finteza' ), 'finteza_analytics_email', 'finteza_register_section', 'finteza_register_id' );
		add_settings_field( 'finteza_password-id', __( 'Password', 'finteza' ), 'finteza_analytics_password', 'finteza_register_section', 'finteza_register_id' );
		add_settings_field( 'finteza_policy-id', '', 'finteza_analytics_policy', 'finteza_register_section', 'finteza_register_id' );

	}

	/**
	 * Setup administrator menu
	 */
	public function admin_menu() {
		$title_page = esc_html__( 'Finteza Analytics', 'finteza' );
		$title_menu = esc_html__( 'Finteza Analytics', 'finteza' );

		add_options_page( $title_page, $title_menu, 'manage_options', 'finteza_settings', array( $this, 'render_settings' ) );
	}

	/**
	 * Provide admin UI assets
	 */
	public function admin_enqueue_scripts() {
		$info = self::get_fz_info();

		wp_enqueue_style( 'finteza', FINTEZA_ANALYTICS_URL . 'css/settings.css', array(), $info['version'] );
		wp_enqueue_script( 'fintza', FINTEZA_ANALYTICS_URL . 'js/settings.js', array( 'jquery' ), $info['version'] );
	}

	/**
	 * Provide page head content
	 */
	public function wp_head() {
		$settings      = get_option( 'finteza_settings' ) ? get_option( 'finteza_settings' ) : [];
		$website_id    = isset( $settings['website_id'] ) ? $settings['website_id'] : '';
		$track_hash    = array_key_exists( 'track_hash', $settings ) && $settings['track_hash'] ? 'true' : 'false';
		$track_links   = array_key_exists( 'track_links', $settings ) && $settings['track_links'] ? 'true' : 'false';
		$time_on_page  = array_key_exists( 'time_on_page', $settings ) && $settings['time_on_page'] ? 'true' : 'false';
		$ignore_admins = array_key_exists( 'ignore_admins', $settings ) && $settings['ignore_admins'] ? 'true' : 'false';
		$core_url      = array_key_exists( 'use_proxy', $settings ) && $settings['use_proxy'] && get_option( 'permalink_structure' ) ? site_url( '/fz/core.js' ) : 'https://content.mql5.com/core.js';

		if ( $this->is_reg_needed || ( is_user_logged_in() && $ignore_admins == 'true' ) ) {
			return;
		}

		$html = file_get_contents( plugin_dir_path( __FILE__ ) . 'templates/tracker.html' );

		$html = str_replace( '$coreUrl', $core_url, $html );
		$html = str_replace( '$websiteId', htmlspecialchars( $website_id, ENT_QUOTES ), $html );
		$html = str_replace( '$trackHash', $track_hash, $html );
		$html = str_replace( '$trackLinks', $track_links, $html );
		$html = str_replace( '$timeOnPage', $time_on_page, $html );

		echo $html;
	}

	/**
	 * Handle registration form data
	 *
	 * @param Array $values received form data.
	 * @param Array $old_values saved form data.
	 */
	public function pre_update_option_finteza_register( $values, $old_values ) {
		$registration = $this->api_register_website(
			array(
				'email'      => $values['finteza_email'],
				'password'   => $values['finteza_password'],
				'website'    => $values['finteza_domain'],
				'fullname'   => $values['finteza_name'],
				'company'    => $values['finteza_company'],
				'utc_offset' => $values['finteza_offset'],
			)
		);

		$values['finteza_password'] = null;

		if ( $registration && 1 === $registration->status ) {
			$settings               = get_option( 'finteza_settings', self::default_settings() );
			$settings['website_id'] = $registration->website;

			update_option( 'finteza_settings', $settings );
			header( 'Location: ' . admin_url( 'options-general.php?page=finteza_settings&registration_complete=1' ) );
			die();
		} elseif ( $registration && 0 === $registration->status ) {
			switch ( $registration->error ) {
				case 1:
					add_settings_error( 'finteza_register', '', __( 'an account with this email address already exists', 'finteza' ) );
					break;
				case 2:
					add_settings_error( 'finteza_register', '', __( 'invalid email address', 'finteza' ) );
					break;
				case 3:
					add_settings_error( 'finteza_register', '', __( 'Registration error.email_invalid', 'finteza' ) );
					break;
				case 4:
					add_settings_error( 'finteza_register', '', __( 'a company with this name already exists', 'finteza' ) );
					break;
				case 5:
					add_settings_error( 'finteza_register', '', __( 'invalid website address', 'finteza' ) );
					break;
				case 6:
					add_settings_error( 'finteza_register', '', __( 'registration limit exceeded', 'finteza' ) );
					break;
			}
		} else {
			add_settings_error( 'finteza_register', '', __( 'Registration error', 'finteza' ) );
		}

		return $values;
	}

	/**
	 * Handle settings form data
	 *
	 * @param Array $values received form data.
	 * @param Array $old_values saved form data.
	 */
	public function pre_update_option_finteza_settings( $values, $old_values ) {
		if ( empty( $values['proxy_token'] ) ) {
			$values['proxy_token'] = $old_values['proxy_token'];
		}

		return $values;
	}

	public function render_settings() {
		require_once FINTEZA_ANALYTICS_DIR . 'inc/settings-display.php';
	}

	public function proxy_finteza_requests() {
		$url        = $_SERVER['REQUEST_URI'];
		$path       = wp_parse_url( $url, PHP_URL_PATH );
		$proxy_path = wp_parse_url( site_url( '/fz' ), PHP_URL_PATH );

		if ( strpos( $path . '/', $proxy_path . '/' ) !== 0 ) {
			return;
		}

		$settings           = get_option( 'finteza_settings' ) ? get_option( 'finteza_settings' ) : [];
		$use_proxy          = array_key_exists( 'use_proxy', $settings ) && $settings['use_proxy'];

		if ( $this->is_reg_needed || ! $use_proxy ) {
			return;
		}

		$proxy_token = array_key_exists( 'proxy_token', $settings ) ? $settings['proxy_token'] : '';

		require_once FINTEZA_ANALYTICS_DIR . 'lib/finteza-analytics.php';

		FintezaAnalytics::proxy(
			array(
				'path'  => $proxy_path,
				'token' => $proxy_token,
			)
		);
	}

	private function api_register_website( $registration ) {
		$url = add_query_arg( 'back_ref', get_bloginfo( 'url' ), FINTEZA_ANALYTICS_API_URL );

		$response = wp_remote_post(
			$url,
			array(
				'headers' => array( 'X-Requested-With' => 'XMLHttpRequest' ),
				'body'    => $registration,
			)
		);
		if ( 200 !== wp_remote_retrieve_response_code( $response ) ) {
			return null;
		}

		return json_decode( wp_remote_retrieve_body( $response ) );
	}

	/**
	 * Activation hook
	 */
	public static function activate() {
		set_transient( 'vpt_flush', 1, 60 );

		wp_remote_get(
			FINTEZA_ANALYTICS_TRACK_INSTALL_URL,
			array(
				'headers' => array(
					'user-agent' => self::user_agent(),
				),
			)
		);
	}

	/**
	 * Deactivation hook
	 */
	public static function deactivate() {
		wp_remote_get(
			FINTEZA_ANALYTICS_TRACK_UNINSTALL_URL,
			array(
				'headers' => array(
					'user-agent' => self::user_agent(),
				),
			)
		);
	}

	/**
	 * Build custom user agent
	 */
	public static function user_agent() {
		return 'WordPress/' . get_bloginfo( 'version' ) . '; ' . get_bloginfo( 'url' );
	}

	/**
	 * Returns plugin information
	 */
	public static function get_fz_info() {
		return get_file_data(
			__FILE__,
			[
				'plugin_name'  => 'Plugin Name',
				'version'      => 'Version',
				'version_date' => 'Version Date',
			],
			false
		);
	}

	public static function default_settings() {
		return array(
			'website_id'    => '',
			'track_hash'    => 0,
			'track_links'   => 1,
			'time_on_page'  => 0,
			'ignore_admins' => 1,
			'use_proxy'     => 0,
			'proxy_token'   => '',
		);
	}
}

$GLOBALS['finteza_plugin', ] = new Finteza_Analytics_Plugin();
