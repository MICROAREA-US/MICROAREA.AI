<?php

namespace QuadLayers\QLWAPP\Controllers;

class Helpers {

	protected static $instance;

	private function __construct() {
		add_action( 'admin_enqueue_scripts', array( $this, 'register_scripts' ) );
	}

	public function register_scripts() {
		$helpers          = include QLWAPP_PLUGIN_DIR . 'build/helpers/js/index.asset.php';
		$timezone_options = qlwapp_get_timezone_options();
		/**
		 * Register helpers assets
		 */
		wp_register_script(
			'qlwapp-helpers',
			plugins_url( '/build/helpers/js/index.js', QLWAPP_PLUGIN_FILE ),
			$helpers['dependencies'],
			$helpers['version'],
			true
		);

		global $wp_version;

		$contact_entity  = new \QuadLayers\QLWAPP\Entities\Contact();
		$default_contact = $contact_entity->getProperties();

		$button_entity  = new \QuadLayers\QLWAPP\Entities\Button();
		$default_button = $button_entity->getProperties();

		$box_entity  = new \QuadLayers\QLWAPP\Entities\Box();
		$default_box = $box_entity->getProperties();

		$display_entity  = new \QuadLayers\QLWAPP\Entities\Display();
		$default_display = $display_entity->getProperties();

		$scheme_entity  = new \QuadLayers\QLWAPP\Entities\Scheme();
		$default_scheme = $scheme_entity->getProperties();

		$settings_entity  = new \QuadLayers\QLWAPP\Entities\Settings();
		$default_settings = $settings_entity->getProperties();

		$woocommerce_entity  = new \QuadLayers\QLWAPP\Entities\WooCommerce();
		$default_woocommerce = $woocommerce_entity->getProperties();

		$woocommerce_archives_entity  = new \QuadLayers\QLWAPP\Entities\WooCommerce_Archives();
		$default_woocommerce_archives = $woocommerce_archives_entity->getProperties();

		if ( isset( $default_contact['id'] ) ) {
			$default_contact['id'] = null;
		}

		$ab_upgrade_group = get_option( 'qlwapp_ab_upgrade_group' );
		if ( false === $ab_upgrade_group ) {
			$ab_upgrade_group = ( wp_rand( 0, 1 ) === 0 ) ? 'control' : 'variant';
			update_option( 'qlwapp_ab_upgrade_group', $ab_upgrade_group, true );
		}

		wp_localize_script(
			'qlwapp-helpers',
			'qlwappHelpers',
			array(
				'WP_LANGUAGE'                           => get_locale(),
				'WP_STATUSES'                           => get_post_statuses(),
				'WP_VERSION'                            => $wp_version,
				'QLWAPP_PLUGIN_URL'                     => plugins_url( '/', QLWAPP_PLUGIN_FILE ),
				'QLWAPP_PLUGIN_NAME'                    => QLWAPP_PLUGIN_NAME,
				'QLWAPP_PLUGIN_VERSION'                 => QLWAPP_PLUGIN_VERSION,
				'QLWAPP_PLUGIN_FILE'                    => QLWAPP_PLUGIN_FILE,
				'QLWAPP_PLUGIN_DIR'                     => QLWAPP_PLUGIN_DIR,
				'QLWAPP_TIMEZONE_OPTIONS'               => $timezone_options,
				'QLWAPP_MESSAGE_REPLACEMENTS'           => qlwapp_get_replacements_text(),
				'QLWAPP_WOOCOMMERCE_REPLACEMENTS'       => qlwapp_get_woocommerce_replacements_text(),
				'QLWAPP_WOOCOMMERCE_ORDER_REPLACEMENTS' => qlwapp_get_woocommerce_order_replacements_text(),
				'QLWAPP_IS_WOOCOMMERCE_ACTIVE'          => class_exists( 'WooCommerce' ),
				'QLWAPP_DEFAULT_CONTACT'                => $default_contact,
				'QLWAPP_DEFAULT_BUTTON'                 => $default_button,
				'QLWAPP_DEFAULT_BOX'                    => $default_box,
				'QLWAPP_DEFAULT_DISPLAY'                => $default_display,
				'QLWAPP_DEFAULT_SCHEME'                 => $default_scheme,
				'QLWAPP_DEFAULT_SETTINGS'               => $default_settings,
				'QLWAPP_DEFAULT_WOOCOMMERCE'            => $default_woocommerce,
				'QLWAPP_DEFAULT_WOOCOMMERCE_ARCHIVES'   => $default_woocommerce_archives,
				'QLWAPP_AB_UPGRADE_GROUP'               => $ab_upgrade_group,
			)
		);
	}

	public static function instance() {
		if ( is_null( self::$instance ) ) {
			self::$instance = new self();
		}
		return self::$instance;
	}
}
