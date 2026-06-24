<?php
/* @var $this NewsletterImport */

defined('ABSPATH') || exit;

global $wpdb;

include_once NEWSLETTER_INCLUDES_DIR . '/controls.php';
$controls = new NewsletterControls();

$return_page = 'newsletter_import_mailpoet';

if ($this->mp_is_importing()) {
    include __DIR__ . '/mailpoet-importing.php';
    return;
}

$can_import = true;

if (!$controls->is_action()) {
    $controls->set_data(get_option('newsletter_import_mailpoet'));
    $list_options = [];
	$lists_result = $wpdb->get_results("SELECT id, name FROM " . $wpdb->prefix . "mailpoet_segments");
    foreach ($lists_result AS $list) {
        $list_options[$list->id] = $list->name;
    }

} else {

    if ($can_import && $controls->is_action('import_mailpoet')) {

        update_option('newsletter_import_mailpoet', $controls->data, false);

        $this->mp_start();
	    $controls->js_redirect('admin.php?page=newsletter_import_mailpoet');

        return;
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
        <h3><?php esc_html_e('Import options', 'newsletter') ?></h3>
        <?php if ($can_import) { ?>
            <form method="post" action="" enctype="multipart/form-data">
                <?php $controls->init(); ?>
                <div id="tabs-file">
                    <table class="form-table">
                        <tr>
                            <th>
                                <?php esc_html_e('List(s) to import', 'newsletter') ?>
                            </th>
                            <td>
                                <?php $controls->select2('lists', $list_options, null, true) ?>
                                <p class="description">
                                    <?php esc_html_e('Choose one or more lists', 'newsletter'); ?>
                                </p>
                            </td>
                        </tr>
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
                            <th><?php esc_html_e('Import status', 'newsletter') ?></th>
                            <td>
			                    <?php $controls->checkbox('override_status', __('Override status of existing users', 'newsletter')) ?>
                                <p class="description"><strong>Inactive</strong> subscribers will be imported as <strong>confirmed</strong>.</p>
                            </td>
                        </tr>
                        <tr>
                            <th><?php esc_html_e('Assign to list(s)', 'newsletter') ?></th>
                            <td>
			                    <?php $controls->lists_on('lists', true); ?>
                                <div class="hints">
                                    Every created or updated subscriber will be linked to the selected list(s).
                                </div>
                            </td>
                        </tr>
                        <tr><td>&nbsp;</td><td>
		                        <?php $controls->button('import_mailpoet', __('Import', 'newsletter')); ?>
                            </td></tr>
                        <tr><td>Last import</td>
                        <td><?php include __DIR__ . '/mailpoet-progress.php'; ?></td></tr>
                    </table>
                </div>
            </form>
        <?php } ?>
    </div>


</div>
