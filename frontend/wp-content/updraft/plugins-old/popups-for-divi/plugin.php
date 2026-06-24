<?php
/**
 * Enables JS popups within Divi.
 *
 * @package     Popups_For_Divi
 * @author      Philipp Stracker
 * @copyright   2020 Philipp Stracker
 * @license     GPL-2.0-or-later
 *
 * Plugin Name: Popups for Divi
 * Description: Finally, a simple and intuitive way to add custom popups to your Divi pages!
 * Plugin URI:  https://divimode.com/divi-popup/?utm_source=wpadmin&utm_medium=link&utm_campaign=popups-for-divi
 * Author:      divimode.com
 * Author URI:  https://divimode.com/?utm_source=wpadmin&utm_medium=link&utm_campaign=popups-for-divi
 * Created:     30.12.2017
 * Version:     3.0.3
 * Text Domain: divi-popup
 * Domain Path: /lang
 * License:     GPL v2 or later
 * License URI: http://www.gnu.org/licenses/gpl-2.0.txt
 *
 * Copyright (C) 2017 Philipp Stracker
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; either version 2
 * of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, see <http://www.gnu.org/licenses/>.
 *
 */

defined( 'ABSPATH' ) || die();

/**
 * A new version string will force a refresh of CSS and JS files for all users.
 *
 * @var string
 */
const DIVI_POPUP_VERSION = '3.0.3';

/**
 * Absolute path and file name of the main plugin file.
 *
 * @var string
 */
const DIVI_POPUP_PLUGIN_FILE = __FILE__;

require_once __DIR__ . '/start.php';
