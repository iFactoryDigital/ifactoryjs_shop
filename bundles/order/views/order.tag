<order-page>
  <!-- product title -->
  <page-title description="View Order" />
  <!-- / product title -->

  <div class="container-checkout mt-5">
    <div class="row">
      <div class="col-md-7">
        <div class="card card-order mb-3">
          <div class="card-header">
            { this.t('order.title') }
          </div>
          <div class="card-body">
            <div class="row mb-2">
              <div class="col-3">
                <b>{ this.t('order.number') }</b>
              </div>
              <div class="col-9">
                { opts.order.id }
              </div>
            </div>
            <div class="row mb-2">
              <div class="col-3">
                <b>{ this.t('order.status') }</b>
              </div>
              <div class="col-9">
                { opts.order.status || 'Pending' }
              </div>
            </div>
          </div>
        </div>
        <virtual each={ action, i in this.order.actions }>
          <div data-is="{ action.type }-order" order={ this.order } action={ action } />
        </virtual>
      </div>
      <div class="col-md-5">
        <div class="card card-summary">
          <div class="card-header">
            { this.t('checkout.summary') }
          </div>
          <div class="card-body">
            <product-summary type="order" lines={ this.order.lines } actions={ this.order.actions } products={ this.order.products } />
          </div>
        </div>
      </div>
    </div>
  </div>

  <script>
    // do mixins
    this.mixin('i18n');
    this.mixin('order');

  </script>
</order-page>
