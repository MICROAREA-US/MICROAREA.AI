<?php
/* @var $this NewsletterImport */
/* @var $controls NewsletterControls */

// phpcs:disable WordPress.WP.AlternativeFunctions.file_system_operations_fopen
// phpcs:disable WordPress.WP.AlternativeFunctions.file_system_operations_fclose

defined('ABSPATH') || exit;


if (!$controls->is_action()) {
    $controls->data = $this->options;
    if (empty($controls->data['delimiter'])) {
        $controls->data['delimiter'] = ';';
    }
} else {
    if ($controls->is_action('delete')) {
        $this->stop();
        $controls->js_redirect("admin.php?page=newsletter_import_index");
    }

    if ($controls->is_action('next')) {
        $this->save_options(array_merge($this->options, $controls->data));
        $controls->js_redirect("admin.php?page=newsletter_import_csv&step=map");
    }
}

$headers = [];
$data = [];

$handle = fopen($this->get_filename(), 'r');
if ($handle) {
    $lines = [];

    while (($line = fgets($handle)) !== false && count($lines) < 10) {
        $line = trim($line);
        if (empty($line)) {
            continue;
        }
        $lines[] = $line;
    }
    fclose($handle);

    $headers = str_getcsv($lines[0], $controls->data['delimiter'], '"');

    $email_found = false;

    for ($i = 1; $i < count($lines); $i++) {
        $row = str_getcsv($lines[$i], $controls->data['delimiter'], '"');
        if (!$email_found) {
            foreach ($row as $r) {
                $r = strtolower(trim($r));
                if (is_email($r)) {
                    $email_found = true;
                    break;
                }
            }
        }
        $data[] = $row;
    }
    if (!$email_found) {
        $controls->errors = __('No email found in parsed data, please check the delimiter', 'newsletter-import');
    }
} else {
    $controls->errors = __('Import file not found.', 'newsletter-import');
}
?>
<style>
    table.parsed {
        border-collapse: collapse;
    }
    table.parsed td, table.parsed th {
        padding: 3px;
        border: 1px solid #ddd !important;
        font-size: 12px;
        text-align: left!important;
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

        <h3>Step 2/4 - File format and parsing</h3>
        <form method="post" action="">
            <?php $controls->init(); ?>

            <div id="tabs">
                <ul>
                    <li><a href="#tabs-settings"><?php esc_html_e('Settings', 'newsletter-import') ?></a></li>
                </ul>

                <div id="tabs-settings">

                    <table class="form-table">
                        <tr>
                            <th><?php esc_html_e('Fields separator', 'newsletter-import') ?></th>
                            <td>
                                <?php $controls->select('delimiter', [';' => 'Semicolon (;)', ',' => 'Comma (,)']); ?>
                                <?php $controls->button('reload', 'Reload'); ?>

                                <p class="description">
                                    Excel (!) lets you to export in "CSV UTF-8 comma separated" but ACTUALLY it uses semicolons (;)
                                    as field separator. Check the file with a text editor like Notepad.
                                </p>

                            </td>
                        </tr>
                        <tr>
                            <th><?php esc_html_e('Sample lines from import file', 'newsletter-import') ?></th>
                            <td>
                                <textarea readonly style="background-color: #eee; font-family: monospace; font-size: 12px; width: 100%; height: 100px"><?php echo esc_html(implode("\n", $lines)); ?></textarea>
                            </td>
                        </tr>
                        <tr>
                            <th>As parsed</th>
                            <td>
                                <p>
                                    Only the first few lines are shown.
                                </p>
                                <table class="parsed">
                                    <tr>
                                        <?php
                                        foreach ($headers as $header) {
                                            echo '<th>', esc_html($header), '</th>';
                                        }
                                        ?>
                                    </tr>
                                    <?php
                                    foreach ($data as $row) {
                                        echo '<tr>';
                                        foreach ($row as $cell) {
                                            echo '<td>', esc_html($cell), '</td>';
                                        }
                                        echo '</tr>';
                                    }
                                    ?>
                                </table>
                            </td>
                        </tr>
                    </table>

                </div>

            </div>

            <p>
                <?php $controls->button_delete('delete', 'Delete the file'); ?>
                <?php
                if (!$controls->errors) {
                    $controls->btn('next', 'Next');
                }
                ?>

            </p>

        </form>
    </div>

</div>
