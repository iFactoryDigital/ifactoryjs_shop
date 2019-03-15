/**
 * Created by Awesome on 3/6/2016.
 */

// use strict


// require dependencies
const config = require('config');
const colors = require('colors');
const Helper = require('helper');

// require models
const Invoice = model('invoice');

// get helpers
const orderHelper = helper('order');

/**
 * build payment helper
 */
class InvoiceHelper extends Helper {
  /**
   * construct payment helper
   */
  constructor() {
    // run super
    super();

    // bind methods
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
  async invoice(order) {
    // get lines
    const user  = await order.get('user');
    const lines = order.get('lines');

    // create new invoice
    const invoice = new Invoice({

      user  : await order.get('user'),
      total : (await orderHelper.lines(order, lines)).reduce((total, x) => {
        // return value
        return total += x.total;
      }, 0),
      lines : order.get('lines').map((line) => {
        // set order
        line.order = order.get('_id').toString();

        // return line
        return line;
      }),
      orders : [order],
    });

    // save order
    await order.save(user);

    // save invoice
    await invoice.save(user);

    // hook invoice
    await this.eden.hook('invoice.init', invoice);

    // save invoice
    await invoice.save(user);

    // return invoice
    return invoice;
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
        class : 'InvoiceHelper',
      });
    } catch (e) {}
  }
}

/**
 * export new paymentHelper class
 *
 * @return {InvoiceHelper}
 */
module.exports = new InvoiceHelper();
