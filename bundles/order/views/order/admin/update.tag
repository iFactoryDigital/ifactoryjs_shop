<order-admin-update-page>

  <div class="page page-shop">
    <admin-header title="View Invoice">
      <yield to="right">
        <a href="/admin/shop/order" class="btn btn-lg btn-primary">
        Back
        </a>
      </yield>
    </admin-header>

    <div class="container-fluid">

      <div class="card mb-4">
        <div class="card-header">
          Invoice:
          <b>
            #{ this.invoice.id }
          </b>
          <span class="float-right">
            Status:
            <b>
              { this.t('order.status.' + (this.order.status || 'unpaid')) }
            </b>
          </span>
        </div>
        <div class="card-body">
          <div class="row mb-4">
            <div class="col-sm-6">
              <cms-placement placement="invoice.company" />
            </div>
            <div class="col-sm-6">
              <div>
                <b>{ (opts.order.user || {}).username || (opts.order.address || {}).name }</b>
              </div>
              <div if={ (opts.order.address || {}).formatted }>{ (opts.order.address || {}).formatted }</div>
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
                    $<span contenteditable={ this.user.acl.validate('admin') } onblur={ onLinePrice }>{ line.price.toFixed(2) }</span> { this.invoice.currency }
                  </td>
                  <td class="text-center" contenteditable={ this.user.acl.validate('admin') } onblur={ onLineQty }>{ line.qty.toLocaleString() }</td>
                  <td class="text-right">${ line.total.toFixed(2) } { this.invoice.currency }</td>
                </tr>
                <tr if={ this.user.acl.validate('admin') } class="bg-transparent">
                  <td colspan="6" class="border-0 text-right bg-transparent">
                    <button class="btn btn-primary">
                      <i class="fa fa-plus" />
                    </button>
                  </td>
                </tr>
              </tbody>

              <tfoot>
                <tr>
                  <td colspan="4" class="border-0 bg-transparent" />
                  <td class="text-right border-left-0 border-right-0">
                    <b>Subtotal</b>
                  </td>
                  <td class="text-right border-left-0 border-right-0">
                    ${ getSubtotal().toFixed(2) } { this.invoice.currency }
                  </td>
                </tr>
                <tr>
                  <td colspan="4" class="border-0 bg-transparent" />
                  <td class="text-right border-left-0 border-right-0">
                    <b>Discount</b>
                  </td>
                  <td class="text-right border-left-0 border-right-0">
                    $<span contenteditable={ this.user.acl.validate('admin') } onblur={ onDiscount }>{ this.discount.toFixed(2) }</span> { this.invoice.currency }
                  </td>
                </tr>
                <tr>
                  <td colspan="4" class="border-0 bg-transparent" />
                  <td class="text-right border-left-0 border-right-0">
                    <b>Total</b>
                  </td>
                  <td class="text-right border-left-0 border-right-0">
                    <b>${ (getSubtotal() - this.discount).toFixed(2) } { this.invoice.currency }</b>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div class="text-right mt-5">
            <button class={ 'btn btn-lg btn-success mr-2' : true, 'disabled' : this.loading() } onclick={ onSave } disabled={ this.loading() }>
              { this.loading('save') ? 'Saving...' : 'Save Invoice' }
            </button>
            <button class={ 'btn btn-lg btn-info' : true, 'disabled' : this.loading() } onclick={ onEmail } disabled={ this.loading() }>
              { this.loading('email') ? 'Emailing...' : 'Email Invoice' }
            </button>
          </div>
        </div>
      </div>

    </div>
  </div>

  <script>
    // do mixin
    this.mixin('i18n');
    this.mixin('user');
    this.mixin('config');
    this.mixin('loading');

    // set initial discount
    this.order    = opts.order;
    this.invoice  = this.order.invoice;
    this.discount = (this.invoice || {}).discount || 0;

    /**
     * get line title
     *
     * @param  {Event} e
     *
     * @return {*}
     */
    onLineTitle(e) {
      // set value
      e.item.line.title = (e.target.innerText || '').trim();

      // update
      this.update();
    }

    /**
     * get line title
     *
     * @param  {Event} e
     *
     * @return {*}
     */
    onLineShort(e) {
      // set value
      e.item.line.short = (e.target.innerText || '').trim();

      // update
      this.update();
    }

    /**
     * get line title
     *
     * @param  {Event} e
     *
     * @return {*}
     */
    onLinePrice(e) {
      // set value
      e.item.line.price = parseFloat((e.target.innerText || '').trim());
      e.item.line.total = e.item.line.price * e.item.line.qty;

      // update
      this.update();
    }

    /**
     * get line title
     *
     * @param  {Event} e
     *
     * @return {*}
     */
    onLineQty(e) {
      // set value
      e.item.line.qty = parseInt((e.target.innerText || '').trim());
      e.item.line.total = e.item.line.price * e.item.line.qty;

      // update
      this.update();
    }

    /**
     * on discount
     *
     * @param  {Event} e
     */
    onDiscount(e) {
      // set value
      this.discount = parseFloat((e.target.innerText || '').trim());

      // update
      this.update();
    }

    /**
     * on save
     *
     * @param  {Event} e
     */
    async onSave(e) {
      // prevent default
      e.preventDefault();
      e.stopPropagation();

      // check saving
      if (this.loading('save')) return;

      // set saving
      this.loading('save', true);

      // post
      const orders = (await eden.router.post(`/admin/shop/invoice/${this.invoice.id}/update`, {
        lines    : [].concat(...(opts.orders.map((order) => order.lines))),
        discount : this.discount,
      })).result;

      // loop orders
      opts.orders.forEach((o) => {
        // get found
        const find = orders.find((or) => or.id === o.id);

        // loop keys
        for (const key in find) {
          // set value
          o[key] = find[key];
        }
      });

      // set invoice
      this.invoice = orders[0].invoice;

      // set saving
      this.loading('save', false);
    }

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

    /**
     * on save
     *
     * @param  {Event} e
     */
    async onPayment(e) {
      // prevent default
      e.preventDefault();
      e.stopPropagation();

      // show modal
      jQuery(this.refs.payment).modal('show');
    }

    /**
     * get line product
     *
     * @param  {Object} line
     *
     * @return {Object}
     */
    getProduct(line) {
      // return product
      return opts.orders.find(o => o.id === line.order).products.find(p => p.id === line.product);
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
</order-admin-update-page>
