<?php
function finteza_analytics_api() {
	$fz_settings = get_option( 'finteza_settings', Finteza_Analytics_Plugin::default_settings() );
	$val         = $fz_settings['website_id'];
	?>
	<input type="text" name="finteza_settings[website_id]" value="<?php echo esc_attr( $val ); ?>" />
	<?php
	if ( ! get_option( 'finteza_settings' )['website_id'] ) {
		echo '<p><i>' . sprintf( __( '<a href=https://www.finteza.com/en/register data-target=registration target=_blank>Register</a> an account in Finteza', 'finteza' ), 'https://www.finteza.com/en/register' ) . '</i></p>';
	}
}

function finteza_analytics_proxy_token() {

	$fz_settings = get_option( 'finteza_settings', Finteza_Analytics_Plugin::default_settings() );
	$use_proxy   = array_key_exists( 'use_proxy', $fz_settings ) && $fz_settings['use_proxy'];
	$val         = isset( $fz_settings['proxy_token'] ) ? $fz_settings['proxy_token'] : '';
	?>
	<input type="text" name="finteza_settings[proxy_token]" required value="<?php echo esc_attr( $val ); ?>" />
	<?php
	if ( empty( $val ) ) {
		echo '<p><i>' . __( 'You can get this value in the website settings of the <a href="https://panel.finteza.com/" target=_blank>Finteza panel</a>', 'finteza' ) . '</i></p>';
	}

	if ( $use_proxy && ! get_option( 'permalink_structure' ) ) {
		echo '<p><i>' . sprintf( __( '<b>Important!</b> To use proxying enable <a href="%s" target=_blank>permalinks</a> in any mode except "Plain"', 'finteza' ), admin_url( 'options-permalink.php' ) ) . '</i></p>';
	}
}

function finteza_analytics_tracking() {
	$val = get_option( 'finteza_settings', Finteza_Analytics_Plugin::default_settings() );
	?>
	<p><label><input type="checkbox" name="finteza_settings[track_hash]" value="1" <?php checked( 1, (array_key_exists('track_hash', $val) ? $val['track_hash'] : false) ); ?> /><?php echo __( 'Track hash changes in the address bar', 'finteza' ); ?></label></p>
	<p><label><input type="checkbox" name="finteza_settings[track_links]" value="1" <?php checked( 1, (array_key_exists('track_links', $val) ? $val['track_links'] : false) ); ?> /><?php echo __( 'Track outbound links', 'finteza' ); ?></label></p>
	<p><label><input type="checkbox" name="finteza_settings[time_on_page]" value="1" <?php checked( 1, (array_key_exists('time_on_page', $val) ? $val['time_on_page'] : false) ); ?> /><?php echo __( 'Exact time on website', 'finteza' ); ?></label></p>
	<p><label><input type="checkbox" name="finteza_settings[ignore_admins]" value="1" <?php checked( 1, (array_key_exists('ignore_admins', $val) ? $val['ignore_admins'] : false) ); ?> /><?php echo __( 'Disable tracking of admin visits', 'finteza' ); ?></label></p>
	<br/>
	<br />
	<p><label><input type="checkbox" name="finteza_settings[use_proxy]" value="1" <?php checked( 1, (array_key_exists('use_proxy', $val) ? $val['use_proxy'] : false ) ); ?> /><?php echo __( 'Proxying the script and requests', 'finteza' ); ?></label></p>
	<p><i> <?php _e( 'Proxy scripts through your website to get precise and secure analytics. Learn how to do that in the <a href="https://www.finteza.com/en/developer/insert-code/proxy-script-request" target=_blank>user guide</a>', 'finteza' ); ?> </i></p>
	<?php
}
