
// require dependencies
const Controller = require('controller');

// require helpers
const paymentHelper = helper('payment');
const invoiceHelper = helper('invoice');

/**
 * create payment controller
 *
 * @mount /payment
 */
class PaymentController extends Controller {
  /**
   * constructor for user controller
   *
   * @param {eden} eden
   */
  constructor() {
    // run super
    super();

    // bind methods
    this.build = this.build.bind(this);

    // bind private methods
    this.orderHook = this.orderHook.bind(this);
    this.paymentHook = this.paymentHook.bind(this);
    this.checkoutHook = this.checkoutHook.bind(this);

    // build
    this.building = this.build();
  }


  // ////////////////////////////////////////////////////////////////////////////
  //
  // BUILD METHODS
  //
  // ////////////////////////////////////////////////////////////////////////////

  /**
   * builds cart controller
   */
  build() {

  }


  // ////////////////////////////////////////////////////////////////////////////
  //
  // HOOK METHODS
  //
  // ////////////////////////////////////////////////////////////////////////////

  /**
   * checkout order
   *
   * @pre   checkout.init
   * @param {Object} order
   */
  async checkoutHook(order) {
    // create payment action
    const action = {
      type : 'payment',
      data : {
        methods : [],
      },
      priority : 100,
    };

    // do hook
    await this.eden.hook('payment.init', order, action);

    // run actions
    action.data.methods = action.data.methods.sort((a, b) => {
      // set x/y
      const x = a.priority || 0;
      const y = b.priority || 0;

      // return action
      return a < y ? -1 : x > y ? 1 : 0;
    });

    // add action
    order.set('actions.payment', action);
  }

  /**
   * checkout order
   *
   * @pre   order.init
   * @param {order} Order
   */
  async orderHook(order) {
    // check order
    const actions = order.get('actions') || [];

    // get action
    const action = Object.values(actions).find((a) => {
      // return address
      return a.type === 'payment';
    });

    // check found
    if (!action || !action.value || !Object.keys(action.value)) {
      return order.set('error', {
        id   : 'payment.missing',
        text : 'Order is missing payment',
      });
    }
  }

  /**
   * do order payment hook
   *
   * @param  {Object}  data
   *
   * @pre    order.payment
   * @return {Promise}
   */
  async paymentHook(order, action) {
    // get order and action
    const check = {
      type : 'payment',
      data : {
        methods : [],
      },
    };

    // check error
    if (order.get('error')) return null;

    // do hook
    await this.eden.hook('payment.init', order, check);

    // check method found
    if (!check.data.methods.find((method) => {
      // return type
      return method.type === action.value.type;
    })) {
      return order.set('error', {
        id   : 'payment.nomethod',
        text : 'Payment method not available',
      });
    }

    // hook payment
    const invoice = await invoiceHelper.invoice(order);

    // set to order
    order.set('invoice', invoice);

    // check invoice
    if (invoice.get('error')) return order.set('error', invoice.get('error'));

    // init invoice
    await this.eden.hook('order.invoice', order, invoice, async () => {
      // save invoice
      await invoice.save();
    });

    // do payment
    const payment = await paymentHelper.payment(invoice, action.value);

    // init invoice
    await this.eden.hook('order.invoice.payment', order, invoice, payment, async () => {
      // save payment
      await payment.save();
    });

    // check payment
    if (payment.get('error')) return order.set('error', payment.get('error'));
    if (payment.get('redirect')) order.set('redirect', payment.get('redirect'));

    // unset
    order.unset('actions.payment.value.data');

    // return payment
    return order;
  }

  /**
   * opts
   *
   * @param  {Object}  opts
   *
   * @pre    payment.init
   * @return {Promise}
   */
  async manualHook(order, action) {
    // check action
    if (action.type !== 'payment') return;

    // return sanitised data
    action.data.methods.push({
      type     : 'manual',
      data     : {},
      show     : false,
      priority : 1,
    });
  }
}

/**
 * eport payment controller
 *
 * @type {paymentController}
 */
exports = module.exports = PaymentController;
