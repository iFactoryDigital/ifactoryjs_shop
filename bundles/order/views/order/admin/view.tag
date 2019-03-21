<order-admin-view-page>
  <div class="page page-shop">
    <admin-header title="View Order" if={ !this.mnt.layout.includes('print') }>
      <yield to="right">
        <a href="/admin/shop/order" class="btn btn-lg btn-primary">
        Back
        </a>
      </yield>
    </admin-header>

    <div class="container{ this.mnt.layout.includes('print') ? '-fluid my-4' : '' }">

      <div class="card mb-4">
        <div class="card-body">
          <span class="btn btn-{ this.colors[(this.order.status || 'pending')] }">Status: { this.t('order.status.' + (this.order.status || 'pending')) }</span>
        </div>
        <div class="card-body">
          <div class="row">
            <div class="col-md-7 col-lg-8">
              <h3 class="mb-4">
                Order: { this.order.id }
              </h3>

              <p class="lead mb-2">
                Order Number
              </p>
              <b class="d-block mb-3">
                { this.order.id }
              </b>

              <p class="lead mb-2">
                Invoice Date
              </p>
              <b class="d-block">
                { this.invoice ? new Date(this.invoice.created).toLocaleString() : 'N/A' }
              </b>
            </div>
          </div>
        </div>
        <hr />
        <div class="card-body">
          <div class="row mb-5">
            <div class="col-sm-8">
              <p class="lead mb-2">
                Bill To
              </p>
              <b class="d-block mb-3">
                { (opts.order.address || {}).name || (opts.order.user || {}).username }
              </b>
            </div>
            <div class="col-sm-4">
              <p class="lead m-0">
                Order Total
              </p>
              <h1 class="my-3">
                <money show-currency={ true } amount={ (getSubtotal()) } currency={ (this.invoice || {}).currency } />
              </h1>
            </div>
          </div>
          <div class="table-responsive-sm">
            <table class="table table-striped table-bordered border-0">
              <thead>
                <tr>
                  <th class="text-center">#</th>
                  <th>Item</th>
                  <th>Description</th>
                  <th class="text-right">Unit Cost</th>
                  <th class="text-center">Qty</th>
                  <th class="text-right">Total</th>
                </tr>
              </thead>

              <tbody>
                <tr each={ line, i in order.lines }>
                  <td class="text-center">{ (i + 1) }</td>
                  <td contenteditable={ this.user.acl.validate('admin') } onblur={ onLineTitle }>
                    { line.title || getProduct(line).title[this.i18n.lang()] }
                  </td>
                  <td contenteditable={ this.user.acl.validate('admin') } onblur={ onLineShort }>
                    { line.short || getProduct(line).short[this.i18n.lang()] }
                  </td>
                  <td class="text-right">
                    <money show-currency={ true } amount={ line.price } currency={ (this.invoice || {}).currency } editable={ true } onchange={ onLinePrice } />
                  </td>
                  <td class="text-center" contenteditable={ this.user.acl.validate('admin') } onblur={ onLineQty }>{ line.qty.toLocaleString() }</td>
                  <td class="text-right">
                    <money show-currency={ true } amount={ line.total } currency={ (this.invoice || {}).currency } />
                  </td>
                </tr>
              </tbody>

              <tfoot>
                <tr>
                  <td colspan="4" rowspan="2" class="border-0 bg-transparent" />
                  <td class="text-right border-left-0 border-right-0">
                    <b class="d-block">Subtotal</b>
                  </td>
                  <td class="text-right border-left-0 border-right-0">
                    <money show-currency={ true } amount={ getSubtotal() } />
                  </td>
                </tr>
                <tr>
                  <td class="text-right border-left-0 border-right-0">
                    <b class="d-block">Total</b>
                  </td>
                  <td class="text-right border-left-0 border-right-0">
                    <b class="d-block">
                      <money show-currency={ true } amount={ getSubtotal() } />
                    </b>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>

  <script>
    // do mixin
    this.mixin('i18n');
    this.mixin('user');
    this.mixin('mount');
    this.mixin('config');
    this.mixin('loading');
    this.mixin('product');

    // set initial discount
    this.order   = opts.order;
    this.invoice = this.order.invoice;
    this.colors  = {
      'paid'    : 'success',
      'sent'    : 'primary',
      'partial' : 'warning',
      'unpaid'  : 'danger',
      'pending' : 'info',
    };

    /**
     * get line product
     *
     * @param  {Object} line
     *
     * @return {Object}
     */
    getProduct(line) {
      // return product
      return this.order.products.find(p => p.id === line.product);
    }

    /**
     * get subtotal
     *
     * @return {*}
     */
    getSubtotal() {
      // return lines
      return this.order.lines.reduce((accum, line) => {
        // line total
        return accum + line.total;
      }, 0);
    }

    // on mount
    this.on('mount', () => {
      // check frontend
      if (!this.eden.frontend) return;

      // update
      this.update();
    });
  </script>
</order-admin-view-page>
