<checkout-payment>
  <div class="card card-loading" show={ this.checkout.loading }>
    <div class="card-body text-center display-3 py-5">
      <i class="fa fa-spinner fa-spin" />
    </div>
  </div>
  <div data-is="checkout-guest" show={ !this.checkout.loading && !this.user.exists() } checkout={ this.checkout } />
  <virtual each={ action, key in this.checkout.getActions() }>
    <div hide={ this.checkout.loading } data-is="{ action.type }-checkout" if={ action.show !== false } action={ action } checkout={ this.checkout } />
  </virtual>

  <script>
    // do mixins
    this.mixin('user');
    this.mixin('i18n');

    // set checkout
    this.checkout = opts.checkout;

    /**
     * do checkout
     *
     * @param  {Event} e
     */
    onCheckout (e) {
      // prevent default
      e.preventDefault();
      
      // return if loading
      if (this.checkout.loading) return;

      // call checkout
      this.checkout.submit();
    }

    /**
     * on mount
     */
    this.on('mount', () => {
      // set checkout
      this.checkout = opts.checkout;

    });

  </script>
</checkout-payment>
