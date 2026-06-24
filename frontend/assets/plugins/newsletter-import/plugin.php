<?php

// phpcs:disable WordPress.WP.Capabilities.Unknown
// phpcs:disable WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents
// phpcs:disable WordPress.WP.AlternativeFunctions.unlink_unlink
// phpcs:disable WordPress.WP.AlternativeFunctions.file_system_operations_fopen
// phpcs:disable WordPress.WP.AlternativeFunctions.file_system_operations_fclose
// phpcs:disable WordPress.WP.AlternativeFunctions.file_system_operations_is_writable
// phpcs:disable WordPress.PHP.NoSilencedErrors.Discouraged

defined('ABSPATH') || exit;

class NewsletterImport extends NewsletterAddon {

    /**
     * @var NewsletterImport
     */
    static $instance;

    public function __construct($version = '0.0.0') {
        self::$instance = $this;
        parent::__construct('import', $version, __DIR__);
        $this->setup_options();
        add_action('newsletter_import_run', array($this, 'hook_newsletter_import_run'));
    }

    function upgrade($first_install = false) {
        parent::upgrade($first_install);
        $this->stop();
    }

    function init() {
        parent::init();

        if (is_admin()) {
            if (Newsletter::instance()->is_allowed()) {
                add_action('admin_menu', [$this, 'hook_admin_menu'], 100);
                add_filter('newsletter_menu_subscribers', [$this, 'hook_newsletter_menu_subscribers']);
                if (defined('DOING_AJAX') && DOING_AJAX) {
                    add_action('wp_ajax_newsletter_import', [$this, 'hook_wp_ajax_newsletter_import']);
                    add_action('wp_ajax_newsletter_import_mailpoet', [$this, 'hook_wp_ajax_newsletter_import_mailpoet']);
                    add_action('wp_ajax_newsletter_import_restore', [$this, 'hook_wp_ajax_newsletter_import_restore']);
                    add_action('wp_ajax_newsletter_import_export', [$this, 'hook_wp_ajax_newsletter_import_export']);
                }
            }
        }
    }

    function weekly_check() {
        parent::weekly_check();
        $license_key = Newsletter::instance()->get_license_key();
        $response = wp_remote_post('https://www.thenewsletterplugin.com/wp-content/addon-check.php?k=' . rawurlencode($license_key)
                . '&a=' . rawurlencode($this->name) . '&d=' . rawurlencode(home_url()) . '&b=' . rawurlencode(site_url()) . '&v=' . rawurlencode($this->version)
                . '&ml=' . (Newsletter::instance()->is_multilanguage() ? '1' : '0'));
    }

    function hook_newsletter_menu_subscribers($entries) {
        $entries[] = ['label' => 'Import/Export', 'url' => '?page=newsletter_import_index'];
        return $entries;
    }

    function hook_admin_menu() {
        add_submenu_page('newsletter_main_index', __('Import/Export', 'newsletter'), '<span class="tnp-side-menu">' . __('Import/Export', 'newsletter') . '</span>', 'exist', 'newsletter_import_index', function () {
            require __DIR__ . '/admin/index.php';
        });
        add_submenu_page('admin.php', 'CSV import', 'CSV import', 'exist', 'newsletter_import_csv', function () {
            require __DIR__ . '/admin/csv.php';
        });
        add_submenu_page('admin.php', 'Excel import', 'Excel import', 'exist', 'newsletter_import_excel', function () {
            require __DIR__ . '/admin/excel.php';
        });
        add_submenu_page('admin.php', 'Copy&Paste import', 'Copy&Paste import', 'exist', 'newsletter_import_clipboard', function () {
            require __DIR__ . '/admin/clipboard.php';
        });
        add_submenu_page('admin.php', 'Bounce import', 'Bounce import', 'exist', 'newsletter_import_bounce', function () {
            require __DIR__ . '/admin/bounce.php';
        });
        add_submenu_page('admin.php', 'MailPoet import', 'MailPoet import', 'exist', 'newsletter_import_mailpoet', function () {
            require __DIR__ . '/admin/mailpoet.php';
        });
        add_submenu_page('admin.php', 'Export', 'Export', 'exist', 'newsletter_import_export', function () {
            require __DIR__ . '/admin/export.php';
        });
//        add_submenu_page('admin.php', 'Dump', 'Dump', 'exist', 'newsletter_import_dump', function () {
//            require __DIR__ . '/admin/dump.php';
//        });
//        add_submenu_page('admin.php', 'Restore', 'Restore', 'exist', 'newsletter_import_restore', function () {
//            require __DIR__ . '/admin/dump.php';
//        });
    }

