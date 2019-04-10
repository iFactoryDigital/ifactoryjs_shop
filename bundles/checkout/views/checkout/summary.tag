<checkout-summary>
  <div class="card card-summary mb-3">
    <div class="card-body">
      <product-summary type="checkout" lines={ this.checkout.lines } actions={ this.checkout.actions } products={ this.checkout.products } checkout={ this.checkout } />
      
      <hr />
      
      <div class="product-subtotal">
        <p class="mb-2">
          Subtotal
          <i class="fa fa-spinner fa-spin float-right" if={ !this.calculated.subtotal || this.loading('total') } />
          <money class="float-right" amount={ this.calculated.subtotal } if={ this.calculated.subtotal && !this.loading('total') } />
        </p>
      </div>
      
      <div class="product-subtotal">
        <div each={ action, i in this.checkout.actions } class="subtotal-group subtotal-group-{ action.type.toLowerCase() }">
          <!-- loop lines -->
          <div data-is="{ action.type.toLowerCase() }-summary-subtotal" action={ action } />
          <!-- / loop lines -->
        </div>
      </div>
      
      <hr />
      
      <div class="product-total mt-3">
        <b class="d-block">
          Total
          <i class="fa fa-spinner fa-spin float-right" if={ !this.calculated.total || this.loading('total') } />
          <money class="float-right" amount={ this.calculated.total } if={ this.calculated.total && !this.loading('total') } />
        </b>
      </div>
    </div>
  </div>
  
  <div each={ action, i in this.checkout.actions } type="checkout" action={ action } data-is="{ action.type }-summary-extra" lines={ this.checkout.lines } actions={ this.checkout.actions } products={ this.checkout.products } checkout={ this.checkout } />

  <script>
    // do mixins
    this.mixin('user');
    this.mixin('i18n');
    this.mixin('loading');
    
    // set checkout
    this.checkout = opts.checkout;

    // set variables
    this.calculated = {
      total    : 0,
      subtotal : 0,
    };

    /**
     * calculates total
     *
     * @return {Promise}
     */
    async calculate() {
      // check frontend
      if (!this.eden.frontend || this.loading('total')) return;
      
      // return if the same
      if (await this.checkout.total(true) === this.calculated.total) return;

      // set total
      this.loading('total', true);
      
      // set calculated
      this.calculated = {
        total    : await this.checkout.total(true),
        subtotal : await this.checkout.total(),
      };
      
      // set loading
      this.loading('total', false);
    }

    /**
     * has checkout
     *
     * @return {Boolean}
     */
    canCheckout () {
      // check actions
      if (!this.checkout.actions || !Object.values(this.checkout.actions).length) return false;

      // find action without value
      return !Object.values(this.checkout.actions).find((action) => {
        // return action value
        return !action.value;
      });
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
    this.on('mount', () => {
      // set checkout
      this.checkout = opts.checkout;
      
      // calculate
      this.calculate();
        
      if (this.eden.frontend) window.checkout = this.checkout;
      
    });

  </script>
</checkout-summary>
