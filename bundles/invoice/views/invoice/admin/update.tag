<invoice-admin-update-page>

  <div class="page page-shop">
    <admin-header title="View Invoice">
      <yield to="right">
        <a href="/admin/shop/invoice" class="btn btn-lg btn-primary">
        Back
        </a>
      </yield>
    </admin-header>

    <div class="container-fluid">
      <div class="card mb-5">
        <div class="card-header">
          Invoice:
          <b>
            #{ this.invoice.id }
          </b>
          <span class="float-right">
            Status:
            <b>
              { this.t('invoice.status.' + (this.invoice.status || 'unpaid')) }
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
                <b>{ (opts.orders[0].user || {}).username || (opts.orders[0].address || {}).name }</b>
              </div>
              <div if={ (opts.orders[0].address || {}).formatted }>{ (opts.orders[0].address || {}).formatted }</div>
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
                  <td colspan="3" class="border-right-0">
                    Order: <b>#{ order.id }</b>
                  </td>
                  <td colspan="3" class="text-right border-left-0">
                    Status: <b>{ this.t('order.status.' + order.status) }</b>
                  </td>
                </tr>
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
            <button class={ 'btn btn-lg btn-success mr-2' : true, 'disabled' : this.emailing || this.saving } onclick={ onSave } disabled={ this.emailing || this.saving }>
              { this.saving ? 'Saving...' : 'Save Invoice' }
            </button>
            <button class={ 'btn btn-lg btn-info' : true, 'disabled' : this.emailing || this.saving } onclick={ onEmail } disabled={ this.emailing || this.saving }>
              { this.emailing ? 'Emailing...' : 'Email Invoice' }
            </button>
          </div>
        </div>
      </div>
      
      <div class="card">
        <div class="card-header">
          Invoice Payments
        </div>
        <div class="card-body">
          <grid grid={ opts.grid } />
        </div>
      </div>
      
    </div>
  </div>

  <script>
    // do mixin
    this.mixin('i18n');
    this.mixin('user');
    this.mixin('config');

    // set initial discount
    this.invoice  = opts.orders[0].invoice;
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
      if (this.saving) return;

      // set saving
      this.saving = true;
      this.update();

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
      this.saving = false;
      this.update();
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
</invoice-admin-update-page>