    function hook_wp_ajax_newsletter_import() {
        // Object caching plugin, sometimes, do no refresh the cache for ajax calls
        wp_cache_flush();
        wp_cache_delete('newsletter_import', 'options');
        $this->options = null;
        $this->setup_options();

        $this->hook_newsletter_import_run(10);
        $data = [];
        $data['completed'] = !$this->is_importing();
        ob_start();
        include __DIR__ . '/admin/progress.php';
        $data['html'] = ob_get_clean();
        $data['progress'] = $this->get_progress();
        header('Content-Type: application/json');
        echo wp_json_encode($data);
        die();
    }

    function hook_newsletter_import_run($max_run_time = 30) {

        $logger = $this->get_logger();

        if (get_transient('newsletter_import')) {
            $logger->error('Import job already running');
            return;
        }

        @setlocale(LC_CTYPE, 'en_US.UTF-8');
        @set_time_limit(0);
        set_transient('newsletter_import', time(), $max_run_time + 10);
        $logger->info('Starting');

        // It could have been removed
        $position = $this->get_position();
        if ($position === -1) {
            $logger->info('Job stopped');
            $this->stop();
            return;
        }

        $position = (int) $position;

        $options = $this->options;

        $handle = fopen($this->get_filename(), 'r');
        if (!$handle) {
            $logger->fatal('File disappeared...');
            $this->stop();
            return;
        }

        $stats = get_option('newsletter_import_stats');

        $logger->info('Starting from ' . $position);
        fseek($handle, $position);

        // Skips the first line
        if ($position === 0) {
            $line = fgets($handle);
            $this->log('Line 1 - Column names: ' . trim($line));
        }

        $mode = $options['mode'];
        $logger->debug('Mode ' . $mode);

        $newsletter = Newsletter::instance();

        $email_idx = (int) $options['email'] - 1;
        $first_name_idx = (int) $options['first_name'] - 1;
        $last_name_idx = (int) $options['last_name'] - 1;
        $gender_idx = (int) $options['gender'] - 1;
        $country_idx = (int) $options['country'] - 1;
        $region_idx = (int) $options['region'] - 1;
        $ip_idx = (int) $options['ip'] - 1;
        $language_idx = (int) $options['language'] - 1;
        $city_idx = (int) $options['city'] - 1;

        $start = time();
        while (($line = fgets($handle)) !== false && time() < $start + $max_run_time) {
            $this->set_position(ftell($handle));

            $line = trim($line);

            $logger->debug('Processing ' . $line);

            $stats['total']++;

            if (empty($line)) {
                $stats['empty']++;
                update_option('newsletter_import_stats', $stats);
                continue;
            }

            if (!mb_check_encoding($line, "UTF-8")) {
                $this->log('Line ' . ($stats['total'] + 1) . ' - Wrong UTF-8 enconding, check if the file has been saved as UTF-8');
                $logger->fatal('Line ' . $line . ' is not UTF-8 encoded');
                $stats['errors']++;
                update_option('newsletter_import_stats', $stats);
                continue;
            }

            // For fatal logging...
            $text_line = $line;

            //$line = preg_split('/[,;\t]/', $line);
            //$line = array_map('trim', $line);

            $line = str_getcsv($line, $options['delimiter'], '"');
            $email = $newsletter->normalize_email($line[$email_idx]);
            $logger->info('Current email: ' . $email);
            if (!$email) {
                $this->log('Line ' . ($stats['total'] + 1) . ' - Invalid email address');
                $logger->fatal('Invalid email on line ' . $text_line);
                $stats['errors']++;
                update_option('newsletter_import_stats', $stats);
                continue;
            }

            // Get subscriber

            $subscriber = $newsletter->get_user($email, ARRAY_A);
            if ($subscriber == null) {
                $logger->info('New subscriber');
                $subscriber = array();
                $subscriber['email'] = $email;
                $subscriber['last_activity'] = time();

                if ($first_name_idx > -1 && isset($line[$first_name_idx])) {
                    $subscriber['name'] = mb_strimwidth($newsletter->normalize_name($line[$first_name_idx]), 0, 100);
                }

                if ($last_name_idx > -1 && isset($line[$last_name_idx])) {
                    $subscriber['surname'] = mb_strimwidth($newsletter->normalize_name($line[$last_name_idx]), 0, 100);
                }

                if ($country_idx > -1 && isset($line[$country_idx])) {
                    $country = strtoupper(trim($line[$country_idx]));

                    if (strlen($country) > 2) {
                        $this->log('Line ' . ($stats['total'] + 1) . ' - Invalid country code 2 digit ISO format: ' . $country);
                        $logger->fatal('Country "' . $line[$country_idx] . '" is not 2 digit ISO format on line ' . $text_line);
                        $stats['errors']++;
                        update_option('newsletter_import_stats', $stats);
                        continue;
                    }
                    $subscriber['country'] = $country;
                }

                if ($region_idx > -1 && isset($line[$region_idx])) {
                    $subscriber['region'] = mb_strimwidth(trim($line[$region_idx]), 0, 100);
                }

                if ($ip_idx > -1 && isset($line[$ip_idx])) {
                    $subscriber['ip'] = trim($line[$ip_idx]);
                }

                if ($language_idx > -1 && isset($line[$language_idx])) {
                    $subscriber['language'] = mb_strimwidth(strtolower(trim($line[$language_idx])), 0, 2);
                }

                if ($gender_idx > -1 && isset($line[$gender_idx])) {
                    $gender = strtolower(trim($line[$gender_idx]));
                    if (!empty($gender)) {
                        $gender = substr($gender, 0, 1);
                        if ($gender != 'f' && $gender != 'm' && $gender != 'n') {
                            $this->log('Line ' . ($stats['total'] + 1) . ' - Invalid gender (not one of M, F, N): ' . $gender);
                            $logger->fatal('Gender is invalid on line ' . $text_line);
                            $stats['errors']++;
                            update_option('newsletter_import_stats', $stats);
                            continue;
                        }
                        $subscriber['sex'] = $gender;
                    }
                }

                if ($city_idx > -1 && isset($line[$city_idx])) {
                    $subscriber['city'] = trim($line[$city_idx]);
                }

                $subscriber['status'] = $options['import_as'];

                if (!empty($options['lists'])) {
                    foreach ($options['lists'] as $i) {
                        $subscriber['list_' . $i] = '1';
                    }
                }

                $profiles = $newsletter->get_profiles();
                foreach ($profiles as $profile) {
                    $profile_idx = (int) $options['profile_' . $profile->id] - 1;
                    if ($profile_idx > -1 && isset($line[$profile_idx])) {
                        $subscriber['profile_' . $profile->id] = mb_strimwidth(trim($line[$profile_idx]), 0, 250);
                    }
                }

                $newsletter->save_user($subscriber);
                $stats['new']++;
                //$logger->debug($subscriber);
            } else {
                $logger->info('Matched subscriber ID ' . $subscriber['id']);
                if ($mode == 'skip') {
                    $logger->info('Skipped');
                    $stats['skipped']++;
                    update_option('newsletter_import_stats', $stats);
                    continue;
                }

                if ($mode == 'overwrite') {
                    // Clean up the subscriber
                    $subscriber['name'] = '';
                    $subscriber['surname'] = '';
                    $subscriber['sex'] = 'n';
                    for ($i = 1; $i <= NEWSLETTER_PROFILE_MAX; $i++) {
                        $subscriber['profile_' . $i] = '';
                    }
                    for ($i = 1; $i <= NEWSLETTER_LIST_MAX; $i++) {
                        $subscriber['list_' . $i] = 0;
                    }
                    $subscriber['country'] = '';
                    $subscriber['region'] = '';
                    $subscriber['city'] = '';
                }

                if ($language_idx > -1 && isset($line[$language_idx])) {
                    $subscriber['language'] = strtolower(trim($line[$language_idx]));
                }

                if ($first_name_idx > -1) {
                    $subscriber['name'] = mb_strimwidth($newsletter->normalize_name($line[$first_name_idx]), 0, 100);
                }
                if ($last_name_idx > -1) {
                    $subscriber['surname'] = mb_strimwidth($newsletter->normalize_name($line[$last_name_idx]), 0, 100);
                }
                if ($gender_idx > -1) {
                    $gender = strtolower($line[$gender_idx]);
                    if (!empty($gender)) {
                        $gender = substr($gender, 0, 1);
                        if ($gender != 'f' && $gender != 'm' && $gender != 'n') {
                            $this->log('Line ' . ($stats['total'] + 1) . ' - Invalid genderr (not one of M, F, N): ' . $gender);
                            $logger->fatal('Gender is invalid on line ' . $text_line);
                            $stats['errors']++;
                            update_option('newsletter_import_stats', $stats);
                            continue;
                        }
                        $subscriber['sex'] = $gender;
                    }
                }
                if (isset($options['override_status'])) {
                    $subscriber['status'] = $options['import_as'];
                }
                if ($country_idx > -1 && isset($line[$country_idx])) {
                    $country = strtoupper(trim($line[$country_idx]));

                    if (strlen($country) > 2) {
                        $this->log('Line ' . ($stats['total'] + 1) . ' - Invalid country code 2 digit ISO format: ' . $country);
                        $logger->fatal('Country "' . $line[$country_idx] . '" is not 2 digit ISO format on line ' . $text_line);
                        $stats['errors']++;
                        update_option('newsletter_import_stats', $stats);
                        continue;
                    }
                    $subscriber['country'] = $country;
                }
                if ($region_idx > -1 && isset($line[$region_idx])) {
                    $subscriber['region'] = mb_strimwidth(trim($line[$region_idx]), 0, 100);
                }
                if ($city_idx > -1 && isset($line[$city_idx])) {
                    $subscriber['city'] = mb_strimwidth(trim($line[$city_idx]), 0, 100);
                }


                foreach ($options['lists'] as $i) {
                    $subscriber['list_' . $i] = 1;
                }

                $profiles = $newsletter->get_profiles();
                foreach ($profiles as $profile) {
                    $profile_idx = (int) $options['profile_' . $profile->id] - 1;
                    if ($profile_idx > -1 && isset($line[$profile_idx])) {
                        $subscriber['profile_' . $profile->id] = mb_strimwidth(trim($line[$profile_idx]), 0, 250);
                    }
                }

                //$logger->debug($subscriber);
                $newsletter->save_user($subscriber);
                $stats['updated']++;
            }
            update_option('newsletter_import_stats', $stats);

            // TODO: Remove is for test
            //break;
        }
        fclose($handle);
        if ($line === false) {
            $logger->info('Finished');
            $this->stop();
            return true;
        } else {
            $logger->info('To be continued');
            //wp_schedule_single_event(time()+5, 'newsletter_import_run');
        }
        delete_transient('newsletter_import');
        return false;
    }

