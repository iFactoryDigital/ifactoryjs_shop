/**
 * Created by Awesome on 3/6/2016.
 */

// use strict


// require dependencies
const colors = require('colors');
const config = require('config');
const Helper = require('helper');

/**
 * build product helper
 */
class ProductHelper extends Helper {
  /**
   * construct product helper
   */
  constructor() {
    // run super
    super();

    // bind methods
    this.order = this.order.bind(this);
    this.register = this.register.bind(this);
    this.complete = this.complete.bind(this);
    this.quantity = this.quantity.bind(this);
    this.products = this.products.bind(this);

    // bind private methods
    this._log = this._log.bind(this);

    // bind products
    this.__products = [];
  }


  // ////////////////////////////////////////////////////////////////////////////
  //
  // HELPER METHODS
  //
  // ////////////////////////////////////////////////////////////////////////////

  /**
   * gets product price for model
   *
   * @param  {Product} product
   * @param  {Object}  opts
   *
   * @return {*}
   */
  price(product, opts) {
    // get type
    const type = product.get('type') || 'simple';

    // get product type
    const registered = this.__products.find(p => p.type === type);

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
  async order(product, line, req) {
    // get type
    const type = product.get('type') || 'simple';

    // get product type
    const registered = this.__products.find(p => p.type === type);

    // log
    this._log(product, `[${type}] ${line.qty.toLocaleString()} ordered`, true);

    // await price
    const rtn = await registered.order(product, line, req);

    // emit to eden
    this.eden.emit('product.ordered', {
      line,
      product,

      qty  : line.qty,
      user : req.user,
    });

    // return
    return rtn;
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
  async complete(product, line, order) {
    // get type
    const type = product.get('type') || 'simple';

    // get product type
    const registered = this.__products.find(p => p.type === type);

    // log
    this._log(product, `[${type}] ${line.qty.toLocaleString()} purchased`, true);

    // await price
    const rtn = await registered.complete(product, line, order);

    // emit to eden
    this.eden.emit('product.completed', {
      line,
      order,
      product,

      qty  : line.qty,
      user : await order.get('user'),
    });

    // return
    return rtn;
  }

  /**
   * returns true if product has quantity
   *
   * @param  {product}  Product
   * @param  {Integer}  quantity
   *
   * @return {Boolean}
   */
  async quantity(product, quantity) {
    // await hook
    await this.eden.hook('product.quantity', product, quantity);

    // check quantity
    if ((product.get('quantity') - (product.get('selling') || 0)) >= quantity) return true;

    // return true
    return false;
  }


  // ////////////////////////////////////////////////////////////////////////////
  //
  // REGISTER METHODS
  //
  // ////////////////////////////////////////////////////////////////////////////

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
  register(type, opts, price, order, complete) {
    // check found
    const found = this.__products.find(product => product.type === type);

    // push block
    if (!found) {
      // check found
      this.__products.push({
        type,
        opts,
        price,
        order,
        complete,
      });
    } else {
      // set on found
      found.type = type;
      found.opts = opts;
      found.price = price;
      found.order = order;
      found.complete = complete;
    }
  }

  /**
   * gets blocks
   *
   * @return {Array}
   */
  products() {
    // returns blocks
    return this.__products;
  }


  // ////////////////////////////////////////////////////////////////////////////
  //
  // PRIVATE METHODS
  //
  // ////////////////////////////////////////////////////////////////////////////

  /**
   * logs product transaction
   *
   * @param  {product}  Product
   * @param  {string}   message
   * @param  {Boolean}  success
   */
  _log(product, message, success) {
    // prevent errors
    try {
      // log with log function
      this.logger.log((success ? 'info' : 'error'), ` [${colors.green(product.get(`title.${config.get('i18n.fallbackLng')}`))}] ${message}`, {
        class : 'ProductHelper',
      });
    } catch (e) {}
  }
}

/**
 * export new productHelper class
 *
 * @return {ProductHelper}
 */
module.exports = new ProductHelper();
