
/**
 * Created by Awesome on 2/6/2016.
 */

// use strict


// import local dependencies
const Model = require('model');

// get other models
const Product = model('product');

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
  constructor(...args) {
    // run super
    super(...args);

    // bind methods
    this.sanitise = this.sanitise.bind(this);
  }

  /**
   * sanitises bot
   *
   * @return {Object}
   */
  async sanitise() {
    // return sanitised bot
    const sanitised = {
      id       : this.get('_id') ? this.get('_id').toString() : null,
      lines    : this.get('lines') || [],
      products : await Promise.all((this.get('lines') || []).map(async (line) => {
        // return sanitised images
        return await (await Product.findById(line.product)).sanitise();
      })),
    };

    // hook
    await this.eden.hook('cart.sanitise', {
      sanitised,

      cart : this,
    });

    // return sanitised
    return sanitised;
  }
}

/**
 * export cart class
 *
 * @type {cart}
 */
module.exports = Cart;