    function stop() {
        $this->delete_file();
        delete_transient('newsletter_import');
        update_option('newsletter_import_position', -1, false);
        //$p = $this->get_position();
        //$this->get_logger()->debug('Position: ' . var_export($p, true));
    }

    function start() {
        $this->set_position(0);
        update_option('newsletter_import_stats', array('total' => 0, 'errors' => 0, 'new' => 0, 'updated' => 0, 'skipped' => 0, 'empty' => 0), false);
        @unlink(NEWSLETTER_LOG_DIR . '/import-report.txt');
    }

    function log($line) {
        file_put_contents(NEWSLETTER_LOG_DIR . '/import-report.txt', $line . "\n", FILE_APPEND);
    }

    function is_importing() {
        return $this->has_file() && $this->get_position() != -1;
    }

    function get_position() {
        wp_cache_flush();
        wp_cache_delete('newsletter_import_position', 'options');
        return (int) get_option('newsletter_import_position', -1);
    }

    function set_position($position) {
        update_option('newsletter_import_position', $position, false);
    }

    function has_file() {
        return file_exists($this->get_filename());
    }

    function has_restore_file() {
        return file_exists($this->get_filename());
    }

    function get_filename() {
        return $this->get_dir() . '/import.csv';
    }

    function get_restore_filename() {
        return $this->get_dir() . '/restore.csv';
    }

