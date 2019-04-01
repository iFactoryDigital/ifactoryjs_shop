<product-summary>
  <div class="product-summary">
    <div each={ lines, key in groups() } class="summary-group summary-group-{ key.toLowerCase() }">
      <!-- do title -->
      <div data-is="product-{ key.toLowerCase() }-title" />

      <!-- loop lines -->
      <virtual each={ line, i in lines }>
        <div data-is="product-{ key.toLowerCase() }-summary" line={ line } />
      </virtual>
      <!-- / loop lines -->

    </div>
  </div>
  <div class="product-extra">
    <div each={ action, i in opts.actions } class="extra-group extra-group-{ action.type.toLowerCase() }">
      <!-- loop lines -->
      <div data-is="{ action.type.toLowerCase() }-summary-extra" action={ action } />
      <!-- / loop lines -->
    </div>
  </div>
  <div class="product-total mt-3" if={ this.calculatedTotal }>
    <div class="row">
      <div class="col-9 text-right">
        <p class="lead mb-0">
          Total
        </p>
      </div>
      <div class="col-3 text-right">
        <p class="lead mb-0">
          <money amount={ this.calculatedTotal } />
        </p>
      </div>
    </div>
  </div>

  <script>
    // add mixins
    this.mixin('product');

    // set variables
    this.calculatedTotal = 0;

    /**
     * get product total
     *
     * @return {Float}
     */
    async total() {
      // let total
      let total = 0;

      // sort into groups
      (opts.lines || []).forEach((line) => {
        // find product
        let product = (opts.products || []).find((check) => {
          // return check
          return check.id === line.product;
        });

        // add to total
        total += this.product.price(product, line.opts) * line.qty;
      });

      // set total
      opts.total = total;
      
      // hook total
      await eden.hook('checkout.total', opts);

      // return total
      return opts.total;
    }

    // group products by type
    groups() {
      // let groups
      let groups = {};

      // sort into groups
      (opts.lines || []).forEach((line) => {
        // find product
        let product = (opts.products || []).find((check) => {
          // return check
          return check.id === line.product;
        });

        // new line
        let newLine = {
          'qty'     : line.qty,
          'opts'    : line.opts,
          'type'    : product.type,
          'product' : product
        };

        // check group
        if (!groups[newLine.type]) groups[newLine.type] = [];

        // add line
        groups[newLine.type].push(newLine);
      });

      // return groups
      return groups;
    }

    /**
     * calculates total
     *
     * @return {Promise}
     */
    async calculate() {
      // check frontend
      if (!this.eden.frontend) return;

      // set total
      let total = await this.total();

      // update if total
      if (this.calculatedTotal !== total) {
        // update
        this.calculatedTotal = total;

        // update
        this.update();
      }
    }

    /**
     * on update function

     * @type {String} 'update'
     */
    this.on('update', this.calculate);

    /**
     * on update function

     * @type {String} 'update'
     */
    this.on('mount', this.calculate);

  </script>
</product-summary>
