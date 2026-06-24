<?php

function finteza_analytics_domain() {
	$val = get_option( 'finteza_register' );
	$val = $val ? $val['finteza_domain'] : null;
	?>
	<input type="text" name="finteza_register[finteza_domain]" value="<?php echo get_site_url(); ?>" />
	<?php
}

function finteza_analytics_offset() {
	$val = get_option( 'finteza_register' );
	$val = $val ? $val['finteza_offset'] : null;
	?>
	<input type="text" name="finteza_register[finteza_offset]" value="<?php echo esc_attr( $val ); ?>" />
	<?php
}

function finteza_analytics_name() {
	$val = get_option( 'finteza_register' );
	$val = $val ? $val['finteza_name'] : null;
	?>
	<input type="text" name="finteza_register[finteza_name]" value="<?php echo esc_attr( $val ); ?>" required/>
	<?php
}

function finteza_analytics_company() {
	$val = get_option( 'finteza_register' );
	$val = $val ? $val['finteza_company'] : null;
	?>
	<input type="text" name="finteza_register[finteza_company]" value="<?php echo esc_attr( $val ); ?>"/>
	<?php
}

function finteza_analytics_email() {
	$val = get_option( 'finteza_register' );
	$val = $val ? $val['finteza_email'] : null;
	?>
	<input type="email" name="finteza_register[finteza_email]" value="<?php echo esc_attr( $val ); ?>" required/>
	<p><i><?php echo __( 'Will be used as login', 'finteza' ); ?></i></p>
	<?php
}

function finteza_analytics_password() {
	$val = get_option( 'finteza_register' );
	$val = $val ? $val['finteza_password'] : null;
	?>
	<input type="password" name="finteza_register[finteza_password]" value="<?php echo esc_attr( $val ); ?>" required/>
	<p><i><?php echo __( 'Must have at least 6 characters, upper and lower case letters and numbers', 'finteza' ); ?></i></p>
	<?php
}

function finteza_analytics_policy() {
	$val = get_option( 'finteza_register' );
	$val = $val ? $val['finteza_policy'] : null;
	?>
	<p>
	<label for="finteza_policy">
		<input type="checkbox" name="finteza_register[finteza_policy]" id="finteza_policy" value="<?php echo esc_attr( $val ); ?>" required/>
		<?php echo __( 'I have read and understood <a href=https://www.finteza.com/en/privacy target=_blank>privacy and data protection policy</a>', 'finteza' ); ?>
	</label>
	</p>
	<p>
	<label for="finteza_agreement">
		<input type="checkbox" name="finteza_register[finteza_agreement]" id="finteza_agreement" value="<?php echo esc_attr( $val ); ?>" required/>
		<?php echo __( 'I agree to <a href=https://www.finteza.com/en/agreement target=_blank>subscription service agreement</a>', 'finteza' ); ?>
	</label>
	</p>
	<?php
}