    function get_restore_fields_filename() {
        return $this->get_dir() . '/restore-fields.json';
    }

    function get_dir() {
        $dir = wp_upload_dir();
        return $dir['basedir'] . '/newsletter/import';
    }

    /**
     *
     * @return \WP_Error|boolean
     */
    function prepare_dir() {
        $dir = $this->get_dir();
        $r = wp_mkdir_p($dir);
        if (!$r || !is_writable($dir) || !is_readable($dir)) {
            return new WP_Error(1, 'The folder "' . esc_html($dir) . '" cannot be created or is not writable/readable. Ask for support to your provider.');
        }

        $file = $this->get_filename();

        if (file_exists($file)) {
            $r = unlink($file);
            if (!$r) {
                return new WP_Error(2, 'The old import file "' . esc_html($file) . '" cannot be deleted. Ask for support to your provider.');
            }
        }

        $file = $this->get_restore_filename();

        if (file_exists($file)) {
            $r = unlink($file);
            if (!$r) {
                return new WP_Error(2, 'The old restore file "' . esc_html($file) . '" cannot be deleted. Ask for support to your provider.');
            }
        }

        $file = $this->get_restore_fields_filename();

        if (file_exists($file)) {
            $r = unlink($file);
            if (!$r) {
                return new WP_Error(2, 'The old restore file "' . esc_html($file) . '" cannot be deleted. Ask for support to your provider.');
            }
        }

        file_put_contents($dir . '/.htaccess', "<IfModule mod_authz_core.c>\nRequire all denied\n</IfModule>\n<IfModule !mod_authz_core.c>\nOrder deny,allow\nDeny from all\n</IfModule>");
        //return new WP_Error(1, 'Test error condition');
        return true;
    }

