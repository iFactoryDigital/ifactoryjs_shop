
/**
 * Created by Awesome on 2/6/2016.
 */

// use strict
'use strict';

// import local dependencies
const Model = require('model');

/**
 * create address class
 */
class Cart extends Model {
  /**
   * construct item model
   *
   * @param attrs
   * @param options
   */
  constructor () {
    // run super
    super(...arguments);

    // bind methods
    this.sanitise = this.sanitise.bind(this);
  }

  /**
   * sanitises bot
   *
   * @return {Object}
   */
  async sanitise () {
    // return sanitised bot
    return {
      'id'       : this.get('_id') ? this.get('_id').toString() : null,
      'lines'    : this.get('lines') || [],
      'products' : await Promise.all((await this.get('products') || []).map((product) => {
        // return sanitised images
        return product.sanitise();
      }))
    };
  }
}

/**
 * export cart class
 *
 * @type {cart}
 */
exports = module.exports = Cart;
