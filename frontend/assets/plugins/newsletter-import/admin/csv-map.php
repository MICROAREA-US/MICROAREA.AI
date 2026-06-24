<?php
// phpcs:disable WordPress.WP.AlternativeFunctions.file_system_operations_fopen
// phpcs:disable WordPress.WP.AlternativeFunctions.file_system_operations_fclose

defined('ABSPATH') || exit;

/* @var $this NewsletterImport */
/* @var $controls NewsletterControls */

if (!$controls->is_action()) {
    $controls->data = $this->options;
    $controls->data['import_as'] = '';
} else {
    if ($controls->is_action('delete')) {
        $this->stop();
        $controls->js_redirect("admin.php?page=newsletter_import_index");
    }

    if ($controls->is_action('import')) {

        if (empty($controls->data['import_as'])) {
            $controls->errors = 'Please select the status of imported subscribers';
        } elseif (empty($controls->data['email'])) {
            $controls->errors = 'Please, map at least the email field on "Fields" tab';
        } else {
            $this->save_options($controls->data);
            // Patch for a bug in NewsletterAddon
            $this->options = $controls->data;
            $this->start();
            $controls->js_redirect("admin.php?page=newsletter_import_csv");
        }
    }
}

$csv_fields = array('' => 'None');
$headers = [];

