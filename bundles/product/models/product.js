
/**
 * Created by Awesome on 2/6/2016.
 */

// use strict


// import local dependencies
const Model  = require('model');
const config = require('config');

// get product helper
const formHelper    = helper('form');
const productHelper = helper('product');

// require models
const Category = model('category');

/**
 * create address class
 */
class Product extends Model {
  /**
   * construct item model
   *
   * @param attrs
   * @param options
   */
  constructor() {
    // run super
    super(...arguments);

    // bind methods
    this.sanitise = this.sanitise.bind(this);
  }

  /**
   * add indexes
   *
   * @return {Promise}
   */
  static async initialize() {
    // create index
    await this.createIndex('platforms', {
      platforms : 1,
    });

    // create index
    await this.createIndex('title-en-us', {
      'title.en-us' : 1,
    });

    // create index
    await this.createIndex('slug', {
      slug : 'hashed',
    });

    // create index
    await this.createIndex('cagegoryID', {
      'category.id' : 1,
    });

    // create index
    await this.createIndex('published', {
      published : 1,
    });

    // create index
    await this.createIndex('promoted', {
      promoted : 1,
    });

    // create index
    await this.createIndex('createdAt', {
      created_at : -1,
    });

    // create index
    await this.createIndex('updatedAt', {
      updated_at : -1,
    });
  }

  /**
   * sanitises bot
   *
   * @return {Object}
   */
  async sanitise(small) {
    // get helper
    const type = this.get('type') || 'simple';

    // sanitise
    const sanitised = {
      type,

      id           : this.get('_id') ? this.get('_id').toString() : null,
      is           : 'product',
      sku          : this.get('sku') || '',
      price        : await productHelper.price(this, {}),
      pricing      : this.get('pricing') || {},
      promoted     : this.get('promoted') || false,
      published    : this.get('published') || false,
      availability : this.get('availability') || {},
    };

    // get form
    const form = await formHelper.get('shop.product');

    // add other fields
    await Promise.all((form.get('_id') ? form.get('fields') : config.get('shop.product.fields').slice(0)).map(async (field, i) => {
      // set field name
      const fieldName = field.name || field.uuid;

      // set sanitised
      sanitised[fieldName] = await this.get(fieldName);
      sanitised[fieldName] = sanitised[fieldName] && sanitised[fieldName].sanitise ? await sanitised[fieldName].sanitise() : sanitised[fieldName];
      sanitised[fieldName] = Array.isArray(sanitised[fieldName]) ? await Promise.all(sanitised[fieldName].map((val) => {
        // return sanitised value
        if (val.sanitise) return val.sanitise();
      })) : sanitised[fieldName];
    }));

    // check if small
    if (!small) {
      // let children
      const children = this.get('_id') ? await Category.find({
        'parent.id' : this.get('_id').toString(),
      }) : [];

      // set children
      sanitised.children = children && children.length ? await Promise.all(children.map((child) => {
        // return sanitised child category
        return child.sanitise(small);
      })) : [];
    }

    // await hook
    await this.eden.hook('product.sanitise', {
      sanitised,

      product : this,
    });

    // return sanitised
    return sanitised;
  }
}

/**
 * export product class
 *
 * @type {Product}
 */
exports = module.exports = Product;
