
// bind dependencies
const Daemon = require('daemon');
const moment = require('moment');

// require model
const Payment = model('payment');
const Invoice = model('invoice');

/**
 * build cart controller
 */
class AllInvoiceDaemon extends Daemon {
  /**
   * construct user cart controller
   */
  constructor() {
    // run super
    super();

    // bind build method
    this.build = this.build.bind(this);

    // bind methods
    this.invoiceUpdateHook = this.invoiceUpdateHook.bind(this);

    // build order controller
    this.build();
  }


  // ////////////////////////////////////////////////////////////////////////////
  //
  // BUILD METHODS
  //
  // ////////////////////////////////////////////////////////////////////////////

  /**
   * builds order controller
   */
  build() {

  }


  // ////////////////////////////////////////////////////////////////////////////
  //
  // HOOK METHODS
  //
  // ////////////////////////////////////////////////////////////////////////////

  /**
   * pre order update
   *
   * @param  {invoice} Invoice
   *
   * @pre invoice.update
   * @pre invoice.create
   */
  async invoiceUpdateHook(invoice) {
    //Invoice Update
    if (!invoice.get('invoiceno')) {
      const prefix = await invoice.get('customer');
      const invoiceno = 'Inv'+ (prefix ? prefix.get('uid') : [...Array(5)].map(i=>(~~(Math.random()*36)).toString(36)).join('')) + moment().format("MD")+[...Array(2)].map(i=>(~~(Math.random()*36)).toString(36)).join('');
      invoice.set('invoiceno', invoiceno);
    }

    //State Update
    if (await invoice.hasPaid() && invoice.get('state') !== 'paid') {
      // set state approval
      invoice.set('state', 'paid');
    } else if (await invoice.hasApproval() && invoice.get('state') !== 'approval') {
      // set state approval
      invoice.set('state', 'approval');
    }

    //Status Update by current docket
    /*
    const docket = await ((await invoice.get('orders')).filter(async (order, i) => i === 0))[0].get('docket');
    docket && docket.get('status') ? docket.get('status') === 'complete' ? invoice.set('status', 'complete') : docket.get('status') === 'en-route' ? invoice.set('status', 'delivery') : invoice.set('status', 'draft') : invoice.set('status', 'draft');
    */
  }

  /**
   * pre invoice update
   *
   * @param  {payment} Payment
   *
   * @pre payment.update
   * @pre payment.create
   */
  async invoiceUpdatebyPaymentHook(payment) {
    console.log('invoiceUpdatebyPaymentHook');
    const invoice = payment.get('invoice') ? await payment.get('invoice') : '';
    if (!invoice) return ;
    const invoiceamount = invoice.get('total');
    let amount = 0;
    let state  = [];

    if (payment.get('state') && payment.get('state') !== 'cancel' && payment.get('state') !== 'refund') {
      parseFloat(payment.get('amount')) > 0 ? state.push(payment.get('state')) : '';
      if (payment.get('state') === 'paid') {
        amount += parseFloat(payment.get('amount'));
      }
    }

    const payments = await Payment.where({ 'invoice.id' : invoice.get('_id') }).find();

    if (payments.length > 0) payments.map(p => {
      if ((!payment.get('_id') || p.get('_id') !== payment.get('_id')) && p.get('state') !== 'cancel' && p.get('state') !== 'refund') {
        parseFloat(p.get('amount')) > 0 ? state.push(p.get('state')) : '';
        if (p.get('state') === 'paid') {
          amount += parseFloat(p.get('amount'));
        }
      }
    });

    invoice.set('state', (amount === invoiceamount && invoiceamount > 0) ? 'paid' : state.length > 0 ? 'approval' : 'unpaid');
    invoice.set('remain', (amount === invoiceamount && invoiceamount > 0) ? 0 : (invoiceamount-amount));

    await invoice.save();
  }
}

/**
 * export order daemon
 *
 * @type {AllInvoiceDaemon}
 */
module.exports = AllInvoiceDaemon;
