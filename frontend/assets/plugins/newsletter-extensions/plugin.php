<?php

defined('ABSPATH') || exit;

class NewsletterExtensions extends NewsletterAddon {

    /**
     * @var NewsletterExtensions
     */
    static $instance;

    function __construct($version) {
        self::$instance = $this;
        parent::__construct('extensions', $version, __DIR__);
        add_action('rest_api_init', [$this, 'hook_rest_api_init']);
    }

    function init() {
        parent::init();
        if (is_admin()) {
            add_action('wp_ajax_tnp_addons_register', [$this, '_register']);
            add_action('wp_ajax_tnp_addons_license', [$this, 'license']);
        }
    }

    function weekly_check() {
        global $wp_version;
        parent::weekly_check();
        $license_key = Newsletter::instance()->get_license_key();
        $response = wp_remote_post('https://www.thenewsletterplugin.com/wp-content/addon-check.php?k=' . rawurlencode($license_key)
                . '&a=' . rawurlencode($this->name) . '&d=' . rawurlencode(home_url()) . '&v=' . rawurlencode($this->version)
                . '&ml=' . (Newsletter::instance()->is_multilanguage() ? '1' : '0')
                . '&n=' . rawurlencode(NEWSLETTER_VERSION) . '&w=' . rawurlencode($wp_version)
                . '&p=' . rawurlencode(PHP_VERSION));
    }

    function hook_rest_api_init() {
        register_rest_route('newsletter', '/manager', [
            'methods' => ['POST', 'GET'],
            'permission_callback' => '__return_true',
            'callback' => [$this, 'api_manager'],
            'args' => [
                'k' => [
                    'required' => true
                ],
                'what' => [
                    'required' => true
                ]
            ]
        ]);
    }

    function api_manager(WP_REST_Request $request) {

        $this->setup_options();
        $logger = $this->get_logger();

        $key = $request->get_param('k');

        $license_key = Newsletter\License::get_key();
        if (!NEWSLETTER_DEBUG) {
            if (empty($license_key) || $key !== $license_key) {
                // Logging...
                return new WP_Error('invalid_key', 'Invalid key', ['status' => 403]);
            }
        }

        $what = $request->get_param('what');

        $logger->info('API call: ' . $what);

        if ('update-versions' === $what) {
            Newsletter\License::update();
            Newsletter\Addons::update();
            return true;
        }

        if ('reset-cron-stats' === $what) {
            update_option('newsletter_system_warnings', [], false);
            update_option('newsletter_diagnostic_cron_calls', [], false);
            return true;
        }

        if ('activate-cron-service' === $what) {
            $response = wp_remote_post('https://www.thenewsletterplugin.com/wp-content/cron-service.php?k='
                    . rawurlencode($license_key),
                    ['body' => wp_json_encode(['cron_url' => site_url('wp-cron.php')])]);

            $response_code = wp_remote_retrieve_response_code($response);

            if ($response_code != 200) {
                $error = new WP_Error('error', 'Error from cron service: ' . $response_code, ['status' => 401]);
                $logger->error($error);
                return $error;
            }

            // Reset the stats to avoid showing stale "cron problem" messages
            update_option('newsletter_system_warnings', [], false);
            update_option('newsletter_diagnostic_cron_calls', [], false);
            return true;
        }

        if ('send-data' === $what) {

            if (!empty($this->options['allow'])) {
                $response = wp_remote_post('https://www.thenewsletterplugin.com/wp-content/support-data.php?k='
                        . rawurlencode($license_key),
                        ['body' => wp_json_encode($this->get_support_data())]);
                return true;
            } else {
                $error = new WP_Error('not_allowed', 'Asking to push back diagnostic data is not allowed', ['status' => 403]);
                $logger->error($error);
                return $error;
            }
        }

        $error = new WP_Error('invalid_what', 'Invalid request', ['status' => 403]);
        $logger->error($error);
        return $error;
    }

