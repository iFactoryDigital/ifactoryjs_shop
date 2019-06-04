
// bind dependencies
const Daemon = require('daemon');

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
    // check state
    if (await invoice.hasPaid() && invoice.get('state') !== 'paid') {
      // set state approval
      invoice.set('state', 'paid');
    } else if (await invoice.hasApproval() && invoice.get('state') !== 'approval') {
      // set state approval
      invoice.set('state', 'approval');
    }
  }
}

/**
 * export order daemon
 *
 * @type {AllInvoiceDaemon}
 */
exports = module.exports = AllInvoiceDaemon;
