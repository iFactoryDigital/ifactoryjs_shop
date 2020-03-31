/* eslint-disable no-empty */
/**
 * Created by Awesome on 3/6/2016.
 */

// require dependencies
const config = require('config');
const colors = require('colors');
const Helper = require('helper');

// require models
const Payment = model('payment');
const Audit   = model('audit');

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
    this._recordAudit = this._recordAudit.bind(this);
  }


  // ////////////////////////////////////////////////////////////////////////////
  //
  // NORMAL METHODS
  //
  // ////////////////////////////////////////////////////////////////////////////

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
    /*
    const payment = new Payment({
      user,
      invoice,
      rate     : invoice.get('rate') || 1,
      orders   : [await invoice.get('order')],
      amount   : total,
      currency : invoice.get('currency') || config.get('shop.currency') || 'USD',
      complete : false,
    });
    */
    // save payment
    const payment = new Payment({
      invoice,
      customer : invoice.get('customer'),
      user,
      rate     : 1,
      admin,
      amount   : total,
      currency : invoice.get('currency') || config.get('shop.currency') || 'USD',
      complete : false,
      invoices : [{
          invoice   : invoice.get('_id'),
          invoiceno : invoice.get('invoiceno') ? invoice.get('invoiceno') : '',
          order     : (await invoice.get('order')).get('_id'),
          orderno   : (await invoice.get('order')).get('orderno') ? (await invoice.get('order')).get('orderno') : (await invoice.get('order')).get('_id'),
          amount    : total
      }]
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

    message = `Create Payment #${ payment.get('paymentno') }: ${ (payment.get('method') || {}).type } ${ amount } Assigned Payment to ${ invoice.get('invoiceno') }`;
    await this._recordAudit(payment.get('_id'), user, payment.get('paymentno'), 'Create', 'payment', payment, message);

    // return payment
    return payment;
  }


  // ////////////////////////////////////////////////////////////////////////////
  //
  // PRIVATE METHODS
  //
  // ////////////////////////////////////////////////////////////////////////////

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

  /**
   * logs balance transaction
   *
   * @param  {String}  targetid
   * @param  {String}  by
   * @param  {String}  for_
   * @param  {String}  way
   * @param  {String}  type
   * @param  {Object}  subject
   * @param  {String}  message
   */
  async _recordAudit(targetid, by, for_, way, type, subject, message) {
    const audit = new Audit({
      by,
      for     : for_,
      way,
      type,
      subject,
      message,
      targetid,
    });

    // save entry
    await audit.save();
  }
}

/**
 * export new paymentHelper class
 *
 * @return {PaymentHelper}
 */
module.exports = new PaymentHelper();
