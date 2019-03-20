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

  <div class="my-3" hide={ this.checkout.loading }>
    By Checking out you agree to our <a href="/terms" target="_blank">Terms & Conditions</a> and <a href="/privacy" target="_blank">Privacy Policy</a> agreements
  </div>

  <a hide={ this.checkout.loading } href="#!" onclick={ onCheckout } class={ 'btn btn-lg btn-success mt-4' : true, 'disabled' : !this.hasCheckout() } disabled={ !hasCheckout() }>
    { this.t('checkout.complete') }
  </a>

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
     * has checkout
     *
     * @return {Boolean}
     */
    hasCheckout () {
      // check actions
      if (!this.checkout.actions || !Object.values(this.checkout.actions).length) return false;

      // find action without value
      return !Object.values(this.checkout.actions).find((action) => {
        // return action value
        return !action.value;
      });
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
