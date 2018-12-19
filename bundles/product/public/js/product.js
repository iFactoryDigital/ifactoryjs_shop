
// require dependencies
const Events = require('events');

/**
 * build bootstrap class
 */
class ProductStore extends Events {
  /**
   * construct bootstrap class
   */
  constructor () {
    // set observable
    super(...arguments);

    // register pricing function
    this.__products = [];

    // build
    this.build   = this.build.bind(this);
    this.price   = this.price.bind(this);
    this.product = this.product.bind(this);

    // build cart store
    this.build();
  }

  /**
   * build cart
   */
  build () {

    // register simple product
    this.product('simple', {

    }, (product, opts) => {
      // let price
      let price = product.price.amount;

      // return price
      return price;
    }, (product, opts) => {

    });

    // register variable product
    this.product('variable', {

    }, (product, opts) => {
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

      // return price
      return price;
    }, (product, opts) => {

    });
  }

  /**
   * price product and line
   *
   * @param  {Object} product
   * @param  {Object} opts
   */
  price (product, opts) {
    // check found
    let found = this.__products.find((p) => p.type === product.type);

    // return 0 if not found
    if (!found) return 0;

    // let price
    let price = found.price(product, opts);

    // find register
    return price;
  }

  /**
   * register block
   *
   * @param  {String}   type
   * @param  {Object}   opts
   * @param  {Function} price
   * @param  {Function} order
   * @param  {Function} complete
   *
   * @return {*}
   */
  product (type, opts, price, add) {
    // check found
    let found = this.__products.find((product) => product.type === type);

    // push block
    if (!found) {
      // check found
      this.__products.push({
        'add'   : add,
        'type'  : type,
        'opts'  : opts,
        'price' : price,
      });
    } else {
      // set on found
      found.add   = add;
      found.type  = type;
      found.opts  = opts;
      found.price = price;
    }
  }
}

/**
 * export new bootstrap function
 *
 * @return {price}
 */
exports = module.exports = window.eden.product = new ProductStore();
