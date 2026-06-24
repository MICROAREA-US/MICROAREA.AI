<?php
/* @var $this NewsletterImport */

// phpcs:disable WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents

defined('ABSPATH') || exit;

include_once NEWSLETTER_INCLUDES_DIR . '/controls.php';
$controls = new NewsletterControls();

// If the import is active return to the import panel
if ($this->is_importing()) {
    $controls->js_redirect('?page=newsletter_import_csv');
}

//$controls->warnings[] = 'The activation or welcome emails are NOT sent to imported subscribers. Read more on the help page.';
?>

<style>

    #tnp-body a.tnp-widget {
        display: block;
        padding: 2em 1em;
        float: left;
        margin: 0 20px 0 0;
        border: 1px solid #ddd;
        min-height: 100px !important;
        overflow: hidden;
        width: 200px;
        text-decoration: none;
        background-color: #fff;
        font-size: 1.5em;
        text-align: center;
        line-height: 150%;
        color: #000;
    }

    #tnp-body a.tnp-widget:hover {
        background-color: #ccc;
    }

    #tnp-body a.tnp-widget h3 {
        padding: 0;
        margin: 0;
    }
</style>

<div class="wrap" id="tnp-wrap">

    <?php include NEWSLETTER_ADMIN_HEADER ?>

    <div id="tnp-heading">
        <?php $controls->title_help('/addons/extended-features/advanced-import/') ?>
        <?php include __DIR__ . '/nav.php' ?>
    </div>

    <div id="tnp-body">
        <?php $controls->show() ?>

        <p>
            The <strong>activation or welcome emails</strong> are NOT sent to imported subscribers. Read more on the help page.
        </p>
        <p>
            <?php esc_html_e('Pre-import backup is recommended.', 'newsletter-import') ?>
        </p>

        <a href="?page=newsletter_import_csv" class="tnp-widget">Import from CSV file</a>
        <a href="?page=newsletter_import_excel" class="tnp-widget">Import from Excel file</a>
        <a href="?page=newsletter_import_mailpoet" class="tnp-widget">Import from Mailpoet</a>
        <a href="?page=newsletter_import_bounce" class="tnp-widget">Import bounced addresses</a>
        <a href="?page=newsletter_import_clipboard" class="tnp-widget">Import with copy and paste</a>




        <div style="clear: both"></div>

        <?php include __DIR__ . '/last-import-statistics.php'; ?>

        <?php if (file_exists(NEWSLETTER_LOG_DIR . '/import-report.txt')) { ?>
            <h3>Last import report</h3>
            <pre style="padding: 15px; background-color: white; font-family: monospace; height: 300px; overflow: auto"><?php echo esc_html(file_get_contents(NEWSLETTER_LOG_DIR . '/import-report.txt')) ?></pre>
        <?php } ?>
    </div>


</div>
