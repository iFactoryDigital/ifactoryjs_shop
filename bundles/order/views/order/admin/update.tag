<order-admin-update-page>
  <div class="page page-shop">

    <admin-header title="{ opts.order.id ? 'Update' : 'Create' } Order">
      <yield to="right">
        <a href="/admin/order" class="btn btn-lg btn-primary">
          Back
        </a>
      </yield>
    </admin-header>
    
    <div class="container-fluid">
      <form method="post" action="/admin/order/{ opts.order.id ? opts.order.id + '/update' : 'create' }">
        <div class="row">
          <div class="col-md-7">
            <div class="card card-order mb-3">
              <div class="card-header">
                { this.t ('order.title') }
              </div>
              <div class="card-body">
                <div class="row mb-2">
                  <div class="col-3">
                    <b>{ this.t ('order.number') }</b>
                  </div>
                  <div class="col-9">
                    { opts.order.id }
                  </div>
                </div>
                <div class="row mb-2">
                  <div class="col-3">
                    <b>{ this.t ('order.status') }</b>
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
            <button type="submit" class="btn btn-lg btn-success mt-3">
              { opts.order.id ? 'Update' : 'Create' } order
            </button>
          </div>
          <div class="col-md-5">
            <div class="card card-summary">
              <div class="card-header">
                { this.t ('checkout.summary') }
              </div>
              <div class="card-body">
                <product-summary type="order" lines={ this.order.lines } actions={ this.order.actions } products={ this.order.products } />
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  </div>

  <script>
    // do mixins
    this.mixin ('i18n');
    this.mixin ('order');

  </script>
</order-admin-update-page>
