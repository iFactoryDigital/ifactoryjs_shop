<order-admin-update-page>
  <div class="page page-shop">
    <admin-header title="{ this.order.id ? 'Update' : 'Create' } Order" invoice={ this.invoice } order={ this.order }>
      <yield to="right">
        <a class={ 'btn btn-lg btn-info mr-2' : true, 'disabled' : !opts.invoice } href="/admin/shop/invoice/{ (opts.invoice || {}).id }/update" disabled={ !opts.invoice }>
          View Invoice
        </a>
        <a class={ 'btn btn-lg btn-info mr-2' : true, 'disabled' : !opts.order } href="/admin/shop/order/{ (opts.order || {}).id }/view" disabled={ !opts.order }>
          View Order
        </a>
        <a href="/admin/shop/order" class="btn btn-lg btn-primary">
        Back
        </a>
      </yield>
    </admin-header>

    <div class="container">

      <order-update order={ order } invoice={ invoice } />

    </div>

  <script>
    // do mixin
    this.mixin('i18n');

    // set initial discount
    this.order   = opts.order;
    this.invoice = this.order.invoice;

    /**
     * on save
     *
     * @param  {Event} e
     */
    async onEmail(e) {
      // prevent default
      e.preventDefault();
      e.stopPropagation();

      // show modal
      jQuery(this.refs.email).modal('show');
    }
  </script>
</order-admin-update-page>