    function get_progress() {
        $position = get_option('newsletter_import_position');
        $total = filesize($this->get_filename());
        if (!$total)
            return 100;
        return (int) ($position * 100 / $total);
    }

    function get_restore_progress() {
        $position = get_option('newsletter_import_restore_position');
        $total = filesize($this->get_restore_filename());
        if (!$total)
            return 100;
        return (int) ($position * 100 / $total);
    }

    function delete_file() {
        $fn = $this->get_filename();
        if (file_exists($fn)) {
            return unlink($fn);
        }
    }

    function delete_restore_file() {
        $fn = $this->get_restore_filename();
        if (file_exists($fn)) {
            return unlink($fn);
        }
    }

    function hook_wp_ajax_newsletter_import_export() {
        require_once NEWSLETTER_INCLUDES_DIR . '/controls.php';
        $controls = new NewsletterControls();

        if ($controls->is_action('export')) {
            $this->export($controls->data);
        }
    }

    function sanitize_csv($text) {
        $text = str_replace(['"', "\n", "\r", ";"], ["'", " ", " ", " "], $text);

        // Excel... of course!
        $first = substr($text, 0, 1);
        if ($first === '=' || $first === '+' || $first === '-' || $first === '@') {
            $text = "'" . $text;
        }

        return $text;
    }

    function restore() {

    }

