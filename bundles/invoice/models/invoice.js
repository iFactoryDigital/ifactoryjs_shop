
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
      'invoice.id' : this.get('_id') ? this.get('_id').toString() : 'null',
    }).ne('method.type', null).find() || []);

    // load payments
    const payments = invoicePayments.map((invoicePayment) => {
      // return sanitised images
      return invoicePayment.get('complete') ? invoicePayment.get('amount') : 0;
    });

    // return sanitised bot
    const sanitised = {
      id   : this.get('_id') ? this.get('_id').toString() : false,
      rate : this.get('rate'),
      paid : (payments.length ? payments : [0]).reduce((a, b) => {
        // return a + b
        return a + b;
      }),
      note   : this.get('note'),
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
exports = module.exports = Invoice;
