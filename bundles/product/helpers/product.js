/**
 * Created by Awesome on 3/6/2016.
 */

// use strict
'use strict';

// require dependencies
const config = require('config');
const Helper = require('helper');

/**
 * build product helper
 */
class ProductHelper extends Helper {
  /**
   * construct product helper
   */
  constructor () {
    // run super
    super();

    // bind variables
    this.types    = [];
    this.payments = [];

    // bind methods
    this.order    = this.order.bind(this);
    this.payment  = this.payment.bind(this);
    this.quantity = this.quantity.bind(this);
    this.register = this.register.bind(this);

    // bind private methods
    this._log = this._log.bind(this);
  }

  /**
   * order product quantity
   *
   * @param  {product}  Product
   * @param  {Integer}  quantity
   *
   * @return {Promise}
   */
  async order (product, quantity) {
    // throw error
    if (!await this.quantity(product, quantity)) throw new Error('product.notenough');

    // set pending and sold
    product.set('selling', (product.get('selling') || 0) + quantity);

    // save product
    product.save();

    // set order
    let ordering = {
      'total'    : parseFloat(product.get('pricing.price')) * quantity,
      'product'  : product,
      'quantity' : quantity
    };

    // add to total
    await this.eden.hook('product.order', ordering);

    // return total
    return ordering.total;
  }

  /**
   * returns true if product has quantity
   *
   * @param  {product}  Product
   * @param  {Integer}  quantity
   *
   * @return {Boolean}
   */
  async quantity (product, quantity) {
    // await hook
    await this.eden.hook('product.quantity', product, quantity);

    // check quantity
    if ((product.get('quantity') - (product.get('selling') || 0)) >= quantity) return true;

    // return true
    return false;
  }

  /**
   * registers product type
   *
   * @param  {Object} type
   */
  register (type) {
    // registers product service
    this.types.push(type);
  }

  /**
   * registers product payment type
   *
   * @param  {String} option
   */
  payment (option) {
    // push payment type
    this.payments.push(option);
  }

  /**
   * logs product transaction
   *
   * @param  {product}  Product
   * @param  {string}   message
   * @param  {Boolean}  success
   */
  _log (product, message, success) {
    // log with log function
    this.logger.log((success ? 'info' : 'error'), ' [' + colors.green(product.get('title.' + config.get('i18n.fallbackLng'))) + '] ' + message, {
      'class' : 'product'
    });
  }
}

/**
 * export new productHelper class
 *
 * @return {ProductHelper}
 */
module.exports = new ProductHelper();
