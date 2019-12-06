<invoice-admin-view-page>

  <div class="page page-shop">
    <admin-header title="View Invoice" if={ !this.mnt.layout.includes('print') } invoice={ opts.invoice } back={ this.back ? this.back : '' }>
      <yield to="right">
        <a class={ 'btn btn-lg btn-info mr-2' : true, 'disabled' : !opts.invoice } href="/admin/shop/invoice/{ (opts.invoice || {}).id }/update{ opts.back ? '?back='+opts.back : ''}" disabled={ !opts.invoice }>
          Update Invoice
        </a>
        <a class={ 'btn btn-lg btn-info mr-2' : true, 'disabled' : !opts.invoice } href="/admin/shop/invoice/{ (opts.invoice || {}).id }/print{ opts.back ? '?back='+opts.back : ''}" disabled={ !opts.invoice }>
          Print Invoice
        </a>
        <a href={ opts.back ? opts.back : '/admin/shop/invoice' } class="btn btn-lg btn-primary">
          Back
        </a>
      </yield>
    </admin-header>

    <div class="container{ this.mnt.layout.includes('print') ? '-fluid my-5' : '' }">

      <invoice-view invoice={ opts.invoice } orders={ opts.orders } invoices={ opts.invoices ?  opts.invoices : '' } />

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

    const q = require('querystring');
    this.back = '';

    // on update
    this.on('update', () => {
      // check frontend
      if (!this.eden.frontend) return;
      let url_ = location.search ? location.search.substr(1) : '';
      this.back = q.parse(url_) ? q.parse(url_).back : '';
    });

    // on mount
    this.on('mount', () => {
      // check frontend
      if (!this.eden.frontend) return;

      // update
      this.update();
    });
  </script>
</invoice-admin-view-page>