    function dump($options = null) {
        global $wpdb;

        @setlocale(LC_CTYPE, 'en_US.UTF-8');
        header('Content-Type: application/octet-stream;charset=UTF-8');
        header('Content-Disposition: attachment; filename="newsletter-subscribers.csv"');

        // BOM
        echo "\xEF\xBB\xBF";

        $fields = ['id', 'email', 'status', 'token', 'name', 'surname', 'sex', 'created', 'language', 'wp_user_id', 'last_activity',
            'ip', 'referrer', 'http_referer', 'country', 'region', 'city'];

        for ($i = 1; $i <= NEWSLETTER_LIST_MAX; $i++) {
            $fields[] = "list_$i";
        }

        // In table profiles
        for ($i = 1; $i <= NEWSLETTER_PROFILE_MAX; $i++) {
            $fields[] = "profile_$i";
        }

        $line = implode(';', $fields);
        // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
        echo $line, "\n";

        $page = 0;
        while (true) {

            $list = $wpdb->get_results($wpdb->prepare("select * from " . NEWSLETTER_USERS_TABLE . " order by id limit %d, 500", $page * 500));
            foreach ($list as $item) {
                foreach ($fields as $field) {
                    // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
                    echo $this->sanitize_csv($item->$field), ';';
                }
                echo "\n";
                flush();
            }

            if (count($list) < 500) {
                break;
            }
            $page++;
        }
        die();
    }

    /**
     *
     * @global type $wpdb
     * @param type $optionsù
     * phpcs:disable WordPress.Security.EscapeOutput.OutputNotEscaped
     */
    function export($options = null) {
        global $wpdb;

        @setlocale(LC_CTYPE, 'en_US.UTF-8');
        header('Content-Type: application/octet-stream;charset=UTF-8');
        header('Content-Disposition: attachment; filename="newsletter-subscribers.csv"');

        // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
        $options = wp_unslash($_POST['options'] ?? []);

        // BOM
        echo "\xEF\xBB\xBF";

        $sep = ';';
        if ($options) {
            $sep = $options['separator'];
        }
        if ($sep == 'tab') {
            $sep = "\t";
        }

        // CSV header
        echo '"Email"' . $sep . '"Name"' . $sep . '"Surname"' . $sep . '"Gender"' . $sep . '"Status"' . $sep . '"Date"' . $sep . '"Token"' . $sep;

        // In table profiles
        for ($i = 1; $i <= NEWSLETTER_PROFILE_MAX; $i++) {
            echo '"Profile ' . $i . '"' . $sep; // To adjust with field name
        }

        // Lists
        for ($i = 1; $i <= NEWSLETTER_LIST_MAX; $i++) {
            echo '"List ' . $i . '"' . $sep;
        }


        echo '"Feed by mail"' . $sep . '"Follow up"' . $sep;
        echo '"IP"' . $sep . '"Referrer"' . $sep . '"Country"' . $sep . '"Language"' . $sep;
        echo '"ID"' . $sep . '"WP User ID"' . $sep;
        echo '"Last Activity"' . $sep;

        echo "\n";

        $page = 0;
        while (true) {
            $query = "select * from " . NEWSLETTER_USERS_TABLE . " where 1=1";
            $list = (int) $options['list'];
            if (!empty($list)) {
                $query .= " and list_" . $list . "=1";
            }

            $status = $options['status'];
            if (!empty($status)) {
                $status = substr($status, 0, 1);
                $query .= " and status='" . esc_sql($status) . "'";
            }

            $recipients = $wpdb->get_results($wpdb->prepare($query . " order by email limit %d, 500", $page * 500));
            for ($i = 0; $i < count($recipients); $i++) {
                echo '"' . $recipients[$i]->email . '"' . $sep;
                echo '"' . $this->sanitize_csv($recipients[$i]->name) . '"' . $sep;
                echo '"' . $this->sanitize_csv($recipients[$i]->surname) . '"' . $sep;
                echo '"' . $recipients[$i]->sex . '"' . $sep;
                echo '"' . $recipients[$i]->status . '"' . $sep;
                echo '"' . $recipients[$i]->created . '"' . $sep;
                echo '"' . $recipients[$i]->token . '"' . $sep;

                for ($j = 1; $j <= NEWSLETTER_PROFILE_MAX; $j++) {
                    $column = 'profile_' . $j;
                    echo '"' . $this->sanitize_csv($recipients[$i]->$column) . '"' . $sep;
                }

                for ($j = 1; $j <= NEWSLETTER_LIST_MAX; $j++) {
                    $list = 'list_' . $j;
                    echo '"' . $recipients[$i]->$list . '"' . $sep;
                }

                echo '""' . $sep;
                echo '""' . $sep;
                echo '"' . $this->sanitize_csv($recipients[$i]->ip) . '"' . $sep;
                echo '"' . $this->sanitize_csv($recipients[$i]->referrer) . '"' . $sep;
                echo '"' . $this->sanitize_csv($recipients[$i]->country) . '"' . $sep;
                echo '"' . $this->sanitize_csv($recipients[$i]->language) . '"' . $sep;
                echo '"' . $recipients[$i]->id . '"' . $sep;
                echo '"' . $recipients[$i]->wp_user_id . '"' . $sep;
                echo '"' . date('Y-m-d H:i:s', $recipients[$i]->last_activity) . '"' . $sep;

                echo "\n";
                flush();
            }
            if (count($recipients) < 500) {
                break;
            }
            $page++;
        }
        die();
    }

