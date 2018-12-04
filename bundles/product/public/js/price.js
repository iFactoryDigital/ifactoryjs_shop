
// require dependencies
const Events = require('events');

/**
 * build bootstrap class
 */
class PriceStore extends Events {
  /**
   * construct bootstrap class
   */
  constructor () {
    // set observable
    super(...arguments);

    // register pricing function
    this._register = {};

    // build
    this.build    = this.build.bind(this);
    this.price    = this.price.bind(this);
    this.register = this.register.bind(this);

    // build cart store
    this.build();
  }

  /**
   * build cart
   */
  build () {

  }

  /**
   * price product and line
   *
   * @param  {Object} product
   * @param  {Object} opts
   */
  price (product, opts) {
    // let price
    let price = product.price.amount;

    // get opts
    for (let i = 0; i < (product.variations || []).length; i++) {
      // get value
      let option = product.variations[i].options.find((opt) => {
        // return found
        return opts.includes(opt.sku);
      });

      // add to base
      price += option ? parseFloat(option.price) : 0;
    }

    // get subscription
    if (product.type === 'subscription') {
      // get pricing options
      let options = Array.from(product.pricing);

      // get smallest value by default
      let value = options.reduce((smallest, option) => {
        // return option if smaller
        if (option.price < smallest.price) return option;

        // return smallest
        return smallest;
      }, {
        'price' : Infinity
      });

      // check value
      if ((opts || {}).period) {
        // set option
        value = options.find((opt) => opt.period === opts.period);
      }

      // return value
      return value.price;
    }

    // find register
    return price;
  }

  /**
   * register pricing function
   *
   * @param  {String}   type
   * @param  {Function} fn
   */
  register (type, fn) {
    // check type
    this._register[type] = fn;
  }
}

/**
 * export new bootstrap function
 *
 * @return {price}
 */
exports = module.exports = new PriceStore();
