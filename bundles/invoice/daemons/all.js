
// bind dependencies
const Daemon = require('daemon');
const moment = require('moment');

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
    //State Update
    // check state
    if (await invoice.hasPaid() && invoice.get('state') !== 'paid') {
      // set state approval
      invoice.set('state', 'paid');
    } else if (await invoice.hasApproval() && invoice.get('state') !== 'approval') {
      // set state approval
      invoice.set('state', 'approval');
    }
    //Invoice Update
    if (!invoice.get('invoiceno')) {
      const prefix = await invoice.get('customer');
      const invoiceno = 'Inv'+ (prefix ? prefix.get('uid') : [...Array(5)].map(i=>(~~(Math.random()*36)).toString(36)).join('')) + moment().format("MD")+[...Array(2)].map(i=>(~~(Math.random()*36)).toString(36)).join('');
      invoice.set('invoiceno', invoiceno);
    }

    //Status Update by current docket
    const docket = await ((await invoice.get('orders')).filter(async (order, i) => i === 0))[0].get('docket');
    docket && docket.get('status') ? docket.get('status') === 'complete' ? invoice.set('status', 'complete') : docket.get('status') === 'en-route' ? invoice.set('status', 'delivery') : invoice.set('status', 'draft') : invoice.set('status', 'draft');
  }
}

/**
 * export order daemon
 *
 * @type {AllInvoiceDaemon}
 */
module.exports = AllInvoiceDaemon;