    function mp_stop() {
        delete_transient('newsletter_import_mailpoet');
        update_option('newsletter_import_mailpoet_position', -1, false);
        //$p = $this->get_position();
        //$this->get_logger()->debug('Position: ' . var_export($p, true));
    }

    function mp_start() {
        $this->mp_set_position(0);
        update_option('newsletter_import_mailpoet_stats', array('total' => 0, 'errors' => 0, 'new' => 0, 'updated' => 0, 'skipped' => 0, 'empty' => 0), false);
    }

    function mp_is_importing() {
        return $this->mp_get_position() != -1;
    }

    function mp_get_position() {
        wp_cache_flush();
        wp_cache_delete('newsletter_import_mailpoet_position', 'options');
        return (int) get_option('newsletter_import_mailpoet_position', -1);
    }

    function mp_set_position($position) {
        update_option('newsletter_import_mailpoet_position', $position, false);
    }

    function hook_wp_ajax_newsletter_import_mailpoet() {
        // Object caching plugin, sometimes, do no refresh the cache for ajax calls
        wp_cache_flush();
        wp_cache_delete('newsletter_import_mailpoet', 'options');
        $this->options = null;
        $this->setup_options();

        $this->hook_newsletter_import_run_mp(10);
        $data = [];
        $data['completed'] = !$this->mp_is_importing();
        ob_start();
        include __DIR__ . '/admin/mailpoet-progress.php';
        $data['html'] = ob_get_clean();
        $data['progress'] = $this->mp_get_progress();
        header('Content-Type: application/json');
        echo wp_json_encode($data);
        die();
    }

    function mp_get_progress() {
        $position = get_option('newsletter_import_mailpoet_position');
        return (int) ($position);
    }

