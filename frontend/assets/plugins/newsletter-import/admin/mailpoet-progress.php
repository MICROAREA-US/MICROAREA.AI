<?php $stats = get_option('newsletter_import_mailpoet_stats', []); ?>
<?php if ($stats) { ?>
    <?php if ((int)$this->mp_get_progress() > 0) { ?>
        <p style="font-size: 1.5rem; font-weight: bold;">
		    <?php echo esc_html($this->mp_get_progress()) ?> subscribers processed
        </p>
        <?php } ?>

    <table class="widefat" style="width: auto">
        <thead>
            <tr>
                <th>Parameter</th>
                <th>Value</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <th>
                    Total subscribers processed
                </th>
                <td>
                    <?php echo esc_html($stats['total']) ?>

                </td>
            </tr>
            <tr>
                <th>
                    New subscribers
                </th>
                <td>
                    <?php echo esc_html($stats['new']) ?>

                </td>
            </tr>
            <tr>
                <th>
                    Updated subscribers
                </th>
                <td>
                    <?php echo esc_html($stats['updated']) ?>

                </td>
            </tr>
            <tr>
                <th>
                    Skipped subscribers
                </th>
                <td>
                    <?php echo esc_html($stats['skipped']) ?>

                </td>
            </tr>
            <tr>
                <th>
                    Errors
                </th>
                <td>
                    <?php echo esc_html($stats['errors']) ?>
                    <?php if (!empty($stats['errors'])) { ?>
                        Details can be found <a href="?page=newsletter_main_logs" target="_blank">on log files</a>.
                    <?php } ?>
                </td>
            </tr>
        </tbody>

    </table>
<?php } ?>
