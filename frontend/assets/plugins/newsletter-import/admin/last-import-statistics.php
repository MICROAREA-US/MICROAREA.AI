<?php $stats = get_option('newsletter_import_stats', []); ?>
<?php if ($stats) { ?>
    <h3><?php esc_html_e('Statistics of the last import', 'newsletter-import') ?></h3>


    <table class="widefat" style="width: auto; min-width: 500px">
        <thead>
            <tr>
                <th>Result</th>
                <th style="text-align: right">Value</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <th>
                    Total lines
                </th>
                <td style="text-align: right">
                    <?php echo esc_html($stats['total']) ?>

                </td>
            </tr>
            <tr>
                <th>
                    New subscribers
                </th>
                <td style="text-align: right">
                    <?php echo esc_html($stats['new']) ?>

                </td>
            </tr>
            <tr>
                <th>
                    Updated subscribers
                </th>
                <td style="text-align: right">
                    <?php echo esc_html($stats['updated']) ?>

                </td>
            </tr>
            <tr>
                <th>
                    Skipped subscribers
                </th>
                <td style="text-align: right">
                    <?php echo esc_html($stats['skipped']) ?>

                </td>
            </tr>
            <tr>
                <th>
                    Errors
                </th>
                <td style="text-align: right">
                    <?php echo esc_html($stats['errors']) ?>
                    <?php if (!empty($stats['errors'])) { ?>
                        Details can be found <a href="?page=newsletter_system_logs" target="_blank">on log files</a>.
                    <?php } ?>
                </td>
            </tr>
            <tr>
                <th>
                    Empty lines
                </th>
                <td style="text-align: right">
                    <?php echo esc_html($stats['empty']) ?>
                </td>
            </tr>
        </tbody>

    </table>
    <p>
        If statistics do not match expected values, set the log level to debug on Newsletter main settings and run the import again.<br>
        The system/Logs page will then show up a log file for the import process with possible errors.
    </p>
<?php } ?>