    function hook_newsletter_import_run_mp($max_run_time = 30) {

        global $wpdb;
        $logger = $this->get_logger();

        if (get_transient('newsletter_import_mailpoet')) {
            $logger->error('Import job already running');
            return;
        }

        @setlocale(LC_CTYPE, 'en_US.UTF-8');
        @set_time_limit(0);
        set_transient('newsletter_import_mailpoet', time(), $max_run_time + 10);
        $logger->info('Starting');

        // It could have been removed
        $last_mp_id = $this->mp_get_position();
        if ($last_mp_id === -1) {
            $logger->info('Job stopped');
            $this->stop();
            return;
        }

        $options = get_option('newsletter_import_mailpoet');
        $lists = implode(",", array_map('absint', $options['lists']));

        $subscribers_result = $wpdb->get_results(
                "SELECT sub.id, sub.wp_user_id, sub.first_name, sub.last_name, sub.email, sub.status FROM "
                . $wpdb->prefix . "mailpoet_subscribers sub INNER JOIN wp_mailpoet_subscriber_segment seg ON sub.id = seg.subscriber_id"
                . " WHERE seg.segment_id IN (" . $lists . ") AND sub.id > " . ((int) $last_mp_id)
                . " ORDER BY sub.id ASC LIMIT 1000");

        $logger->debug($wpdb->last_query);

        if ($wpdb->error) {
            $logger->fatal($wpdb->error);
            $this->stop();
            return;
        }

        $logger->debug("Processing " . count($subscribers_result) . " results");

        if (empty($subscribers_result)) {
            $logger->info('Finished');
            $this->mp_stop();
            return;
        }

        $stats = get_option('newsletter_import_mailpoet_stats');

        $logger->info('Starting from id > ' . $last_mp_id);

        $mode = $options['mode'];
        $logger->debug('Mode ' . $mode);

        $newsletter = Newsletter::instance();

        $start = time();

        foreach ($subscribers_result AS $mp_subscriber) {

            sleep(3);

            if (time() > $start + $max_run_time) {
                $logger->error('Time is running out');
                delete_transient('newsletter_import_mailpoet');
                return;
            }

            $this->mp_set_position($mp_subscriber->id);

            $logger->debug('Processing ID ' . $mp_subscriber->id . ", email: " . $mp_subscriber->email);

            $stats['total']++;

            // Get subscriber

            $subscriber = $newsletter->get_user($mp_subscriber->email, ARRAY_A);
            if ($subscriber == null) {
                $logger->info('New subscriber');
                $subscriber = array();
                $subscriber['email'] = $mp_subscriber->email;
                $subscriber['name'] = $mp_subscriber->first_name;
                $subscriber['surname'] = $mp_subscriber->last_name;
                $subscriber['status'] = $this->getStatusFromMailpoet($mp_subscriber->status);

                if (!empty($options['lists_on'])) {
                    foreach ($options['lists_on'] as $i) {
                        $subscriber['list_' . $i] = '1';
                    }
                }

                $newsletter->save_user($subscriber);
                $stats['new']++;
                //$logger->debug($subscriber);
            } else {
                $logger->info('Matched subscriber ID ' . $subscriber['id']);
                if ($mode == 'skip') {
                    $logger->info('Skipped');
                    $stats['skipped']++;
                    update_option('newsletter_import_mailpoet_stats', $stats);
                    continue;
                }

                if ($mode == 'overwrite') {
                    // Clean up the subscriber
                    $subscriber['name'] = '';
                    $subscriber['surname'] = '';
                    $subscriber['sex'] = 'n';
                    for ($i = 1; $i <= NEWSLETTER_PROFILE_MAX; $i++) {
                        $subscriber['profile_' . $i] = '';
                    }
                    for ($i = 1; $i <= NEWSLETTER_LIST_MAX; $i++) {
                        $subscriber['list_' . $i] = 0;
                    }
                    $subscriber['country'] = '';
                    $subscriber['region'] = '';
                    $subscriber['city'] = '';
                }

                $subscriber['name'] = $mp_subscriber->first_name;
                $subscriber['surname'] = $mp_subscriber->last_name;

                if (isset($options['override_status'])) {
                    $subscriber['status'] = $this->getStatusFromMailpoet($mp_subscriber->status);
                }

                foreach ($options['lists_on'] as $i) {
                    $subscriber['list_' . $i] = 1;
                }

                //$logger->debug($subscriber);
                $newsletter->save_user($subscriber);
                $stats['updated']++;
            }
            update_option('newsletter_import_mailpoet_stats', $stats);

            // TODO: Remove is for test
            //break;
        }

        delete_transient('newsletter_import_mailpoet');
        return true;
    }

    private function getStatusFromMailpoet($mpstatus) {
        switch ($mpstatus) {
            case "subscribed":
            case "inactive":
            default:
                return TNP_User::STATUS_CONFIRMED;
            case "unsubscribed":
                return TNP_User::STATUS_UNSUBSCRIBED;
            case "unconfirmed":
                return TNP_User::STATUS_NOT_CONFIRMED;
            case "bounced":
                return TNP_User::STATUS_BOUNCED;
        }
    }
}