    function _register() {
        $logger = $this->get_logger();

        check_ajax_referer('register');
        header('Content-Type: application/json');
        $email = sanitize_email(wp_unslash($_POST['email'] ?? ''));
        if (!is_email($email)) {
            echo wp_json_encode(['message' => 'The email address is invalid.']);
            die();
        }

        //$marketing = $_POST['marketing'];
        $marketing = '1';
        $response = wp_remote_post('https://www.thenewsletterplugin.com/wp-content/new-account.php', [
            'body' => ['email' => $email, 'marketing' => $marketing]
                ]
        );

        if (is_wp_error($response)) {
            $logger->error($response);
            echo wp_json_encode(['message' => 'Unable to contact the registration service.']);
            // TODO: Logging
            die();
        }

        if (wp_remote_retrieve_response_code($response) != '200') {
            echo wp_json_encode(['message' => 'Registration service error (code ' . wp_remote_retrieve_response_code($response) . ').']);
            // TODO: Logging
            die();
        }

        $logger->debug(wp_remote_retrieve_body($response));
        // $response['body']
        $data = json_decode(wp_remote_retrieve_body($response));

        if (!is_object($data)) {
            $logger->debug($data);
            echo wp_json_encode(['message' => 'Invalid response from the registration service.']);
            // TODO: Logging
            die();
        }

        // That is a warning
        if (isset($data->message)) {
            echo wp_json_encode(['message' => $data->message]);
            die();
        }

        // User registered
        $options = get_option('newsletter_main');
        $options['contract_key'] = $data->license_key;
        // Forces an update
        $this->get_license_data();
        update_option('newsletter_main', $options);

        // Setup the license key
        echo wp_json_encode(['message' => 'Registration completed', 'reload' => true]);
        wp_die();
    }

    /**
     * Return the license details and authorizations for the given license key.
     *
     * @param string $key
     * @return mixed
     */
    function get_license_data() {
        return Newsletter::instance()->get_license_data(true);
    }

    function is_license_active() {
        $license_data = Newsletter::instance()->get_license_data();
        if (empty($license_data)) {
            return false;
        }
        if (is_wp_error($license_data)) {
            return false;
        }

        return $license_data->expire >= time();
    }

    function check_license($license_key) {
        $response = wp_remote_post('https://www.thenewsletterplugin.com/wp-content/plugins/file-commerce-pro/license-check.php', [
            'body' => ['k' => $license_key]
        ]);
        if (is_wp_error($response))
            return $response;

        if (wp_remote_retrieve_response_code($response) != '200') {
            return new WP_Error(wp_remote_retrieve_response_code($response), 'License validation service error (code ' . wp_remote_retrieve_response_code($response) . ').');
        }
        $data = json_decode(wp_remote_retrieve_body($response));

        if (!is_object($data)) {
            return new WP_Error(1, 'Invalid response from the license validation service.');
        }

        // That is a warning
        if (isset($data->message)) {
            return new WP_Error(1, $data->message);
        }
        return $data;
    }

    function license() {
        check_ajax_referer('license');
        header('Content-Type: application/json');
        $license_key = sanitize_key($_POST['license_key'] ?? '');

        $options = get_option('newsletter_main');
        $options['contract_key'] = $license_key;
        update_option('newsletter_main', $options);

        $data = $this->get_license_data();

        if (is_wp_error($data)) {
            echo wp_json_encode(['message' => $data->get_error_message()]);
            die();
        }

        echo "{}";
        wp_die();
    }

    /**
     * @deprecated
     */
    function get_extension_version() {
        return null;
    }

    function get_package($extension_id, $licence_key = '') {
        return 'http://www.thenewsletterplugin.com/wp-content/plugins/file-commerce-pro/get.php?f=' . rawurlencode($extension_id) .
                '&d=' . rawurlencode(home_url()) . '&k=' . rawurlencode($licence_key) . '&v=' . rawurlencode($this->version);
    }

    function admin_menu() {
        add_submenu_page('newsletter_main_index', 'Addons Manager', '<span style="color:#27AE60; font-weight: bold;">Addons manager</span>', 'manage_options', 'newsletter_extensions_index',
                function () {
                    require __DIR__ . '/admin/index.php';
                });
        add_submenu_page('admin.php', 'Support', 'Support', 'manage_options', 'newsletter_extensions_support', function () {
            require __DIR__ . '/admin/support.php';
        });
    }

    /**
     * @deprecated
     */
    function register() {

    }

    function get_extensions_catalog() {

        return Newsletter::instance()->getTnpExtensions();
    }

    /**
     * Builds the support data running the filter intercepted by all the addons.
     *
     * @return array
     */
    function build_support_data() {
        return apply_filters('newsletter_support_data', []);
    }

