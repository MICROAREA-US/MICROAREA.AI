<?php

defined('ABSPATH') || exit;

include_once NEWSLETTER_INCLUDES_DIR . '/controls.php';
$controls = new NewsletterControls();

$controls->warnings[] = 'The export cannot be used for backup and restore. <a href="https://www.thenewsletterplugin.com/documentation/developers/backup-recovery/" target="_blank">Read more</a>.';
?>

<div class="wrap" id="tnp-wrap">

    <?php include NEWSLETTER_ADMIN_HEADER ?>

    <div id="tnp-heading">

        <h2><?php esc_html_e('Dump', 'newsletter') ?></h2>

    </div>

    <div id="tnp-body" class="tnp-users tnp-users-export">

        <?php $controls->show() ?>

        <form method="post" action="<?php echo esc_attr(admin_url('admin-ajax.php')); ?>?action=newsletter_import_export">
            <?php $controls->init(); ?>

            <p>
                <?php $controls->button('dump', __('Dump', 'newsletter')); ?>
            </p>
        </form>

    </div>


</div>
