<?php
/* @var $this NewsletterSmtp */

defined('ABSPATH') || exit;

include_once NEWSLETTER_INCLUDES_DIR . '/controls.php';
$controls = new NewsletterControls();

if (!$controls->is_action()) {
    $controls->data = $this->options;
} else {

    if ($controls->is_action('save') || $controls->is_action('test')) {

        $controls->data = array_map('trim', $controls->data);

        if (isset($controls->data['enabled']) && empty($controls->data['host'])) {
            $controls->errors = 'The host must be set to enable the SMTP';
        }

        if (empty($controls->errors)) {
            $this->save_options($controls->data);
            $controls->add_toast_saved();
        }

        if ($controls->is_action('test')) {

            $mailer = $this->get_mailer();
            $message = $this->get_test_message($controls->data['test_email']);
            $result = $mailer->send_with_stats($message);

            if (is_wp_error($result)) {
                $e = $result->get_error_message();
                $controls->errors = $e;
                if (stripos($e, 'Connection timed out')) {
                    $controls->errors .= '<br><br><strong>Probably the hosting provider is blocking the connection to your SMTP server, please contact its support.</strong><br>';
                } elseif (stripos($e, 'SMTP connect() failed') !== false) {
                    $controls->errors .= '<br><br><strong>Please check the host and port and try other port/secure combination. Could be the hosting provider is blocking the connection: please contact its support.</strong><br>';
                }
                $controls->errors .= '<br><a href="https://www.thenewsletterplugin.com/documentation/?p=15170" target="_blank"><strong>' . __('Read more', 'newsletter') . '</strong></a>.';
            } else {
                $controls->messages = 'Success.';
                $controls->messages .= '<br>Max speed: ' . $mailer->get_capability() . ' emails per hour';
            }
        }
    }
}
?>

<div class="wrap" id="tnp-wrap">

    <?php include NEWSLETTER_ADMIN_HEADER; ?>

    <div id="tnp-heading">
        <?php include __DIR__ . '/nav.php'; ?>
    </div>

    <div id="tnp-body">
        <?php $controls->show(); ?>
        <form method="post" action="">
            <?php $controls->init(); ?>

            <div id="tabs">
                <ul>
                    <li><a href="#tabs-general">General</a></li>
                    <li><a href="#tabs-3">Bounces</a></li>
                </ul>

                <div id="tabs-general">

                    <table class="form-table">
                        <tr>
                            <th>Enable the SMTP?</th>
                            <td><?php $controls->enabled(); ?></td>
                        </tr>
                        <tr>
                            <th>SMTP host/port</th>
                            <td>
                                host: <?php $controls->text('host', 30); ?>
                                port: <?php $controls->text('port', 6, '25'); ?>
                                <?php $controls->select('secure', array('' => 'No secure protocol', 'tls' => 'SMTP+STARTTLS', 'ssl' => 'SMTPS')); ?>
                            </td>
                        </tr>
                        <tr>
                            <th>Authentication</th>
                            <td>
                                user: <?php $controls->text('user', 30); ?>
                                password: <?php $controls->password('pass', 30); ?>
                            </td>
                        </tr>
                        <tr valign="top">
                            <th>Max mails per hour</th>
                            <td>
                                <?php $controls->text('speed'); ?>
                                <p class="description">
                                    Leave empty to use Newsletter main setting.
                                </p>
                            </td>
                        </tr>
                        <tr>
                            <th>
                                Insecure SSL Connections
                                <?php $controls->field_help('https://www.thenewsletterplugin.com/documentation/addons/delivery-addons/smtp-extension/#ssl') ?>
                            </th>
                            <td>
                                <?php $controls->yesno('ssl_insecure'); ?>
                            </td>
                        </tr>
                        <tr>
                            <th>
                                Continue newsletter sending on errors
                            </th>
                            <td>
                                <?php $controls->yesno('continue_on_error'); ?>
                            </td>
                        </tr>
                        <tr>
                            <th>Test email address</th>
                            <td>
                                <?php $controls->text_email('test_email', 30); ?>
                                <?php $controls->btn('test', 'Save and send test email', ['secondary' => true]); ?>
                                <p class="description">
                                    If the test reports a "connection failed", review your settings and, if correct, contact
                                    your provider to unlock the connection (if possible).
                                </p>
                            </td>
                        </tr>
                    </table>
                </div>


                <div id="tabs-3">


                    <p>
                        This addon cannot manage the bounces produced by the connected SMTP server. You can consider to
                        install and configure the
                        <a href="https://www.thenewsletterplugin.com/documentation/addons/extended-features/bounce-extension/" target="_blank">Bounce Addon</a>.
                    </p>
                    <p style="font-weight: bold">
                        Anyway we advise to use a professional delivery service. Check out our
                        <a href="https://www.thenewsletterplugin.com/documentation/addons/delivery-addons/" target="_blank">integrations</a>
                        (some of them are free,
                        see the addons manager page on the left side menu).
                    </p>


                </div>

            </div>

            <p>
                <?php $controls->button_save(); ?>
            </p>

        </form>
    </div>

</div>
