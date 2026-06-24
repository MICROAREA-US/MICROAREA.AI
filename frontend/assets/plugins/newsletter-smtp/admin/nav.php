<?php
/* @var $this NewsletterMailerAddon */
$p = sanitize_key(wp_unslash($_GET['page'] ?? '')); // To prevent to trigger security analysis, but not necessary
?>
<?php $controls->title_help('/addons/delivery-addons/') ?>
<ul class="tnp-nav">
    <li class="tnp-nav-title"><?php echo esc_html($this->menu_title); ?></li>
    <li class="<?php echo $p === $this->index_page ? 'active' : '' ?>"><a href="?page=<?php echo $this->index_page; ?>"><?php esc_html_e('Settings', 'newsletter') ?></a></li>
    <?php if ($this->logs_page) { ?>
        <li class="<?php echo $p === $this->logs_page ? 'active' : '' ?>"><a href="?page=<?php echo $this->logs_page; ?>"><?php esc_html_e('Logs', 'newsletter') ?></a></li>
    <?php } ?>
    <?php if ($this->enabled) { ?>
        <li class="tnp-nav-badge green">Enabled</li>
    <?php } else { ?>
        <li class="tnp-nav-badge orange">Disabled</li>
    <?php } ?>
</ul>
