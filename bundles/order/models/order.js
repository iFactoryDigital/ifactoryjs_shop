/* eslint-disable no-nested-ternary */

/**
 * Created by Awesome on 2/6/2016.
 */

// use strict


// import local dependencies
const eden  = require('eden');
const Model = require('model');

// load product model
const Product = model('product');
const Invoice = model('invoice');

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
  constructor(...args) {
    // run super
    super(...args);

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
  async sanitise(args = {}) {
    // get address
    const address = await this.get('address');

    // find invoice
    const invoice = await this.get('invoice') || await Invoice.findOne({
      'orders.id' : this.get('_id'),
    });

    // return sanitised bot
    const sanitised = {
      id       : this.get('_id') ? this.get('_id').toString() : null,
      user     : this.get('user.id') ? await (await this.get('user')).sanitise() : null,
      sent     : this.get('sent'),
      error    : this.get('error'),
      lines    : this.get('lines'),
      status   : this.get('status') || 'draft',
      actions  : this.get('actions'),
      created  : this.get('created_at'),
      invoice  : invoice ? await invoice.sanitise() : null,
      redirect : this.get('redirect'),
      products : await Promise.all((this.get('lines') || []).map(async (line) => {
        // get product
        const product = await Product.findById(line.product);

        // return sanitised images
        return product ? await product.sanitise() : null;
      })),
      address   : address ? (address.sanitise ? await address.sanitise() : address) : null,
      processed : this.get('processed'),
    };

    // run hook
    await eden.hook('order.sanitise', {
      args,
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
module.exports = Order;
