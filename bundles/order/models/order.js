
/**
 * Created by Awesome on 2/6/2016.
 */

// use strict


// import local dependencies
const eden  = require('eden');
const Model = require('model');

// load product model
const Product = model('product');

/**
 * create order class
 */
class Order extends Model {
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
    this.count = this.count.bind(this);
    this.sanitise = this.sanitise.bind(this);
  }

  /**
   * gets total products in order
   *
   * @return {Promise}
   */
  async count() {
    // get quantities
    const values = Object.values(this.get('quantities') || {});

    // push null value
    values.push(0);

    // return reduced
    return values.reduce((a, b) => {
      // return a + b
      return a + b;
    });
  }

  /**
   * sanitises bot
   *
   * @return {Object}
   */
  async sanitise() {
    // get address
    const address = await this.get('address');

    // return sanitised bot
    const sanitised = {
      id       : this.get('_id') ? this.get('_id').toString() : null,
      user     : this.get('user.id') ? await (await this.get('user')).sanitise() : null,
      sent     : this.get('sent'),
      error    : this.get('error'),
      lines    : this.get('lines'),
      status   : this.get('status') || 'pending',
      actions  : this.get('actions'),
      created  : this.get('created_at'),
      invoice  : (await this.get('invoice')) ? await (await this.get('invoice')).sanitise() : null,
      redirect : this.get('redirect'),
      products : await Promise.all((this.get('lines') || []).map(async (line) => {
        // get product
        const product = await Product.findById(line.product);

        // return sanitised images
        return await product.sanitise();
      })),
      address   : address ? (address.sanitise ? await address.sanitise() : address) : null,
      processed : this.get('processed'),
    };

    // run hook
    await eden.hook('order.sanitise', {
      order : this,
      sanitised,
    });

    // return sanitised
    return sanitised;
  }
}

/**
 * export order class
 *
 * @type {order}
 */
exports = module.exports = Order;
