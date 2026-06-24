<?php
/* @var $this NewsletterMailerAddon */

defined('ABSPATH') || exit;

?>

<div class="wrap" id="tnp-wrap">
    <?php include NEWSLETTER_ADMIN_HEADER; ?>
    <div id="tnp-heading">
        <?php include __DIR__ . '/nav.php'; ?>
    </div>

    <div id="tnp-body">

        <form method="post" action="">
            <?php $controls->init(); ?>

            <?php $controls->logs($this->name, ['status' => false]); ?>

        </form>

    </div>
</div>
