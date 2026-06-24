<?php
/* @var $this NewsletterImport */

defined('ABSPATH') || exit;

global $wpdb;

include_once NEWSLETTER_INCLUDES_DIR . '/controls.php';
$controls = new NewsletterControls();

$return_page = 'newsletter_import_csv';

if ($this->is_restoring()) {
    include __DIR__ . '/restore-job.php';
    return;
}

$can_import = true;

if (!$controls->is_action()) {
    $controls->data = $this->options;

    $r = $this->prepare_dir();
    if (is_wp_error($r)) {
        $controls->errors .= $r->get_error_message();
        $can_import = false;
    }
} else {

    if ($can_import && $controls->is_action('import')) {
        if (is_uploaded_file($_FILES['file']['tmp_name'])) {
            $this->stop();
            $r = move_uploaded_file($_FILES['file']['tmp_name'], $this->get_filename());
            if ($r === false) {
                $controls->errors = 'The file cannot be copied in the folder ' . esc_html($dir) . '/newsletter. Check if it exists and is writeable. You can also ask for support to your hosting provider.';
            } else {
                $controls->js_redirect('admin.php?page=newsletter_import_csv');
            }
        }
        return;
    }
}
?>

<div class="wrap" id="tnp-wrap">

    <?php include NEWSLETTER_ADMIN_HEADER ?>

    <div id="tnp-heading">
        <?php $controls->title_help('/addons/extended-features/advanced-import/') ?>
        <h2>Restore</h2>
        <?php include __DIR__ . '/nav.php' ?>
    </div>

    <div id="tnp-body">
        <?php $controls->show() ?>
        <h3>1/2 - <?php esc_html_e('Upload your file', 'newsletter') ?></h3>
        <?php if ($can_import) { ?>
            <form method="post" action="" enctype="multipart/form-data">
                <?php $controls->init(); ?>
                <div id="tabs-file">
                    <table class="form-table">
                        <tr>
                            <th>
                                <?php esc_html_e('CSV file', 'newsletter') ?>
                            </th>
                            <td>
                                <input type="file" name="file" />

                                <?php $controls->button('import', __('Next', 'newsletter-import')); ?>

                                
                            </td>
                        </tr>
                    </table>
                </div>
            </form>
        <?php } ?>
    </div>

    <?php include NEWSLETTER_ADMIN_FOOTER ?>

</div>
