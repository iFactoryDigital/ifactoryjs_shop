
/**
 * Created by Awesome on 2/6/2016.
 */

// use strict


// import local dependencies
const Model = require('model');

/**
 * create payment class
 */
class Payment extends Model {
  /**
   * construct item model
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
    // return sanitised bot
    const sanitised = {
      id       : this.get('_id') ? this.get('_id').toString() : null,
      data     : this.get('data'),
      method   : this.get('method'),
      amount   : this.get('amount'),
      details  : this.get('details'),
      complete : this.get('complete'),
    };

    // hook
    await this.eden.hook('payment.sanitise', {
      sanitised,

      payment : this,
    });

    // return sanitised
    return sanitised;
  }
}

/**
 * export Payment class
 *
 * @type {Payment}
 */
exports = module.exports = Payment;
