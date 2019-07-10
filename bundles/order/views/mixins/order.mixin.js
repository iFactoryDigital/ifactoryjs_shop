/* eslint-disable global-require */

// create mixin
riot.mixin('order', {
  /**
   * on init function
   */
  init() {
    // set value
    this.order = this.eden.get('state').order || {
      products   : [],
      quantities : {},
    };

    // set functions
    this.order.count = () => {
      // set quantities
      const quantities = (this.order.lines || []).map(line => line.qty);

      // push 0 for non empty Array
      quantities.push(0);

      // reduce for total
      return quantities.reduce((a, b) => {
        // return sum
        return (parseInt(a, 10) + parseInt(b, 10));
      });
    };
    this.order.total = () => {
      // loop for total
      let total = this.order.count() < 2 ? 2 : 0;

      // calculate total
      (this.order.lines || []).forEach((line) => {
        // add value
        total += ((this.order.products || []).find((product) => {
          // return found product
          return product.id === line.product;
        }) || {
          price : 0,
        }).price * line.qty;
      });

      // return total
      return total;
    };

    // on mount update
    if (!this.eden.frontend) return;

    // set this store
    const Order = require('order/public/js/order');

    // set order
    this.order = new Order(this.eden.get('state').order);

    // on update
    this.order.on('update', this.update);
  },
});