$handle = fopen($this->get_filename(), 'r');
if ($handle) {
    $lines = []; // Not necessary as array, but the code has been copied from elsewhere

    while (($line = fgets($handle)) !== false) {
        $line = trim($line);
        if (empty($line)) {
            continue;
        }
        $lines[] = $line;
        break;
    }
    fclose($handle);

    $headers = str_getcsv($lines[0], $controls->data['delimiter'], '"');
    for ($i = 0; $i < count($headers); $i++) {
        $csv_fields['' . $i + 1] = $headers[$i];
    }
} else {
    $controls->errors = __('Import file cannot be read. Use the delete button and restart.', 'newsletter-import');
}
?>
<div class="wrap" id="tnp-wrap">

    <?php include NEWSLETTER_ADMIN_HEADER; ?>

    <div id="tnp-heading">
        <?php $controls->title_help('/addons/extended-features/advanced-import/') ?>
        <?php include __DIR__ . '/nav.php' ?>
    </div>

    <div id="tnp-body">

        <?php $controls->show() ?>

        <h3>Step 3/4 - Map the fields and set the import options</h3>
        <form method="post" action="" enctype="multipart/form-data">
            <?php $controls->init(); ?>
            <?php $controls->hidden('delimiter'); // From previous step ?>

            <div id="tabs">
                <ul>
                    <li><a href="#tabs-settings"><?php esc_html_e('Settings', 'newsletter-import') ?></a></li>
                    <li><a href="#tabs-fields"><?php esc_html_e('Fields', 'newsletter-import') ?></a></li>
                    <li><a href="#tabs-lists"><?php esc_html_e('Lists', 'newsletter-import') ?></a></li>
                    <li><a href="#tabs-extra"><?php esc_html_e('Custom fields', 'newsletter-import') ?></a></li>
                </ul>

                <div id="tabs-settings">
                    <table class="form-table">
                        <tr>
                            <th>When a subscriber is already present<br><small>Identified by it's email</small></th>
                            <td>

                                <?php $controls->select('mode', array('update' => 'Update', 'overwrite' => 'Overwrite', 'skip' => 'Skip')); ?>
                                <p class="description">
                                    <strong>Update</strong>: <?php esc_html_e('subscriber data will be updated, existing lists will be left untouched and new ones will be added.', 'newsletter') ?><br />
                                    <strong>Overwrite</strong>: <?php esc_html_e('subscriber data will be cleared and set again', 'newsletter') ?><br />
                                    <strong>Skip</strong>: <?php esc_html_e('subscriber won\'t be changed', 'newsletter') ?>
                                </p>
                            </td>
                        </tr>
                        <tr>
                            <th><?php esc_html_e('Import Subscribers As', 'newsletter') ?></th>
                            <td>
                                <?php
                                $controls->select('import_as', [
                                    'C' => __('Confirmed', 'newsletter'),
                                    'S' => __('Not confirmed', 'newsletter'),
                                    'U' => __('Unsubscribed', 'newsletter'),
                                    'B' => __('Bounced', 'newsletter'),
                                    TNP_User::STATUS_COMPLAINED => __('Complained', 'newsletter'),
                                        ], 'Select...');
                                ?>
                                <br>
                                <?php $controls->checkbox('override_status', __('Override status of existing users', 'newsletter')) ?>
                            </td>
                        </tr>
                    </table>
                </div>

                <div id="tabs-lists">
                    <p>
                        Lists can't be assigned using CSV fields.
                    </p>
                    <table class="form-table">

                        <tr>
                            <th><?php esc_html_e('Lists', 'newsletter') ?></th>
                            <td>
                                <?php $controls->preferences_group('lists', true); ?>
                                <div class="hints">
                                    Every created or updated subscriber will be associate with selected lists.
                                </div>
                            </td>
                        </tr>
                    </table>
                </div>


                <div id="tabs-fields">
                    <table class="widefat" style="width: auto">
                        <thead>
                            <tr>
                                <th>Subscriber field</th>
                                <th>CSV column</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Email</td>
                                <td><?php $controls->select('email', $csv_fields) ?></td>
                            </tr>
                            <tr>
                                <td>First name</td>
                                <td><?php $controls->select('first_name', $csv_fields) ?></td>
                            </tr>
                            <tr>
                                <td>Last name</td>
                                <td><?php $controls->select('last_name', $csv_fields) ?></td>
                            </tr>
                            <tr>
                                <td>Language</td>
                                <td>
                                    <?php $controls->select('language', $csv_fields) ?>
                                    <div class="description">
                                        It should be 2 lowercase characters code (<a href="https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes" target="_blank">ISO 639-1</a>)
                                        or the 2 lowercase characters code used by your multilanguage plugin.
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td>Gender</td>
                                <td>
                                    <?php $controls->select('gender', $csv_fields) ?>
                                    <div class="description">
                                        It should be "f" or "m" or "n".
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td>IP Address</td>
                                <td><?php $controls->select('ip', $csv_fields) ?></td>
                            </tr>
                            <tr>
                                <td>Country</td>
                                <td>
                                    <?php $controls->select('country', $csv_fields) ?>
                                    <p class="description">
                                        It should be the country <a href="https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2" target="_blank">ISO 3166-1 alpha 2 code</a>
                                    </p>
                                </td>
                            </tr>
                            <tr>
                                <td>Region</td>
                                <td>
                                    <?php $controls->select('region', $csv_fields) ?>
                                    <p class="description">Can be a state, county, province and so on</p>
                                </td>
                            </tr>
                            <tr>
                                <td>City</td>
                                <td>
                                    <?php $controls->select('city', $csv_fields) ?>
                                </td>
                            </tr>
                        </tbody>
                    </table>

                </div>


                <div id="tabs-extra">
                    <p><a href="?page=newsletter_subscription_customfields">Manage custom fields</a>.</p>
                    <?php
                    $profiles = Newsletter::instance()->get_profiles();
                    ?>

                    <?php if (empty($profiles)) { ?>
                        <p style="font-weight: strong">
                            There are not extra profile fields defined.
                        </p>
                    <?php } else { ?>
                        <table class="widefat" style="width: auto">
                            <thead>
                                <tr>
                                    <th>Subscriber field</th>
                                    <th>CSV column</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php foreach ($profiles as $profile) { ?>
                                    <tr>
                                        <td><?php echo esc_html($profile->name) ?></td>
                                        <td><?php $controls->select('profile_' . $profile->id, $csv_fields) ?></td>
                                    <?php } ?>
                            </tbody>
                        </table>
                    <?php } ?>

                </div>
            </div>

            <p>
                <?php $controls->button_back('?page=newsletter_import_csv'); ?>

                <?php $controls->button_delete('delete', 'Delete the file'); ?>
                <?php $controls->button_confirm('import', 'Import'); ?>
            </p>

        </form>
    </div>

</div>
