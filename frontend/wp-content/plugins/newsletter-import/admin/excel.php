<?php
/* @var $this NewsletterImport */

defined('ABSPATH') || exit;

global $wpdb;

include_once NEWSLETTER_INCLUDES_DIR . '/controls.php';
$controls = new NewsletterControls();

require_once( __DIR__ . '/../vendor/SimpleXLSX.php' );

use Shuchkin\SimpleXLSX;

$return_page = 'newsletter_import_excel';

if ($this->is_importing()) {
    include __DIR__ . '/csv-importing.php';

    return;
}

if ($this->has_file()) {
    $step = sanitize_key($_GET['step'] ?? '');
    if ($step === 'map') {
        include __DIR__ . '/csv-map.php';

        return;
    }
    include __DIR__ . '/csv-parse.php';

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
        if (isset($_FILES['file']) && isset($_FILES['file']['tmp_name']) && is_uploaded_file($_FILES['file']['tmp_name'])) {
            $this->stop();

            //$r = move_uploaded_file($_FILES['file']['tmp_name'], $this->get_filename());

            if ($xlsx = SimpleXLSX::parse($_FILES['file']['tmp_name'])) {
                $f = fopen($this->get_filename(), 'wb');
                // fwrite($f, chr(0xEF) . chr(0xBB) . chr(0xBF)); // UTF-8 BOM
                foreach ($xlsx->readRows() as $r) {
                    fputcsv($f, $r, ';'); // fputcsv($f, $r, ';', '"', "\\", "\r\n");
                }
                fclose($f);
                $controls->js_redirect('admin.php?page=newsletter_import_excel');
            } else {
                $controls->errors .= 'The file cannot be imported: ' . esc_html(SimpleXLSX::parseError()) . '<br>Be sure to save from Excel choosing the Excel 2007-365 XLSX file format.';
            }
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
        <?php $controls->show() ?>
        <h3>1/4 - <?php esc_html_e('Upload your file', 'newsletter') ?></h3>
        <?php if ($can_import) { ?>
            <form method="post" action="" enctype="multipart/form-data">
                <?php $controls->init(); ?>
                <div id="tabs-file">
                    <table class="form-table">
                        <tr>
                            <th>
                                <?php esc_html_e('Excel file', 'newsletter') ?>
                            </th>
                            <td>
                                <input type="file" name="file"/>

                                <?php $controls->button('import', __('Next', 'newsletter-import')); ?>

                                <p class="description">
                                    Only Excel 2007 - 365 <strong>XLSX</strong> file format.
                                </p>
                                <p>
                                    <a href="<?php echo plugins_url('newsletter-import') . '/sample.xlsx' ?>"
                                       target="_blank">Download a sample here</a>
                                </p>
                            </td>
                        </tr>
                    </table>
                </div>
            </form>
        <?php } ?>
    </div>



</div>
