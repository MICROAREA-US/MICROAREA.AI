<?php
/* @var $this NewsletterImport */
/* @var $controls NewsletterControls */

defined('ABSPATH') || exit;

include_once NEWSLETTER_INCLUDES_DIR . '/controls.php';
$controls = new NewsletterControls();

$controls->warnings[] = 'The export cannot be used for backup and restore. <a href="https://www.thenewsletterplugin.com/documentation/developers/backup-recovery/" target="_blank">Read more</a>.';
?>

<div class="wrap" id="tnp-wrap">

    <?php include NEWSLETTER_ADMIN_HEADER; ?>

    <div id="tnp-heading">
        <?php include __DIR__ . '/nav.php' ?>
    </div>

    <div id="tnp-body" class="tnp-users tnp-users-export">

        <?php $controls->show() ?>

        <form method="post" action="<?php echo esc_attr(admin_url('admin-ajax.php')); ?>?action=newsletter_import_export">
            <?php $controls->init(); ?>
            <table class="form-table">
                <tr>
                    <th><?php esc_html_e('Field separator', 'newsletter') ?></th>

                    <td>
                        <?php $controls->select('separator', array(';' => 'Semicolon', ',' => 'Comma', 'tab' => 'Tabulation')); ?>
                        <p class="description">Try to change the separator if Excel does not recognize the columns.</p>
                    </td>
                </tr>
                <tr>
                    <th><?php esc_html_e('List', 'newsletter') ?></th>
                    <td>
                        <?php $controls->lists_select('list', __('All', 'newsletter')); ?>
                    </td>
                </tr>
                <tr>
                    <th><?php esc_html_e('Status', 'newsletter') ?></th>
                    <td>
                        <?php
                        $controls->select('status', ['' => __('Any status', 'newsletter'),
                            'C' => TNP_User::get_status_label('C'), 'S' => TNP_User::get_status_label('S'),
                            'U' => TNP_User::get_status_label('U'),
                            'B' => TNP_User::get_status_label('B'), 'P' => TNP_User::get_status_label('P')]);
                        ?>
                    </td>
                </tr>
            </table>
            <p>
                <?php $controls->button('export', __('Export', 'newsletter')); ?>
            </p>
        </form>

    </div>

</div>
