
// create mixin
riot.mixin ('cart', {
  /**
   * on init function
   */
  'init' : function () {
    // set value
    this.cart = this.eden.get('cart') || {
      'lines'    : [],
      'products' : []
    };

    // on mount update
    if (!this.eden.frontend) {
      // set functions
      this.cart.has = (product, opts) => {
        // returns product line
        return !!(this.cart.lines || []).find ((line) => {
          // return found
          return JSON.stringify(line.opts) === JSON.stringify(opts) && line.product === product.id;
        });
      };
      this.cart.line = (product, opts) => {
        // returns product line
        return (this.cart.lines || []).find((line) => {
          // return found
          return JSON.stringify(line.opts) === JSON.stringify(opts) && line.product === product.id;
        });
      };
      this.cart.product = (line) => {
        // returns product by line
        return (this.cart.products || []).find((product) => {
          // return found
          return product.id === line.product;
        });
      };
      this.cart.count = () => {
        // set quantities
        let quantities = (this.cart.lines || []).map((line) => line.qty);

        // push 0 for non empty Array
        quantities.push(0);

        // reduce for total
        return quantities.reduce((a, b) => {
          // return sum
          return (parseInt(a) + parseInt(b));
        });
      };
      this.cart.total = () => {
        // loop for total
        let total = this.cart.count() < 2 ? 2 : 0;

        // calculate total
        (this.cart.lines || []).forEach((line) => {
          // add value
          total += ((this.cart.products || []).find((product) => {
            // return found product
            return product.id === line.product
          }) || {
            'price' : 0
          }).price * line.qty;
        });

        // return total
        return total;
      };
    } else {
      // set this store
      this.cart = require('cart/public/js/cart');

      // on update
      this.cart.on('update', this.update);
    }
  }
});
