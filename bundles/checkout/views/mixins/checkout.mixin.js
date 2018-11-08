
// create mixin
riot.mixin ('checkout', {
  /**
   * on init function
   */
  'init' : function () {
    // set value
    this.checkout = this.opts.order || {
      'loading' : true
    };

    // set actions
    this.checkout.getActions = () => {
      // get actions
      let actions = Object.values(this.checkout.actions);

      // run actions
      actions = actions.sort((a, b) => {
        // set x/y
        let x = a.priority || 0;
        let y = b.priority || 0;

        // return action
        return x < y ? -1 : x > y ? 1 : 0;
      });

      // return actions
      return actions;
    };

    // on mount update
    if (!this.eden.frontend) return;

    // set this store
    let Checkout = require('checkout/public/js/checkout');

    // set checkout
    this.checkout = new Checkout(this.opts.order);

    // on update
    this.checkout.on('update', this.update);

    // remove update on
    this.on('unmount', () => {
      // remove listener
      this.checkout.removeListener('update', this.update);
    });
  }
});
