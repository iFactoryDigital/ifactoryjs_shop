<payment-order-update>
  <div class="card card-shipping card-checkout mb-3">
    <div class="card-header">
      { this.t ('payment.order.title') }
    </div>
    <!-- payment choices -->
    <div class="list-group list-group-flush">
      <virtual each={ payment, i in opts.order.invoice.payments }>
        <li class={ 'list-group-item list-group-item-method list-group-item-active' : true } data-is="{ payment.method.type }-payment" order={ order () } payment={ payment } method={ payment.method } />
      </virtual>
    </div>
  </div>

  <script>
    // do mixins
    this.mixin ('i18n');
    this.mixin ('user');

    order () {
      // return opts
      return opts.order;
    }

    action () {
      // return action
      return opts.action;
    }

  </script>
</payment-order-update>
