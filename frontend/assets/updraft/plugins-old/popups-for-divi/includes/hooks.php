<?php
/**
 * Hooks up filters and actions of this module.
 *
 * @package PopupsForDivi
 */

// Exit if accessed directly.
defined( 'ABSPATH' ) || exit;

// Load the shared library subset, as early as possible.
add_action( 'after_setup_theme', 'pfd_load_library', 6 );

// Load the translation files.
add_action( 'init', 'pfd_translate_plugin', 1 );

