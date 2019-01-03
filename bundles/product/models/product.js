
/**
 * Created by Awesome on 2/6/2016.
 */

// use strict


// import local dependencies
const eden  = require('eden');
const Model = require('model');

// get product helper
const ProductHelper = helper('product');

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
  async sanitise() {
    // get helper
    const type = this.get('type') || 'simple';

    // sanitise
    const sanitised = {
      id     : this.get('_id') ? this.get('_id').toString() : null,
      is     : 'product',
      sku    : this.get('sku') || '',
      type   : this.get('type') || '',
      slug   : this.get('slug') || '',
      title  : this.get('title') || {},
      short  : this.get('short') || {},
      images : await Promise.all((await this.get('images') || []).map((image) => {
        // return sanitised images
        return image.sanitise();
      })),
      categories  : await Promise.all((await this.get('categories') || []).map((category) => {
        // return sanitised category
        return category.sanitise(true);
      })),
      price        : await ProductHelper.price(this, {}),
      pricing      : this.get('pricing') || 0,
      promoted     : this.get('promoted') || false,
      published    : this.get('published') || false,
      description  : this.get('description') || {},
      availability : this.get('availability') || {},
    };

    // return sanitised bot
    await eden.hook('product.sanitise', {
      product   : this,
      sanitised,
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
