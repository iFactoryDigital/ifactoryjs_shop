
// require dependencies
const money  = require('money-math');
const colors = require('colors');
const config = require('config');
const Helper = require('helper');

// require helpers
const productHelper = helper('product');

// get product
const Product = model('product');

/**
 * build order helper
 */
class OrderHelper extends Helper {
  /**
   * construct product helper
   */
  constructor() {
    // run super
    super();

    // bind methods
    this.complete = this.complete.bind(this);

    // bind private methods
    this._log = this._log.bind(this);
  }


  // ////////////////////////////////////////////////////////////////////////////
  //
  // HOOK METHODS
  //
  // ////////////////////////////////////////////////////////////////////////////

  /**
   * creates order
   *
   * @param  {Object} data
   *
   * @return {Promise}
   */
  async complete(order, body) {
    // set actions
    Object.keys(body.actions).forEach((key) => {
      // set meta
      order.set(`actions.${key}.meta`, body.actions[key].meta);

      // set value
      order.set(`actions.${key}.value`, body.actions[key].value);
    });

    // run actions
    const actions = Object.values(order.get('actions') || []).sort((a, b) => {
      // set x/y
      const x = a.priority || 0;
      const y = b.priority || 0;

      // return action
      return x < y ? -1 : x > y ? 1 : 0;
    });

    // loop actions
    for (let i = 0; i < actions.length; i += 1) {
      // run hook
      await this.eden.hook(`order.${actions[i].type}`, order, actions[i], actions);
    }

    // load actions
    await this.eden.hook('order.init', order);

    // save order
    await order.save(await order.get('user'));
  }

  /**
   * gets order lines prices
   *
   * @param  {Order}  order
   * @param  {Array}  lines
   *
   * @return {Promise}
   */
  lines(order, lines) {
    // return promised lines
    return Promise.all(lines.map(line => this.line(order, null, line)));
  }

  /**
   * gets order line price
   *
   * @param  {Order}  order
   * @param  {*}      product
   * @param  {Object} line
   *
   * @return {Promise}
   */
  async line(order, product, line) {
    // get product
    if (!product) product = await Product.findById(line.product);

    // clone line
    line = Object.assign({}, line);

    // get price
    const price = parseFloat(money.floatToAmount(await productHelper.price(product, line.opts || {})));

    // return value
    const amount = parseFloat(money.floatToAmount(parseFloat(price.amount) * parseInt(line.qty || 1, 10)));

    // hook
    await this.eden.hook('line.price', {
      qty  : line.qty,
      user : await order.get('user'),
      opts : line.opts,

      order,
      price,
      amount,
      product,
    });

    // set price
    line.sku = product.get('sku') + (Object.values(line.opts || {})).join('_');
    line.title = Object.values(product.get('title'))[0];
    line.price = price;
    line.total = amount;

    // return price
    return line;
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
    // log with log function
    this.logger.log((success ? 'info' : 'error'), ` [${colors.green(product.get(`title.${config.get('i18n.fallbackLng')}`))}] ${message}`, {
      class : 'OrderHelper',
    });
  }
}

/**
 * export new orderHelper class
 *
 * @return {orderHelper}
 */
module.exports = new OrderHelper();
