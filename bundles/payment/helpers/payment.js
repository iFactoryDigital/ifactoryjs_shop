/**
 * Created by Awesome on 3/6/2016.
 */

// use strict
'use strict';

// require dependencies
const is     = require('is-type');
const socket = require('socket');
const Helper = require('helper');

// require models
const Invoice = model('invoice');
const Payment = model('payment');
const Product = model('product');

/**
 * build payment helper
 */
class PaymentHelper extends Helper {
  /**
   * construct payment helper
   */
  constructor () {
    // run super
    super ();

    // bind methods
    this.payment = this.payment.bind(this);
    this.invoice = this.invoice.bind(this);

    // bind private methods
    this._log = this._log.bind(this);
  }

  /**
   * create payment function
   *
   * @param  {order}  Order
   * @param  {Object} method
   *
   * @return  {Promise}
   * @resolve {invoice}
   */
  async invoice (order) {
    // create new invoice
    let invoice = new Invoice({
      'user'  : await order.get('user'),
      'order' : order,
      'total' : (await Promise.all(order.get('lines').map(async (line) => {
        // priced
        let item = {
          'qty'     : line.qty,
          'opts'    : line.opts || {},
          'user'    : await order.get('user'),
          'product' : await Product.findById(line.product)
        };

        // return price
        await this.eden.hook('product.order', item);

        // check error
        if (item.error) order.set('error', item.error);

        // let opts
        let opts = {
          'qty'   : parseInt(line.qty),
          'item'  : item,
          'base'  : (parseFloat(item.price) || 0),
          'price' : (parseFloat(item.price) || 0) * parseInt(line.qty),
          'order' : order
        };

        // price item
        await this.eden.hook('line.price', opts);

        // return price
        return opts.price;
      }))).reduce((total, x) => total += x, 0),
      'lines' : order.get('lines')
    });

    // save invoice
    await invoice.save();

    // hook invoice
    await this.eden.hook('invoice.init', invoice);

    // save invoice
    await invoice.save();

    // return invoice
    return invoice;
  }

  /**
   * creates payment for order
   *
   * @param  {order}  Order
   *
   * @return {Promise}
   */
  async payment (invoice, method) {
    // get total
    let total = parseFloat(invoice.get('total'));

    // do payment
    let payment = new Payment({
      'user'     : await invoice.get('user'),
      'rate'     : invoice.get('rate') || 1,
      'amount'   : total,
      'invoice'  : invoice,
      'currency' : invoice.get('currency') || 'USD',
      'complete' : false
    });

    // save payment
    await payment.save();

    // Set method
    payment.set('method', method);

    // do payment
    await this.eden.hook('payment.pay', payment);

    // Unset method data
    payment.unset('method.data.card');

    // save payment
    await payment.save();

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
  _log (user, way, message, success) {
    // log with log function
    this.logger.log((success ? 'info' : 'error'), ' [' + colors.green(user.get('username')) + '] ' + message, {
      'class' : 'payment'
    });
  }
}

/**
 * export new paymentHelper class
 *
 * @return {PaymentHelper}
 */
module.exports = new PaymentHelper();
