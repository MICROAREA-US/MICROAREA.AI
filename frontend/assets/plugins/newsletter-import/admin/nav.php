<?php
//phpcs:disable WordPress.Security.NonceVerification.Recommended

$p = sanitize_key($_GET['page'] ?? '');
?>
<ul class="tnp-nav">
    <li class="tnp-nav-title"><?php esc_html_e('Import/Export', 'newsletter'); ?></li>
    <li class="<?php echo $p === 'newsletter_import_csv'?'active':''?>"><a href="?page=newsletter_import_csv"><?php esc_html_e('CSV', 'newsletter')?></a></li>
    <li class="<?php echo $p === 'newsletter_import_excel'?'active':''?>"><a href="?page=newsletter_import_excel"><?php esc_html_e('Excel', 'newsletter')?></a></li>
    <li class="<?php echo $p === 'newsletter_import_clipboard'?'active':''?>"><a href="?page=newsletter_import_clipboard"><?php esc_html_e('Copy and Paste', 'newsletter')?></a></li>
    <li class="<?php echo $p === 'newsletter_import_bounce'?'active':''?>"><a href="?page=newsletter_import_bounce"><?php esc_html_e('Bounces', 'newsletter')?></a></li>
    <li class="<?php echo $p === 'newsletter_import_mailpoet'?'active':''?>"><a href="?page=newsletter_import_mailpoet"><?php esc_html_e('MailPoet', 'newsletter')?></a></li>
    <li class="<?php echo $p === 'newsletter_import_export'?'active':''?>"><a href="?page=newsletter_import_export"><?php esc_html_e('Export', 'newsletter')?></a></li>
</ul>
