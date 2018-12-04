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

    // bind methods
    this.order    = this.order.bind(this);
    this.product  = this.product.bind(this);
    this.complete = this.complete.bind(this);
    this.quantity = this.quantity.bind(this);
    this.products = this.products.bind(this);

    // bind private methods
    this._log = this._log.bind(this);

    // bind products
    this.__products = [];
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
   * gets product price for model
   *
   * @param  {Product} product
   * @param  {Object}  opts
   *
   * @return {*}
   */
  price (product, opts) {
    // get product type
    let registered = this.__products.find((p) => p.type === product.get('type'));

    // await price
    return registered.price(product, opts);
  }

  /**
   * gets product price for model
   *
   * @param  {Product} product
   * @param  {Object}  line
   * @param  {Object}  req
   *
   * @return {*}
   */
  order (product, line, req) {
    // get product type
    let registered = this.__products.find((p) => p.type === product.get('type'));

    // await price
    return registered.order(product, line, req);
  }

  /**
   * gets product price for model
   *
   * @param  {Product} product
   * @param  {Object}  line
   * @param  {Order}   order
   *
   * @return {*}
   */
  complete (product, line, order) {
    // get product type
    let registered = this.__products.find((p) => p.type === product.get('type'));

    // await price
    return registered.complete(product, line, order);
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
   * register block
   *
   * @param  {String}   type
   * @param  {Object}   opts
   * @param  {Function} price
   * @param  {Function} order
   * @param  {Function} complete
   *
   * @return {*}
   */
  product (type, opts, price, order, complete) {
    // check found
    let found = this.__products.find((product) => product.type === type);

    // push block
    if (!found) {
      // check found
      this.__products.push({
        'type'     : type,
        'opts'     : opts,
        'price'    : price,
        'order'    : order,
        'complete' : complete
      });
    } else {
      // set on found
      found.type     = type;
      found.opts     = opts;
      found.price    = price;
      found.order    = order;
      found.complete = complete;
    }
  }

  /**
   * gets blocks
   *
   * @return {Array}
   */
  products () {
    // returns blocks
    return this.__products;
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
