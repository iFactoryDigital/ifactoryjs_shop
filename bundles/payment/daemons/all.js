
// bind dependencies
const Daemon = require('daemon');
const moment = require('moment');

/**
 * build cart controller
 */
class AllPaymentDaemon extends Daemon {
  /**
   * construct user cart controller
   */
  constructor() {
    // run super
    super();

    // bind build method
    this.build = this.build.bind(this);

    // bind methods
    this.paymentUpdateHook = this.paymentUpdateHook.bind(this);

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
   * @param  {order} Order
   *
   * @pre payment.update
   * @pre payment.create
   */
  async paymentUpdateHook(payment) {
    // check state
    if (payment.get('complete') && payment.get('state') !== 'paid') {
      // set state paid
      payment.set('state', 'paid');
      payment.set('complete', new Date());
    }
    //paymentno update
    if (!payment.get('paymentno')) {
      const prefix = await payment.get('customer');
      const paymentno = 'Pay'+ (prefix ? prefix.get('uid') : [...Array(5)].map(i=>(~~(Math.random()*36)).toString(36)).join('')) + moment().format("MD")+[...Array(2)].map(i=>(~~(Math.random()*36)).toString(36)).join('');
      payment.set('paymentno', paymentno);
    }
  }
}

/**
 * export order daemon
 *
 * @type {AllPaymentDaemon}
 */
module.exports = AllPaymentDaemon;
