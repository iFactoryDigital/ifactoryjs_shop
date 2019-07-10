
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
        'invoice.id' : this.get('_id') ? this.get('_id').toString() : 'null',
      }).find() || [];
    }

    // load payments
    const payments = invoicePayments.map((invoicePayment) => {
      // return sanitised images
      return invoicePayment.get('complete') ? invoicePayment.get('amount') : 0;
    });

    // get total
    const total = this.get('total') || (await this.get('orders') || []).reduce((accum, order) => {
      // return accumulated
      return accum + (order.get('lines') || []).reduce((a, line) => a + (line.total || (line.qty * line.price)), 0);
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
      // return sanitised images
      return invoicePayment.get('state') === 'approval' ? invoicePayment.get('amount') : 0;
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
      'invoice.id' : this.get('_id') ? this.get('_id').toString() : 'null',
    }).find() || []);

    // load payments
    const payments = invoicePayments.map((invoicePayment) => {
      // return sanitised images
      return invoicePayment.get('complete') ? invoicePayment.get('amount') : 0;
    });

    // get total
    const total = this.get('total') || (await this.get('orders') || []).reduce((accum, order) => {
      // return accumulated
      return accum + (order.get('lines') || []).reduce((a, line) => a + (line.total || (line.qty * line.price)), 0);
    }, 0);

    // return sanitised bot
    const sanitised = {
      total,

      id     : this.get('_id') ? this.get('_id').toString() : false,
      rate   : this.get('rate'),
      paid   : await this.hasPaid(invoicePayments),
      note   : this.get('note'),
      // eslint-disable-next-line no-nested-ternary
      status : total <= (payments.length ? payments : [0]).reduce((a, b) => {
        // return a + b
        return a + b;
      // eslint-disable-next-line no-nested-ternary
      }) ? 'paid' : (payments.length ? payments : [0]).reduce((a, b) => {
        // return a + b
          return a + b;
        }) > 0 ? 'partial' : (this.hasApproval(invoicePayments) ? 'approval' : 'unpaid'),
      discount : this.get('discount') || 0,
      currency : this.get('currency'),
      payments : await Promise.all(invoicePayments.map((invoicePayment) => {
        // return sanitised images
        return invoicePayment.sanitise();
      })),
      updated : this.get('updated_at'),
      created : this.get('created_at'),
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
