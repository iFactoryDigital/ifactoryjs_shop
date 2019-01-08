
// require dependencies
const config = require('config');
const Helper = require('helper');

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

  /**
   * creates order
   *
   * @param  {Object} data
   *
   * @return {Promise}
   */
  async complete(order, body) {
    // set actions
    for (const key in body.actions) {
      // set meta
      order.set(`actions.${key}.meta`, body.actions[key].meta);

      // set value
      order.set(`actions.${key}.value`, body.actions[key].value);
    }

    // run actions
    const actions = Object.values(order.get('actions') || []).sort((a, b) => {
      // set x/y
      const x = a.priority || 0;
      const y = b.priority || 0;

      // return action
      return x < y ? -1 : x > y ? 1 : 0;
    });

    // loop actions
    for (let i = 0; i < actions.length; i++) {
      // run hook
      await this.eden.hook(`order.${actions[i].type}`, order, actions[i], actions);
    }

    // load actions
    await this.eden.hook('order.init', order);

    // save order
    await order.save();
  }

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
      class : 'product',
    });
  }
}

/**
 * export new orderHelper class
 *
 * @return {orderHelper}
 */
module.exports = new OrderHelper();
