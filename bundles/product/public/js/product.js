
// require dependencies
const Events = require('events');

// set built
let built = null;

/**
 * build bootstrap class
 */
class ProductStore extends Events {
  /**
   * construct bootstrap class
   */
  constructor(...args) {
    // set observable
    super(...args);

    // register pricing function
    this.__products = [];

    // build
    this.build = this.build.bind(this);
    this.price = this.price.bind(this);
    this.product = this.product.bind(this);

    // build cart store
    this.building = this.build();
  }


  // ////////////////////////////////////////////////////////////////////////////
  //
  // BUILD METHODS
  //
  // ////////////////////////////////////////////////////////////////////////////

  /**
   * build cart
   */
  build() {
    // register simple product
    this.product('simple', {

    }, (product) => {
      // let price
      const price = product.price.amount;

      // return price
      return price;
    }, () => {

    });

    // register variable product
    this.product('variable', {

    }, (product, opts) => {
      // let price
      let price = product.price.base;

      // get opts
      for (let i = 0; i < (product.variations || []).length; i += 1) {
        // get value
        const option = product.variations[i].options.find((opt) => {
          // return found
          return opts.includes(opt.sku);
        });

        // add to base
        price += option ? parseFloat(option.price) : 0;
      }

      // return price
      return price;
    }, () => {

    });
  }


  // ////////////////////////////////////////////////////////////////////////////
  //
  // NORMAL METHODS
  //
  // ////////////////////////////////////////////////////////////////////////////

  /**
   * price product and line
   *
   * @param  {Object} product
   * @param  {Object} opts
   */
  price(product, opts) {
    // check found
    const found = this.__products.find(p => p.type === product.type);

    // return 0 if not found
    if (!found) return 0;

    // let price
    const price = found.price(product, opts);

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
  product(type, opts, price, add) {
    // check found
    const found = this.__products.find(product => product.type === type);

    // push block
    if (!found) {
      // check found
      this.__products.push({
        add,
        type,
        opts,
        price,
      });
    } else {
      // set on found
      found.add = add;
      found.type = type;
      found.opts = opts;
      found.price = price;
    }
  }
}

// set built
built = new ProductStore();

/**
 * export new bootstrap function
 *
 * @return {price}
 */
window.eden.product = built;
module.exports = built;
