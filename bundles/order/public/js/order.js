
// require dependencies
const Events = require('events');

// require local dependencies
const store  = require('default/public/js/store');
const socket = require('socket/public/js/bootstrap');

/**
 * build bootstrap class
 */
class OrderStore extends Events {
  /**
   * construct bootstrap class
   */
  constructor (order) {
    // set observable
    super();

    // bind variables
    this.lines    = [];
    this.products = [];

    // bind methods
    this.build  = this.build.bind(this);
    this.total  = this.total.bind(this);
    this.update = this.update.bind(this);

    // bind private methods
    this._order = this._order.bind(this);

    // build cart store
    this.build(order);
  }

  /**
   * build cart
   */
  build (order) {
    // bind variables
    this._order(order, true);

    // emit immediately
    socket.emit('order', this.id);

    // on connect
    socket.on('connect', () => {
      // emit order
      socket.emit('order', this.id);
    });

    // listen to room
    socket.on('order.' + this.id, this._order);
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
      total += (this.products.find((product) => {
        // return found product
        return product.id === line.product
      }) || {
        'price' : 0
      }).price * line.qty;
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
   * update cart function
   */
  update () {
    // trigger update
    this.emit('update');
  }

  /**
   * on cart change
   *
   * @param  {Object}  order
   * @param  {Boolean} prevent
   */
  _order (order, prevent) {
    // check Object
    order = order || {};

    // loop for keys
    for (let key in order) {
      // set key
      this[key] = order[key];
    }

    // set cart
    this.order = order;

    // do update
    if (!prevent) this.update();
  }
}

/**
 * export new bootstrap function
 *
 * @return {OrderStore}
 */
exports = module.exports = OrderStore;
