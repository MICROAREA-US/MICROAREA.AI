<?php

/*
  Plugin Name: Newsletter - SMTP Delivery Addon
  Plugin URI: https://www.thenewsletterplugin.com/documentation/addons/delivery-addons/smtp-extension/
  Description: Enable the use of an SMTP to send newsletters
  Version: 1.2.5
  Requires at least: 6.1
  Requires PHP: 7.0
  Author: The Newsletter Team
  Author URI: https://www.thenewsletterplugin.com
  Disclaimer: Use at your own risk. No warranty expressed or implied is provided.
 */

defined('ABSPATH') || exit;

add_action('newsletter_loaded', function ($version) {
    global $wp_version;
    if (version_compare($wp_version, '5.5') < 0) {
        echo '<div class="notice notice-error"><p>WP 5.5+ required by <strong>Newsletter - SMTP Addon</strong>.</p></div>';
    } elseif (version_compare($version, '9.0.0', '<')) {
        add_action('admin_notices', function () {
            echo '<div class="notice notice-error"><p>Newsletter plugin upgrade required by <strong>Newsletter - SMTP Addon</strong>.</p></div>';
        });
    } else {
        require_once __DIR__ . '/plugin.php';
        new NewsletterSmtp('1.2.5');
    }
});

