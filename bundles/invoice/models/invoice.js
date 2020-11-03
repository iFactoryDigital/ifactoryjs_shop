
// import local dependencies
const Model = require('model');

// load models
const Payment = model('payment');

/**
 * create Invoice class
 */
class Invoice extends Model {
  /**
   * construct Invoice model
   *
   * @param attrs
   * @param options
   */
  constructor(...args) {
    // run super
    super(...args);

    // bind methods
    this.sanitise = this.sanitise.bind(this);
  }

  /**
   * returns if order has been paid
   *
   * @param {Array} invoicePayments
   */
  async hasPaid(invoicePayments) {
    // load payments
    if (!invoicePayments) {
      // payments
      invoicePayments = await Payment.where({
        'invoices.invoice' : this.get('_id') ? this.get('_id').toString() : 'null',
      }).find() || [];
    }

    // load payments
    const payments = invoicePayments.map((invoicePayment) => {
      // return sanitised images
      // return invoicePayment.get('complete') ? invoicePayment.get('amount') : 0;
      let amount = 0;
      (invoicePayment.get('complete') || invoicePayment.get('state') === 'paid') ? invoicePayment.get('invoices').map(i => i.invoice === this.get('_id').toString() ? amount += i.amount : '') : '';
      return amount;
    });

    // get total
    const total = this.get('total') || (await this.get('orders') || []).reduce((accum, order) => {
      let discount = order.get('discount') ? parseFloat(order.get('discount')) : 0;
      // return accumulated
      return accum + (order.get('lines') || []).reduce((a, line) => a + (line.total || (line.qty * line.price)), 0) - discount;
    }, 0);

    // return
    return (payments.length ? payments : [0]).reduce((a, b) => {
      // return a + b
      return a + b;
    }) >= total;
  }

  /**
   * returns has payment requiring approval
   *
   * @param {*} invoicePayments
   */
  async hasApproval(invoicePayments) {
    // load payments
    if (!invoicePayments) {
      // payments
      invoicePayments = await Payment.where({
        'invoice.id' : this.get('_id') ? this.get('_id').toString() : 'null',
      }).find() || [];
    }

    // load payments
    const payments = (invoicePayments.map((invoicePayment) => {
      let amount = 0;
      invoicePayment.get('state')  === 'approval' ? invoicePayment.get('invoices').map(i => i.invoice === this.get('_id').toString() ? amount += i.amount : '') : '';
      return amount;
    })).reduce((accum, amount) => accum + amount, 0);

    // return approval
    return payments;
  }

  /**
   * sanitises bot
   *
   * @return {Object}
   */
  async sanitise() {
    // load payments
    const invoicePayments = (await Payment.where({
      'invoices.invoice' : this.get('_id') ? this.get('_id').toString() : 'null',
    }).find() || []);

    // load payments
    let payments = 0;
    invoicePayments.map((invoicePayment) => {
      (invoicePayment.get('complete') || invoicePayment.get('state') === 'paid') ? invoicePayment.get('invoices').map(i => i.invoice === this.get('_id').toString() ? payments += i.amount : '') : '';
    });

    // load payments
    let totalpayments = 0;
    invoicePayments.map((invoicePayment) => {
      // return sanitised images
      //return invoicePayment.get('complete') ? invoicePayment.get('amount') : 0;
      invoicePayment.get('invoices').map(i => i.invoice === this.get('_id').toString() ? totalpayments += i.amount : '');
    });

    // get total
    const total = this.get('total') || (await this.get('orders') || []).reduce((accum, order) => {
      let discount = order.get('discount') ? parseFloat(order.get('discount')) : 0;
      // return accumulated
      return accum + (order.get('lines') || []).reduce((a, line) => a + (line.total || (line.qty * line.price)), 0) - discount;
    }, 0);

    // return sanitised bot
    const sanitised = {
      id        : this.get('_id') ? this.get('_id').toString() : false,
      invoiceno : this.get('invoiceno') ? this.get('invoiceno').toString() : null,
      rate      : this.get('rate'),
      paid      : await this.hasPaid(invoicePayments),
      note      : this.get('note'),
      status    : total <= (payments.length ? payments : [0]).reduce((a, b) => {
        // return a + b
        return a + b;
      // eslint-disable-next-line no-nested-ternary
      }) ? 'paid' : (payments.length ? payments : [0]).reduce((a, b) => {
        // return a + b
          return a + b;
        }) > 0 ? 'partial' : (await this.hasApproval(invoicePayments) ? 'approval' : 'unpaid'),
      discount   : this.get('discount') || 0,
      currency   : this.get('currency'),
      payments   : await Promise.all(invoicePayments.map((invoicePayment) => {
        // return sanitised images
        return invoicePayment.sanitise();
      })),
      state     : this.get('state') ? this.get('state') : '',
      updated   : this.get('updated_at'),
      created   : this.get('created_at'),
      customer  : this.get('customer') ? this.get('customer') : null,
      total,
      totalpayments,
      totalpaidpayments : payments
    };

    // invoice sanitise
    await this.eden.hook('invoice.sanitise', {
      sanitised,

      invoice : this,
    });

    // return sanitised
    return sanitised;
  }
}

/**
 * export Invoice class
 *
 * @type {Invoice}
 */
module.exports = Invoice;
