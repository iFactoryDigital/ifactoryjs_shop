
// create mixin
riot.mixin('checkout', {
  /**
   * on init function
   */
  init() {
    // set value
    this.checkout = (this.opts.order || this.opts.data.order) || {
      loading : true,
    };

    // set actions
    this.checkout.getActions = () => {
      // get actions
      let actions = Object.values(this.checkout.actions);

      // run actions
      actions = actions.sort((a, b) => {
        // set x/y
        const x = a.priority || 0;
        const y = b.priority || 0;

        // return action
        return x < y ? -1 : x > y ? 1 : 0;
      });

      // return actions
      return actions;
    };

    // on mount update
    if (!this.eden.frontend) return;

    // set order
    this.checkout = require('checkout/public/js/checkout');

    // set checkout
    this.checkout.build(this.opts.order || this.opts.data.order);

    // on update
    this.checkout.on('update', this.update);

    // remove update on
    this.on('unmount', () => {
      // remove listener
      this.checkout.removeListener('update', this.update);
    });
  },
});
