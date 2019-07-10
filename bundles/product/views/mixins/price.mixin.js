/* eslint-disable global-require */

// create mixin
riot.mixin('product', {
  /**
   * on init function
   */
  init() {
    // set value
    this.product = {
      price : (product) => {
        // let price
        return product.price.amount;
      },
    };

    // on mount update
    if (!this.eden.frontend) return;

    // set this store
    this.product = require('product/public/js/product');

    // on update
    this.product.on('update', this.update);
  },
});
