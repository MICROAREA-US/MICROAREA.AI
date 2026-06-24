<?php
/* @var $this NewsletterImport */

// phpcs:disable WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents

defined('ABSPATH') || exit;

global $wpdb;

include_once NEWSLETTER_INCLUDES_DIR . '/controls.php';
$controls = new NewsletterControls();

// If the import is active return to the import panel
if ($this->is_importing()) {
    $controls->js_redirect('?page=newsletter_import_csv');
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

    if ($can_import && $controls->is_action('import-from-clipboard')) {
        //Normalize pasted string
        // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
        $data = wp_unslash($_POST['pasted_text'] ?? '');
        $data = str_replace(["\t", "\r\n", "\r"], [',', "\n", "\n"], $data);

        //$data = utf8_encode( $data );

        $res = file_put_contents($this->get_filename(), $data);
        if ($res === false) {
            $controls->errors = 'Unable to write data to the temporary file ' . esc_html($this->get_filename()) . '.';
        } else {
            $controls->js_redirect('admin.php?page=newsletter_import_csv');
        }
    }
}
?>

<div class="wrap" id="tnp-wrap">

    <?php include NEWSLETTER_ADMIN_HEADER ?>

    <div id="tnp-heading">
        <?php $controls->title_help('/addons/extended-features/advanced-import/') ?>
        <?php include __DIR__ . '/nav.php' ?>
    </div>


    <div id="tnp-body">
        <?php if ($can_import) { ?>

            <form method="post" action="">
                <?php $controls->init(); ?>

                <ol style="font-weight: bold">
                    <li><?php esc_html_e('The first line MUST contain field labels', 'newsletter-import') ?></li>
                    <li>One subscriber data per line.</li>
                    <li>The field order is not important on next screen you can map your dataì to the subscriber fields.</li>
                    <li>The field separator can be a comma or a semicolon.</li>
                </ol>
                <p>
                    <?php esc_html_e('Example', 'newsletter-import') ?>
                </p>

                    <p style="font-family: monospace; background-color: #fff; padding: 1rem">
                        Email; First Name; Last Name<br>
                        john@example.com; John; Smith<br>
                        anne@example.com; Anne; Mc Laurin<br>
                        isable@example.com; Isabel;<br>
                    </p>


                <table class="form-table">
                    <tr>
                        <td>
                            <textarea name="pasted_text" style="width: 100%; height: 200px; font-size: 11px; font-family: monospace" placeholder="Copy and paste here"></textarea>
                            <?php $controls->button('import-from-clipboard', __('Next', 'newsletter-import')); ?>
                        </td>
                    </tr>

                </table>


            </form>
        <?php } ?>
    </div>

</div>
