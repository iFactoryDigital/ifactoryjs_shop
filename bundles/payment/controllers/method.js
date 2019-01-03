
// Require local class dependencies
const Controller = require('controller');

/**
 * Create Payment Method Controller class
 *
 * @extends Controller
 */
class PaymentMethodController extends Controller {
  /**
   * Construct Stripe Controller class
   */
  constructor() {
    // Run super
    super();

    // Bind public methods
    this.build = this.build.bind(this);

    // Bind private methods
    this._pay = this._pay.bind(this);
    this._method = this._method.bind(this);

    // Build Payment Method
    this.build();
  }

  /**
   * Build Payment Method Controller
   */
  build() {
    // Hook payment init
    this.eden.pre('payment.init', this._method);

    // Hook payment pay
    this.eden.post('payment.pay', this._pay);
  }

  /**
   * Add Payment Method to list
   *
   * @param  {Object} order
   * @param  {Object} action
   *
   * @return {boolean}
   *
   * @private
   */
  _method(order, action) {
    // Return action check
    return action.type === 'payment';
  }

  /**
   * Pay using Payment Method
   *
   * @param  {Payment} payment
   *
   * @return {boolean}
   *
   * @private
   */
  _pay(payment) {
    // Return error check
    return !payment.get('error');
  }
}

/**
 * Export Payment Method Controller class
 *
 * @type {PaymentMethodController}
 */
exports = module.exports = PaymentMethodController;
