<checkout-page>
  <div class="container-checkout">
    <div class="row">
      <div class="col-md-5 order-md-1">
        <div class="card card-summary mb-3">
          <div class="card-header">
            { this.t('checkout.summary') }
          </div>
          <div class="card-body">
            <product-summary type="checkout" lines={ this.checkout.lines } actions={ this.checkout.actions } products={ this.checkout.products } />
          </div>
        </div>
      </div>
      <div class="col-md-7">
        <div class="card card-loading" if={ this.checkout.loading }>
          <div class="card-body text-center display-3 py-5">
            <fa i="spinner fa-spin" />
          </div>
        </div>
        <div data-is="checkout-guest" if={ !this.checkout.loading && !this.user.exists() } checkout={ this.checkout } />
        <virtual if={ !this.checkout.loading } each={ action, key in this.checkout.getActions() }>
          <div data-is="{ action.type }-checkout" action={ action } checkout={ this.checkout } />
        </virtual>

        <div class="my-3">
          By Checking out you agree to our <a href="/terms" target="_blank">Terms & Conditions</a> and <a href="/privacy" target="_blank">Privacy Policy</a> agreements
        </div>

        <a if={ !this.checkout.loading } href="#!" onclick={ onCheckout } class={ 'btn btn-lg btn-success mt-4' : true, 'disabled' : !this.hasCheckout() } disabled={ !hasCheckout() }>
          { this.t('checkout.complete') }
        </a>
      </div>
    </div>
  </div>

  <script>
    // do mixins
    this.mixin('user');
    this.mixin('i18n');
    this.mixin('checkout');

    /**
     * do checkout
     *
     * @param  {Event} e
     */
    onCheckout (e) {
      // prevent default
      e.preventDefault();

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

  </script>
</checkout-page>
