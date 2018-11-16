<checkout-summary>
  <div class="card card-summary mb-3">
    <div class="card-header">
      { this.t('checkout.summary') }
    </div>
    <div class="card-body">
      <product-summary type="checkout" lines={ this.checkout.lines } actions={ this.checkout.actions } products={ this.checkout.products } />
    </div>
  </div>

  <script>
    // do mixins
    this.mixin('user');
    this.mixin('i18n');
    
    // set checkout
    this.checkout = opts.checkout;
    
    /**
     * on mount
     */
    this.on('mount', () => {
      // set checkout
      this.checkout = opts.checkout;
      
    });

  </script>
</checkout-summary>
