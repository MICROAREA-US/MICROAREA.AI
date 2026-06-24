<?php
namespace QuadLayers\QLWAPP\Entities;

use QuadLayers\WP_Orm\Entity\SingleEntity;

class WooCommerce extends SingleEntity {
	public $layout             = 'button';
	public $box                = 'no';
	public $position           = 'woocommerce_before_add_to_cart_form';
	public $text               = '';
	public $message            = '';
	public $icon               = 'qlwapp-whatsapp-icon';
	public $type               = 'phone';
	public $phone              = QLWAPP_PHONE_NUMBER;
	public $group              = QLWAPP_GROUP_LINK;
	public $developer          = 'no';
	public $rounded            = 'yes';
	public $timefrom           = '00:00';
	public $timeto             = '00:00';
	public $timedays           = array();
	public $timezone           = '';
	public $visibility         = 'readonly';
	public $whatsapp_link_type = 'web';
	public $animation_name     = '';
	public $animation_delay    = '';
	public $position_priority  = 10;
	public $devices            = 'hide';

	public function __construct() {
		$this->text     = esc_html__( 'Ask about this product', 'wp-whatsapp-chat' );
		$this->message  = esc_html__( 'Hi! I\'m interested in *{PRODUCT_TITLE}* ({PRODUCT_PRICE}). Could you provide more information? {PRODUCT_URL}', 'wp-whatsapp-chat' );
		$this->timezone = qlwapp_get_timezone_current();
	}
}
