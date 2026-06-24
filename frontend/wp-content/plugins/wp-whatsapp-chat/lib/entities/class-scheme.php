<?php
namespace QuadLayers\QLWAPP\Entities;

use QuadLayers\WP_Orm\Entity\SingleEntity;

class Scheme extends SingleEntity {
	public $font_family                = 'inherit';
	public $font_size                  = '18';
	public $icon_size                  = '60';
	public $icon_font_size             = '24';
	public $box_max_height             = '400';
	public $brand                      = '#25d366';
	public $text                       = '#ffffff';
	public $text_secondary             = '#303030';
	public $link                       = '';
	public $message                    = '';
	public $label                      = '';
	public $name                       = '';
	public $contact_role_color         = 'inherit';
	public $contact_name_color         = 'inherit';
	public $contact_availability_color = 'inherit';
	public $box_message_word_break     = 'break-all';
}
