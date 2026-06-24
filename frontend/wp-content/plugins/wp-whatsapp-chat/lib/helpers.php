<?php

if ( ! defined( 'ABSPATH' ) ) {
	return;
}

function qlwapp_format_phone( $phone ) {

	$phone = preg_replace( '/[^0-9]/', '', $phone );

	$phone = ltrim( $phone, '0' );

	return $phone;
}

function qlwapp_get_replacements() {

	global $wp;

	$remove = function () {
		return '/';
	};

	add_filter( 'document_title_separator', $remove );
	$title = wp_get_document_title();
	remove_filter( 'document_title_separator', $remove );

	// Verificar que $wp esté inicializado antes de acceder a sus propiedades
	$current_url = home_url( '/' );
	if ( isset( $wp ) && is_object( $wp ) && isset( $wp->request ) ) {
		$current_url = home_url( $wp->request );
	}

	return array(
		'{SITE_TITLE}'    => get_bloginfo( 'name' ),
		'{SITE_URL}'      => home_url( '/' ),
		'{SITE_EMAIL}'    => get_bloginfo( 'admin_email' ),
		'{CURRENT_URL}'   => $current_url,
		'{CURRENT_TITLE}' => $title,
	);
}

function qlwapp_get_woocommerce_replacements() {

	global $product;

	$replacements = array();

	if ( ! $product || ! is_a( $product, 'WC_Product' ) ) {
		return $replacements;
	}

	$replacements['{PRODUCT_TITLE}'] = $product->get_name();
	$replacements['{PRODUCT_URL}']   = get_permalink( $product->get_id() );
	$replacements['{PRODUCT_PRICE}'] = strip_tags( wc_price( wc_get_price_to_display( $product ) ) );
	$replacements['{PRODUCT_SKU}']   = $product->get_sku();
	$replacements['{PRODUCT_ID}']    = $product->get_id();

	return $replacements;
}

function qlwapp_get_replacements_text() {

	$replacements = qlwapp_get_replacements();

	return implode( ' ', array_keys( $replacements ) );
}

function qlwapp_get_woocommerce_replacements_text() {

	$replacements = array(
		'{PRODUCT_TITLE}',
		'{PRODUCT_URL}',
		'{PRODUCT_PRICE}',
		'{PRODUCT_SKU}',
		'{PRODUCT_ID}',
	);

	return implode( ' ', $replacements );
}

function qlwapp_get_woocommerce_order_replacements_text() {

	$replacements = array(
		'{ORDER_ID}',
		'{ORDER_NUMBER}',
		'{ORDER_TOTAL}',
		'{ORDER_DATE}',
		'{ORDER_TIME}',
		'{ORDER_STATUS}',
		'{ORDER_URL}',
		'{ORDER_PRODUCTS}',
		'{CUSTOMER_NAME}',
		'{CUSTOMER_EMAIL}',
		'{CUSTOMER_PHONE}',
		'{BILLING_ADDRESS}',
		'{SHIPPING_ADDRESS}',
		'{PAYMENT_METHOD}',
	);

	return implode( ' ', $replacements );
}

function qlwapp_replacements_vars( $text ) {

	$replacements = qlwapp_get_replacements();

	// Merge WooCommerce replacements if available.
	$wc_replacements = qlwapp_get_woocommerce_replacements();
	if ( ! empty( $wc_replacements ) ) {
		$replacements = array_merge( $replacements, $wc_replacements );
	}

	return str_replace( array_keys( $replacements ), array_values( $replacements ), $text );
}

function qlwapp_get_timezone_offset( $timezone ) {

	if ( ! $timezone ) {
		return;
	}

	if ( strpos( $timezone, 'UTC' ) !== false ) {
		$numeric_part = preg_replace( '/UTC\+?/', '', $timezone );
		if ( is_numeric( $numeric_part ) ) {
			$offset = (int) $numeric_part * 60;
		} else {
			$offset = 0;
		}
	} else {
		$current = timezone_open( $timezone );
		if ( ! $current ) {
			return;
		}
		$utc    = new \DateTime( 'now', new \DateTimeZone( 'UTC' ) );
		$offset = $current->getOffset( $utc ) / 3600 * 60;
	}
	return $offset;
}

function qlwapp_get_timezone_current() {
	// Get user settings.
	$current_offset = get_option( 'gmt_offset' );
	$tzstring       = get_option( 'timezone_string' );

	// Remove old Etc mappings. Fallback to gmt_offset.
	if ( false !== strpos( $tzstring, 'Etc/GMT' ) ) {
		$tzstring = '';
	}

	if ( empty( $tzstring ) ) {
		// Create a UTC+- zone if no timezone string exists.
		if ( 0 == $current_offset ) {
			$tzstring = 'UTC+0';
		} elseif ( $current_offset < 0 ) {
			$tzstring = 'UTC' . $current_offset;
		} else {
			$tzstring = 'UTC+' . $current_offset;
		}
	}
	return $tzstring;
}

function qlwapp_get_timezone_options() {

	static $timezones;

	if ( ! empty( $timezones ) ) {
		return $timezones;
	}

	$timezone_html = wp_timezone_choice( null, get_user_locale() );

	// Parsear el HTML para convertirlo en un array de objetos
	preg_match_all( '/<option value="([^"]*)"( selected="selected")?>([^<]*)<\/option>/', $timezone_html, $matches, PREG_SET_ORDER );

	$timezones = array_map(
		function ( $match ) {
			return array(
				'value'    => $match[1],
				'label'    => $match[3],
				'selected' => ! empty( $match[2] ), // true si la opción está seleccionada
			);
		},
		$matches
	);

	return $timezones;
}
