<checkout-page>
  <div class="container-checkout">
    <div class="row">
      <div class="col-md-5 order-md-1">
        <checkout-summary checkout={ this.checkout } />
      </div>
      <div class="col-md-7">
        <checkout-payment checkout={ this.checkout } />
      </div>
    </div>
  </div>

  <script>
    // mixin checkout
    this.mixin('checkout');

  </script>
</checkout-page>
