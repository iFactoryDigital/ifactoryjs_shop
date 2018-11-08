
// require dependencies
const uuid   = require('uuid');
const Events = require('events');

// require local dependencies
const store  = require('default/public/js/store');
const price  = require('product/public/js/price');
const socket = require('socket/public/js/bootstrap');

/**
 * build bootstrap class
 */
class CartStore extends Events {
  /**
   * construct bootstrap class
   */
  constructor () {
    // set observable
    super ();

    // bind variables
    this.lines     = [];
    this.products  = [];
    this.persisted = [];

    // bind methods
    this.has      = this.has.bind(this);
    this.line     = this.line.bind(this);
    this.build    = this.build.bind(this);
    this.count    = this.count.bind(this);
    this.total    = this.total.bind(this);
    this.update   = this.update.bind(this);
    this.product  = this.product.bind(this);
    this.persist  = this.persist.bind(this);
    this.quantity = this.quantity.bind(this);

    // bind private methods
    this._cart = this._cart.bind(this);

    // build cart store
    this.build();
  }

  /**
   * build cart
   */
  build () {
    // bind variables
    this._cart(store.get('cart'), true);

    // listen to room
    socket.on('cart', this._cart);
  }

  /**
   * returns true if cart has product
   *
   * @param  {Object}  product
   *
   * @return {Boolean}
   */
  has (product, opts) {
    // check product
    if (!product) return false;

    // check if product in cart
    return !!this.lines.find((line) => {
      // return found
      return JSON.stringify(opts) === JSON.stringify(line.opts) && line.product === product.id;
    });
  }

  /**
   * add product
   *
   * @param {Object} product
   */
  add (product, opts) {
    // check products
    if (!this.has(product)) this.products.push(product);

    // check quantities
    if (!this.lines.find((line) => {
      // return found
      return JSON.stringify(opts) === JSON.stringify(line.opts) && line.product === product.id;
    })) this.lines.push({
      'qty'     : 0,
      'opts'    : opts,
      'product' : product.id
    });

    // find line
    let Line = this.lines.find((line) => {
      // return found
      return JSON.stringify(opts) === JSON.stringify(line.opts) && line.product === product.id;
    });

    // add to quantity
    Line.qty++;

    // emit line
    this.emit('add', Line);

    // persist
    this.persist();

    // update
    this.update();
  }

  /**
   * removes quantity from cart
   *
   * @param  {Object}  product
   * @param  {Integer} quantity
   */
  remove (line, quantity) {
    // check quantity
    if (!quantity) quantity = 1;

    // check line exists
    if (!this.lines.find((check) => {
      // return found
      return JSON.stringify(line.opts) === JSON.stringify(check.opts) && line.product === check.product;
    })) this.lines.push({
      'qty'     : 0,
      'product' : line.product
    });

    // check quantities
    let Line = this.lines.find((check) => {
      // return found
      return JSON.stringify(line.opts) === JSON.stringify(check.opts) && line.product === check.product;
    });

    // check quantity
    Line.qty -= quantity;

    // emit line
    this.emit('remove', Line);

    // filter line
    this.lines = this.lines.filter((check) => {
      // return found
      return check.qty > 0;
    });

    // check if lines
    if (!this.lines) this.lines = [];
    if (!Array.isArray (this.lines)) this.lines = [this.lines];

    // persist
    this.persist();

    // update view
    this.update();
  }

  /**
   * return line
   *
   * @param  {Object} product
   *
   * @return {Object}
   */
  line (product, opts) {
    // returns product line
    return this.lines.find((line) => {
      // return found
      return JSON.stringify(opts) === JSON.stringify(line.opts) && line.product === product.id;
    });
  }

  /**
   * return product
   *
   * @param  {Object} line
   *
   * @return {Object}
   */
  product (line) {
    // returns product by line
    return this.products.find((product) => {
      // return found
      return product.id === line.product;
    });
  }

  /**
   * updates cart quantity for product
   *
   * @param  {Object}  product
   * @param  {Integer} quantity
   */
  quantity (line, quantity) {
    // check quantity
    if (!quantity) quantity = 1;

    // check line exists
    if (!this.lines.find((check) => {
      // return found
      return JSON.stringify(line.opts) === JSON.stringify(check.opts) && line.product === check.product;
    })) this.lines.push({
      'qty'     : 0,
      'opts'    : line.opts,
      'product' : line.product
    });

    // check quantity
    Line.qty = quantity;

    // filter line
    this.lines.filter((line) => {
      // return found
      return Line.qty > 0;
    });

    // check if lines
    if (!this.lines) this.lines = [];
    if (!Array.isArray(this.lines)) this.lines = [this.lines];

    // persist
    this.persist();

    // update view
    this.update();
  }

  /**
   * returns total
   *
   * @return {Integer}
   */
  total () {
    // loop for total
    let total = this.count() < 2 ? 2 : 0;

    // calculate total
    this.lines.forEach((line) => {
      // add value
      total += price.price(this.product(line), line.opts) * line.qty;
    });

    // return total
    return total;
  }

  /**
   * returns item count in cart
   */
  count () {
    // set quantities
    let quantities = this.lines.map((line) => line.qty);

    // push 0 for non empty Array
    quantities.push(0);

    // reduce for total
    return quantities.reduce((a, b) => {
      // return sum
      return (parseInt(a) + parseInt(b));
    });
  }

  /**
   * creates order
   *
   * @param  {Array}  lines
   * @param  {Object} payment
   * @param  {Object} address
   */
  async order (lines, payment, address) {
    // socket call
    let order = await socket.call('order.create', lines, payment, address);

    // check error
    if (order.error) return;

    // redirect
    if (order.invoice.redirect) {
      // set redirecting
      this.redirecting = true;

      // update view
      this.update();

      // return redirect
      return window.location = order.invoice.redirect;
    }

    // redirect
    if (order.id) {
      // go to order page
      return window.eden.router.go('/order/' + order.id);
    }
  }

  /**
   * update cart function
   */
  update () {
    // trigger update
    this.emit('update');
  }

  /**
   * persists to backend
   */
  async persist () {
    // create persist id
    let id = uuid();

    // log data
    let res = await fetch('/cart/update', {
      'body' : JSON.stringify({
        'id'    : id,
        'lines' : this.lines
      }),
      'method'  : 'post',
      'headers' : {
        'Content-Type': 'application/json'
      },
      'credentials' : 'same-origin'
    });

    // load json
    let data = await res.json();

    // return data
    return data;
  }

  /**
   * on cart change
   *
   * @param  {Object}  cart
   * @param  {Boolean} prevent
   */
  _cart (cart, prevent) {
    // check Object
    cart = cart || {};

    // check id
    if (cart.id && this.persisted.includes(cart.id)) return;

    // loop for keys
    for (let key in cart) {
      // check key
      if (!['lines', 'products'].includes(key)) continue;

      // set key
      this[key] = cart[key];
    }

    // set cart
    this.cart = cart;

    // do update
    if (!prevent) this.update();
  }
}

/**
 * export new bootstrap function
 *
 * @return {media}
 */
exports = module.exports = new CartStore();
