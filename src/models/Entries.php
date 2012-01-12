<?php

/**
 *
 */
class Entries extends BaseModel
{
	/**
	 * Returns an instance of the specified model
	 * @static
	 * @param string $class
	 * @return object The model instance
	 */
	public static function model($class = __CLASS__)
	{
		return parent::model($class);
	}

	protected $hasContent = array(
		'content' => array('through' => 'EntryContent', 'foreignKey' => 'entry')
	);

	protected $hasMany = array(
		'children' => array('model' => 'Entries', 'foreignKey' => 'parent')
	);

	protected $belongsTo = array(
		'parent'  => array('model' => 'Entries'),
		'section' => array('model' => 'Sections', 'required' => true),
		'author'  => array('model' => 'Users', 'required' => true)
	);

	protected $attributes = array(
		'slug'        => array('type' => AttributeType::String, 'maxSize' => 250),
		'full_uri'    => array('type' => AttributeType::String, 'maxSize' => 1000),
		'post_date'   => array('type' => AttributeType::Integer),
		'expiry_date' => array('type' => AttributeType::Integer),
		'sort_order'  => array('type' => AttributeType::Integer),
		'enabled'     => array('type' => AttributeType::Boolean, 'required' => true, 'default' => true),
		'archived'    => array('type' => AttributeType::Boolean, 'required' => true, 'default' => false)
	);
}
