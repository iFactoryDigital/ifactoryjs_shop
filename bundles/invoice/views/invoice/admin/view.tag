<invoice-admin-view-page>

  <div class="page page-shop">
    <admin-header title="View Invoice" if={ !this.mnt.layout.includes('print') } invoice={ opts.invoice }>
      <yield to="right">
        <a class={ 'btn btn-lg btn-info mr-2' : true, 'disabled' : !opts.invoice } href="/admin/shop/invoice/{ (opts.invoice || {}).id }/update" disabled={ !opts.invoice }>
          Update Invoice
        </a>
        <a class={ 'btn btn-lg btn-info mr-2' : true, 'disabled' : !opts.invoice } href="/admin/shop/invoice/{ (opts.invoice || {}).id }/print" disabled={ !opts.invoice }>
          Print Invoice
        </a>
        <a href="/admin/shop/invoice" class="btn btn-lg btn-primary">
          Back
        </a>
      </yield>
    </admin-header>

    <div class="container{ this.mnt.layout.includes('print') ? '-fluid my-5' : '' }">

      <invoice-view invoice={ opts.invoice } orders={ opts.orders } />

      <div class="{ this.mnt.layout.includes('print') ? '' : 'card' }" if={ opts.payments }>
        <div class="card-header">
          Invoice Payments
        </div>
        <div class="card-body { this.mnt.layout.includes('print') ? 'px-0' : '' }">
          <grid grid={ opts.grid } table-class="table table-bordered table-striped" />
        </div>
      </div>

    </div>
  </div>

  <script>
    // do mixin
    this.mixin('mount');

    // on mount
    this.on('mount', () => {
      // check frontend
      if (!this.eden.frontend) return;

      // update
      this.update();
    });
  </script>
</invoice-admin-view-page>