    /**
     * Returns the support data for this addon.
     *
     * @global wpdb $wpdb
     * @return array
     */
    function get_support_data() {
        global $wpdb;

        $newsletter = Newsletter::instance();
        include_once ABSPATH . 'wp-admin/includes/plugin.php';
        require_once NEWSLETTER_DIR . '/admin.php';
        $system = NewsletterSystemAdmin::instance();

        $data = [];
        $data['date'] = date('Y-m-d H:i:s');
        $data['version'] = NEWSLETTER_VERSION;
        $data['domain'] = home_url();
        $data['site_url'] = site_url();
        $data['multilanguage'] = ($newsletter->is_multilanguage() ? '1' : '0');
        $data['cron'] = (array) $system->get_cron_stats();
        $data['subscribers'] = $wpdb->get_var("select count(*) from " . NEWSLETTER_USERS_TABLE);

        $data['constants'] = [];
        $data['constants']['NEWSLETTER_PAGE_WARNING'] = NEWSLETTER_PAGE_WARNING ? true : false;
        $data['constants']['NEWSLETTER_TRACKING_TYPE'] = NEWSLETTER_TRACKING_TYPE;
        $data['constants']['NEWSLETTER_ACTION_TYPE'] = NEWSLETTER_ACTION_TYPE;

        unset($data['cron']['deltas']);
        unset($data['cron']['deltas_ts']);

        $data['delivery'] = [];
        $stats = $system->get_send_stats();
        $data['delivery']['statistics'] = [
            'min' => $stats->min,
            'max' => $stats->max,
            'mean' => $stats->mean,
            'interrupted' => $stats->interrupted
        ];
        $data['delivery']['speed'] = (int) $newsletter->get_send_speed();
        $data['delivery']['delay'] = (int) NewsletterEngine::instance()->get_send_delay() . ' ms';

        $emails = $wpdb->get_results("select * from " . NEWSLETTER_EMAILS_TABLE . " where status='sending' and send_on<" . time() . " order by id asc");
        $data['delivery']['sending'] = count($emails);
        $total = 0;
        $queued = 0;
        foreach ($emails as $email) {
            $total += $email->total;
            $queued += $email->total - $email->sent;
        }

        $data['delivery']['queued'] = $queued;

        $mailer = $newsletter->get_mailer();
        $data['delivery']['mailer'] = $mailer->name ?? 'none';

        $data['delivery']['phpmailer_filters'] = $system->get_hook_functions('phpmailer_init', false);

        // Public page
        $data['public_page'] = 'ok';
        $tnp_page_id = $newsletter->get_newsletter_page_id();
        if (empty($tnp_page_id)) {
            $data['public_page'] = 'not set';
        } else {
            if (get_post_status($tnp_page_id) !== 'publish') {
                $data['public_page'] = 'not published: ' . get_post_status($tnp_page_id);
            } else {
                $content = get_post_field('post_content', $tnp_page_id);
                if (strpos($content, '[newsletter]') === false && strpos($content, '[newsletter ') === false) {
                    $data['public_page'] = 'missing shortcode';
                }
            }
        }

        $data['plugins'] = [];

        $data['plugins']['smtp'] = [];

        if (is_plugin_active('wp-mail-smtp/wp_mail_smtp.php')) {
            $data['plugins']['smtp'][] = 'WP Mail SMTP';
        }

        if (is_plugin_active('wp-mail-smtp-pro/wp_mail_smtp.php')) {
            $data['plugins']['smtp'][] = 'WP Mail SMTP Pro - tracking needs to be deactivated';
        }

        $data['plugins']['problematic'] = [];

        if (is_plugin_active('wp-html-email/wp-html-email.php')) {
            $data['plugins']['problematic'][] = 'WP HTML Email';
        }

        if (is_plugin_active('plugin-load-filter/plugin-load-filter.php')) {
            $data['plugins']['problematic'][] = 'Plugin load filter';
        }

        if (is_plugin_active('wp-asset-clean-up/wpacu.php')) {
            $data['plugins']['problematic'][] = 'WP Asset Clean Up';
        }

        if (is_plugin_active('wp-asset-clean-up-pro/wpacu.php')) {
            $data['plugins']['problematic'][] = 'WP Asset Clean Up Pro';
        }

        if (is_plugin_active('freesoul-deactivate-plugins/freesoul-deactivate-plugins.php')) {
            $data['plugins']['problematic'][] = 'Freesoul Deactivate Plugins';
        }

        return $data;
    }
}
