
// create mixin
riot.mixin ('price', {
  /**
   * on init function
   */
  'init' : function () {
    // set value
    this.price = {
      'price' : (product, opts) => {
        // let price
        let price = product.price;

        // get opts
        for (let i = 0; i < (product.variations || []).length; i++) {
          // get value
          let option = product.variations[i].options.find ((opt) => {
            // return found
            return opts.indexOf (opt.sku) > -1;
          });

          // add to base
          price += option ? parseFloat (option.price) : 0;
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

        // find register
        return price;
      }
    };

    // on mount update
    if (!this.eden.frontend) return;

    // set this store
    this.price = require('product/public/js/price');

    // on update
    this.price.on('update', this.update);
  }
});
