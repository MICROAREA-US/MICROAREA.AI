<?php
if ( ! function_exists( 'add_action' ) ) {
	die();
}

$fz_info = Finteza_Analytics_Plugin::get_fz_info();
?>

<div class="fz-page wrap">
	<div class="fz-page__header">
		<h1 class="fz-header">
			<span class="fz-header__title">
				<?php echo $fz_info['plugin_name']; ?>
				<small class="fz-header__meta"><?php echo 'version '. $fz_info['version'] . ' (' . $fz_info['version_date'] . ')'; ?></small>
			</span>
		</h1>

		<?php
		if ( isset( $_GET['registration_complete'] ) && $_GET['registration_complete'] == 1 ) {
			echo '<div class="updated notice is-dismissible"><p><b>' . __( 'Registration completed successfully', 'finteza' ) . '.</b> ' . __( 'Please activate your account using the link sent to your registration_complete email', 'finteza' ) . '.</p></div>';}
		?>

		<p class="fz-header__description"><?php echo __( 'Real-time web analytics. Track your site visits, page views and events. Analyze the incoming traffic quality, explore user behavior and create conversion funnels. With the user-friendly interface, you can access the most realistic unsampled data without delays', 'finteza' ); ?>!</p>

		<ul class="fz-menu">
			<li class="fz-menu__item"><a href="<?php echo FINTEZA_ANALYTICS_WEBSITE_URL ?>" target="_blank"><?php echo __( 'Official website', 'finteza' ); ?></a></li>

			<?php
			if ( $this->is_reg_needed ) {
				echo '<li class="fz-menu__item"><a href="' . FINTEZA_ANALYTICS_DEMO_URL . '" target="_blank">' . __( 'Demo', 'finteza' ) . '</a></li>';
			} else {
				echo '<li class="fz-menu__item"><a href="' . FINTEZA_ANALYTICS_STATS_URL . '" target="_blank">' . __( 'View statistics', 'finteza' ) . '</a></li>';
			}
			?>
		</ul>
	</div>

		<div id="fz-panel-settings" class="fz-panel postbox">
			<div class="fz-toggle">
				<h2 class="fz-panel__title"><?php esc_html_e( 'Tracking settings', 'finteza' ); ?></h2>
			</div>
			<div class="toggle">
				<form method="post" action="options.php">
					<?php
						settings_fields( 'finteza_settings' );
						do_settings_sections( 'finteza_settings_section' );
						submit_button();
					?>
				</form>
			</div>
		</div>

		<?php if ( $this->is_reg_needed ) { ?>
		<div id="fz-panel-registration" class="fz-panel postbox">
			<div class="fz-toggle">
				<h2 class="fz-panel__title"><?php esc_html_e( 'Registration', 'finteza' ); ?></h2>
			</div>
			<div class="toggle<?php if ( empty( get_settings_errors( 'finteza_register' ) ) ) echo ' default-hidden'; ?>">
				<form method="post" action="options.php">
					<?php
						settings_fields( 'finteza_register' );
						do_settings_sections( 'finteza_register_section' );
						submit_button( __( 'Register', 'finteza' ), 'primary', '', true, array( 'id' => 'doaction2', 'disabled' => 'disabled' ) );
					?>
				</form>
			</div>
		</div>
		<?php } ?>

		<div id="fz-panel-getting-started" class="fz-panel postbox">
			<div class="fz-toggle">
				<h2 class="fz-panel__title"><?php esc_html_e( 'Getting started', 'finteza' ); ?></h2>
			</div>
			<div class="toggle default-hidden">
				<p>
				<?php finteza_analytics_echo_multiline( __( 'How to use the plugin: 1. <a href=https://www.finteza.com/en/register data-target=registration target=_blank>Register</a> an account in Finteza; 2. Save the generated website ID in the settings; 3. Configure tracking of link click events; 4. View your website visit statistics in the <a href=https://panel.finteza.com target=_blank>Finteza dashboard</a>', 'finteza') ); ?>
				</p>
			</div>
		</div>

		<div id="fz-panel-howto-tracking" class="fz-panel postbox">
			<div class="fz-toggle">
				<h2 class="fz-panel__title"><?php esc_html_e( 'How to track clicks', 'finteza' ); ?></h2>
			</div>
			<div class="toggle default-hidden">
				<p>
				<?php finteza_analytics_echo_multiline( __( 'To enable tracking of link click events in your website: 1. Open a website page or message for editing; 2. In the text editor, select the link element and click on the Finteza button; 3. Enter the click event name to be used in statistics; 4. View event statistics in the <a href=https://panel.finteza.com target=_blank>Finteza dashboard</a>', 'finteza' ) ); ?>
				</p>
			</div>
		</div>
		<div id="fz-panel-howto-title" class="fz-panel postbox">
			<div class="fz-toggle">
				<h2 class="fz-panel__title"><?php esc_html_e( 'Where to view statistics', 'finteza' ); ?></h2>
			</div>
			<div class="toggle default-hidden">
				<p>
				<?php finteza_analytics_echo_multiline( __( 'Statistics on your website visits is collected in the <a href=https://panel.finteza.com target=_blank>Finteza dashboard</a>. Log in using the email and password specified during registration. If you forgot the password, use the <a href=https://panel.finteza.com/recovery target=_blank>password recovery</a> page', 'finteza' ) ); ?>
				</p>
			</div>
		</div>
</div>

<?php
	function finteza_analytics_echo_multiline( $text ) {
		$result = nl2br( $text );
		$result = preg_replace( '/(\/>)(\s)/', '$1&nbsp;', $result );
		$result = preg_replace( '/(&nbsp;\s)|(\s\s)/', '&nbsp;&nbsp;', $result );
		echo $result;
	}
?>
