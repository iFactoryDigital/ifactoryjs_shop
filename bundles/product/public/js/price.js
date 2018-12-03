
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
    let price = product.price;

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

    // set type
    if (product.type === 'server') {
      // set discount
      let discount = {
        '1'  : 0,
        '2'  : 2.5,
        '3'  : 5,
        '6'  : 10,
        '12' : 20
      };
      let period = opts.period || 1;

      // check opts
      if (opts.new) {
        // get next
        let next = parseFloat((((product.pricing || {}).options || []).find((opt) => parseInt(opts.new.slots) === parseInt(opt.slots)) || ((product.pricing || {}).options || [])[0]).price);
        let prev = parseFloat((((product.pricing || {}).options || []).find((opt) => parseInt(opts.old.slots) === parseInt(opt.slots)) || ((product.pricing || {}).options || [])[0]).price);

        // get next
        price = next - prev;
      } else {
        // set price
        price = parseFloat((((product.pricing || {}).options || []).find((opt) => parseInt(opts.slots) === parseInt(opt.slots)) || ((product.pricing || {}).options || [])[0]).price);

        // set period
        price = price * period;

        // set discount
        price = parseFloat((price - (price * (discount[period] / 100))).toFixed(2));
      }
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
        'price' : 999999
      });

      // check value
      if ((opts || {}).option) {
        // set option
        value = opts.option;
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
