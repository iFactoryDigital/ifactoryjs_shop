<invoice-view>
  <div class="{ this.mnt.layout.includes('print') ? '' : 'card' } mb-4">
    <div class="card-body { this.mnt.layout.includes('print') ? 'px-0' : '' }">
      <span class="btn btn-{ this.colors[(this.invoice.status || 'pending')] }">Status: { this.t('invoice.status.' + (this.invoice.status || 'pending')) }</span>
    </div>
    <div class="card-body { this.mnt.layout.includes('print') ? 'px-0' : '' }">
      <div class="row">
        <div class="col-md-7 col-lg-8">
          <h3 class="mb-4">
            Invoice: { this.invoice.id }
          </h3>

          <p class="lead mb-2">
            Invoice Number
          </p>
          <b class="d-block mb-3">
            { this.invoice.id }
          </b>

          <p class="lead mb-2">
            Invoice Date
          </p>
          <b class="d-block">
            { new Date(this.invoice.created).toLocaleString() }
          </b>
        </div>
        <div class="col-md-5 col-lg-4">
          <cms-placement placement="invoice.company" preview={ true } />
        </div>
      </div>
    </div>
    <hr />
    <div class="card-body { this.mnt.layout.includes('print') ? 'px-0' : '' }">
      <div class="row mb-5">
        <div class="col-sm-4">
          <p class="lead mb-2">
            Bill To
          </p>
          <b class="d-block mb-3">
            { (opts.orders[0].address || {}).name || (opts.orders[0].user || {}).username }
          </b>
        </div>
        <div class="col-sm-4">
          <p class="lead mb-2">
            Total Amount
          </p>
          <b class="d-block mb-3">
            <money amount={ (getSubtotal() - this.discount) } />
          </b>

          <p class="lead mb-2">
            Total Paid
          </p>
          <b class="d-block">
            <money amount={ this.invoice.paid || 0 } />
          </b>
        </div>
        <div class="col-sm-4">
          <p class="lead m-0">
            Balance Due
          </p>
          <h1 class="my-3">
            <money amount={ (getSubtotal() - this.discount) - (this.invoice.paid || 0) } />
          </h1>

          <span class="btn btn-light">
            Due Date: { new Date(this.invoice.created).toLocaleString() }
          </span>
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

          <tbody each={ order, a in opts.orders }>
            <tr>
              <td colspan="6">
                Order: <b>#{ order.id }</b>
              </td>
            </tr>
            <tr each={ line, i in order.lines }>
              <td class="text-center">{ (i + 1) }</td>
              <td onblur={ onLineTitle }>
                { line.title || getProduct(line).title[this.i18n.lang()] }
              </td>
              <td onblur={ onLineShort }>
                { line.short || getProduct(line).short[this.i18n.lang()] }
              </td>
              <td class="text-right">
                $<span onblur={ onLinePrice }>{ line.price.toFixed(2) }</span> { this.invoice.currency }
              </td>
              <td class="text-center" onblur={ onLineQty }>{ line.qty.toLocaleString() }</td>
              <td class="text-right">${ line.total.toFixed(2) } { this.invoice.currency }</td>
            </tr>
          </tbody>

          <tfoot>
            <tr>
              <td colspan="3" rowspan="3" class="border-0 bg-transparent">
                <div class="form-group">
                  <label>
                    Note
                  </label>
                  <textarea class="form-control" ref="note" readonly>{ this.invoice.note }</textarea>
                </div>
              </td>
              <td class="text-right border-left-0 border-right-0" colspan="2">
                <b class="d-block">Subtotal</b>
              </td>
              <td class="text-right border-left-0 border-right-0">
                ${ getSubtotal().toFixed(2) } { this.invoice.currency }
              </td>
            </tr>
            <tr>
              <td class="text-right border-left-0 border-right-0" colspan="2">
                <b class="d-block">Discount</b>
              </td>
              <td class="text-right border-left-0 border-right-0">
                $<span onblur={ onDiscount }>{ this.discount.toFixed(2) }</span> { this.invoice.currency }
              </td>
            </tr>
            <tr>
              <td class="text-right border-left-0 border-right-0" colspan="2">
                <b class="d-block">Total</b>
              </td>
              <td class="text-right border-left-0 border-right-0">
                <b class="d-block">${ (getSubtotal() - this.discount).toFixed(2) } { this.invoice.currency }</b>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  </div>

  <script>
    // do mixin
    this.mixin('i18n');
    this.mixin('user');
    this.mixin('mount');
    this.mixin('config');
    this.mixin('product');
    this.mixin('loading');

    // set initial discount
    this.item     = null;
    this.invoice  = opts.invoice;
    this.discount = (this.invoice || {}).discount || 0;
    this.colors   = {
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
      return ((opts.orders.find(o => o.id === line.order) || opts.orders[0]).products || []).find(p => p.id === line.product) || {};
    }

    /**
     * get subtotal
     *
     * @return {*}
     */
    getSubtotal() {
      // reduce lines
      return opts.orders.reduce((subtotal, order) => {
        // return lines
        return order.lines.reduce((accum, line) => {
          // line total
          return accum + line.total;
        }, 0) + subtotal;
      }, 0);
    }

    getOverdueInvoices() {
      if(invoices.length > 0) {
        const invoices = opts.invoices.filter(invoice => { let paid = 0; invoice.payments.map(payment => payment.state === 'paid' ? paid += payment.amount : ''); invoice.paidamount = paid; return paid < invoice.total });
        return invoices;
      }
    }

    // on mount
    this.on('mount', () => {
      // check frontend
      if (!this.eden.frontend) return;

      // set initial discount
      this.discount = (this.getSubtotal() - this.invoice.total);

      // update
      this.update();
    });
  </script>
</invoice-view>
