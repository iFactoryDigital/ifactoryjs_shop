/**
 * Created by Awesome on 3/6/2016.
 */

// use strict


// require dependencies
const config = require('config');
const colors = require('colors');
const Helper = require('helper');

// require models
const Payment = model('payment');

// get helpers
const orderHelper = helper('order');

/**
 * build payment helper
 */
class PaymentHelper extends Helper {
  /**
   * construct payment helper
   */
  constructor() {
    // run super
    super();

    // bind methods
    this.payment = this.payment.bind(this);

    // bind private methods
    this._log = this._log.bind(this);
  }

  /**
   * creates payment for order
   *
   * @param  {order}  Order
   *
   * @return {Promise}
   */
  async payment(invoice, method) {
    // get total
    const user  = await invoice.get('user');
    const total = parseFloat(invoice.get('total'));

    // do payment
    const payment = new Payment({
      user,
      invoice,
      rate     : invoice.get('rate') || 1,
      orders   : [await invoice.get('order')],
      amount   : total,
      currency : invoice.get('currency') || config.get('shop.currency') || 'USD',
      complete : false,
    });

    // save payment
    await payment.save(user);

    // Set method
    payment.set('method', method);

    // do payment
    await this.eden.hook('payment.pay', payment);

    // Unset method data
    payment.unset('method.data.card');

    // save payment
    await payment.save(user);

    // return payment
    return payment;
  }

  /**
   * logs payment transaction
   *
   * @param  {user}     User
   * @param  {String}   way
   * @param  {string}   message
   * @param  {Boolean}  success
   */
  _log(user, way, message, success) {
    // try/catch
    try {
      // log with log function
      this.logger.log((success ? 'info' : 'error'), ` [${colors.green(user.get('username'))}] ${message}`, {
        class : 'PaymentHelper',
      });
    } catch (e) {}
  }
}

/**
 * export new paymentHelper class
 *
 * @return {PaymentHelper}
 */
module.exports = new PaymentHelper();
