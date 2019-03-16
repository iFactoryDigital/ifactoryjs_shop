
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
  constructor() {
    // run super
    super(...arguments);

    // bind methods
    this.sanitise = this.sanitise.bind(this);
  }

  /**
   * sanitises bot
   *
   * @return {Object}
   */
  async sanitise() {
    // load payments
    const invoicePayments = (await Payment.where({
      'invoice.id' : this.get('_id').toString(),
    }).ne('method.type', null).find() || []);

    // load payments
    const payments = invoicePayments.map((invoicePayment) => {
      // return sanitised images
      return invoicePayment.get('complete') ? invoicePayment.get('amount') : 0;
    });

    // return sanitised bot
    return {
      id   : this.get('_id') ? this.get('_id').toString() : false,
      rate : this.get('rate'),
      paid : this.get('total') <= (payments.length ? payments : [0]).reduce((a, b) => {
        // return a + b
        return a + b;
      }),
      total  : this.get('total'),
      status : this.get('total') <= (payments.length ? payments : [0]).reduce((a, b) => {
        // return a + b
        return a + b;
      }) ? 'paid' : (payments.length ? payments : [0]).reduce((a, b) => {
        // return a + b
        return a + b;
      }) > 0 ? 'partial' : 'unpaid',
      discount : this.get('discount') || 0,
      currency : this.get('currency'),
      payments : await Promise.all(invoicePayments.map((invoicePayment) => {
        // return sanitised images
        return invoicePayment.sanitise();
      })),
    };
  }
}

/**
 * export Invoice class
 *
 * @type {Invoice}
 */
exports = module.exports = Invoice;
