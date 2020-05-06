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
          invoice     : invoice.get('_id'),
          invoiceno   : invoice.get('invoiceno') ? invoice.get('invoiceno') : '',
          order       : (await orders[0]).get('_id'),
          orderno     : (await orders[0]).get('orderno') ? (await orders[0]).get('orderno') : (await orders[0]).get('_id'),
          amount      : total,
          invoicedate : invoice.get('created_at'),
          orderdate   : (await orders[0]).get('created_at'),
          date        : new Date()
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
    //await this._recordAudit(payment.get('_id'), user, payment.get('paymentno'), 'Create', 'payment', payment, message);
    await this.eden.hook('audit.record', req, { model: payment, modelold: null, updates: null, update : false, message : message, no : 'paymentno', client : config.get('client'), excloude : [] });

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
}

/**
 * export new paymentHelper class
 *
 * @return {PaymentHelper}
 */
module.exports = new PaymentHelper();
