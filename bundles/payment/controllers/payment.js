
// require dependencies
const Controller = require('controller');

// require helpers
const PaymentHelper = helper('payment');

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
    this._order = this._order.bind(this);
    this._payment = this._payment.bind(this);
    this._checkout = this._checkout.bind(this);

    // build
    this.build();
  }

  /**
   * builds cart controller
   */
  build() {
    // checkout hooks
    this.eden.pre('checkout.init', this._checkout);

    // order hooks
    this.eden.pre('order.init', this._order);
    this.eden.pre('order.payment', this._payment);
  }

  /**
   * checkout order
   *
   * @param  {Object} order
   */
  async _checkout(order) {
    // create payment action
    const action = {
      type     : 'payment',
      data     : {
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
   * @param {order} Order
   */
  async _order(order) {
    // check order
    const actions = order.get('actions');

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
   * @return {Promise}
   */
  async _payment(order, action) {
    // get order and action
    const check = {
      type : 'payment',
      data : {
        methods : [],
      },
    };

    // check error
    if (order.get('error')) return;

    // sanitise order
    const sanitisedOrder = {
      user  : await order.get('user'),
      lines : order.get('lines'),
    };

    // do hook
    await this.eden.hook('payment.init', order, check);

    // check method found
    if (!check.data.methods.find((method) => {
      // return type
      return method.type === action.value.type;
    })) {
      return order.set('error', {
        id   : 'payment.notavailable',
        text : 'Payment method not available',
      });
    }

    // hook payment
    const invoice = await PaymentHelper.invoice(order);

    // set to order
    order.set('invoice', invoice);

    // check invoice
    if (invoice.get('error')) return order.set('error', invoice.get('error'));

    // init invoice
    await this.eden.hook('order.invoice', order, invoice, () => {});

    // do payment
    const payment = await PaymentHelper.payment(invoice, action.value);

    // check payment
    if (payment.get('error')) return order.set('error', payment.get('error'));
    if (payment.get('redirect')) order.set('redirect', payment.get('redirect'));

    // return payment
    return order;
  }
}

/**
 * eport payment controller
 *
 * @type {paymentController}
 */
exports = module.exports = PaymentController;
