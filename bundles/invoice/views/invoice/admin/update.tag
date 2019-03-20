<invoice-admin-update-page>

  <div class="page page-shop">
    <admin-header title="View Invoice">
      <yield to="right">
        <a href="/admin/shop/invoice" class="btn btn-lg btn-primary">
        Back
        </a>
      </yield>
    </admin-header>

    <div class="container">

      <div class="card mb-4">
        <div class="card-body">
          <span class="btn btn-{ this.colors[(this.invoice.status || 'pending')] }">Status: { this.t('invoice.status.' + (this.invoice.status || 'pending')) }</span>
          <button class={ 'btn btn-success float-right' : true, 'disabled' : this.loading() } onclick={ onSave } disabled={ this.loading() }>
            { this.loading('save') ? 'Saving...' : 'Save Invoice' }
          </button>
          <div class="dropdown float-right mr-2">
            <button class="btn btn-secondary dropdown-toggle" type="button" id="dropdownMenuButton" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
              <i class="fa fa-bars mr-2" />
              Actions
            </button>
            <div class="dropdown-menu" aria-labelledby="dropdownMenuButton">
              <button class={ 'dropdown-item' : true, 'disabled' : this.loading() } onclick={ onEmail } disabled={ this.loading() }>
                { this.loading('email') ? 'Emailing...' : 'Email Invoice' }
              </button>
              <button class={ 'dropdown-item' : true, 'disabled' : this.loading() } onclick={ onUpdateCompany } disabled={ this.loading() }>
                { this.update.company ? 'Save Update' : 'Update Company' }
              </button>
              <a href="/admin/shop/invoice/{ this.invoice.id }/view" class="dropdown-item">
                View Invoice
              </a>
              <a href="/admin/shop/invoice/{ this.invoice.id }/print" target="_blank" class="dropdown-item">
                Print Invoice
              </a>
            </div>
          </div>
        </div>
        <div class="card-body">
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
              <cms-placement placement="invoice.company" preview={ !this.update.company } />
            </div>
          </div>
        </div>
        <hr />
        <div class="card-body">
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
                  <td colspan="3" class="border-right-0">
                    Order: <b>#{ order.id }</b>
                  </td>
                  <td colspan="3" class="text-right border-left-0">
                    <button class="btn btn-sm btn-primary" onclick={ onProduct }>
                      <i class="fa fa-plus mr-2" /> Add Line Item
                    </button>
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
              </tbody>

              <tfoot>
                <tr>
                  <td colspan="3" rowspan="3" class="border-0 bg-transparent">
                    <div class="form-group">
                      <label>
                        Note
                      </label>
                      <textarea class="form-control" ref="note" onkeyup={ onNote }>{ this.invoice.note }</textarea>
                    </div>
                  </td>
                  <td rowspan="3" class="border-0 bg-transparent" />
                  <td class="text-right border-left-0 border-right-0">
                    <b class="d-block">Subtotal</b>
                  </td>
                  <td class="text-right border-left-0 border-right-0">
                    ${ getSubtotal().toFixed(2) } { this.invoice.currency }
                  </td>
                </tr>
                <tr>
                  <td class="text-right border-left-0 border-right-0">
                    <b class="d-block">Discount</b>
                  </td>
                  <td class="text-right border-left-0 border-right-0">
                    $<span contenteditable={ this.user.acl.validate('admin') } onblur={ onDiscount }>{ this.discount.toFixed(2) }</span> { this.invoice.currency }
                  </td>
                </tr>
                <tr>
                  <td class="text-right border-left-0 border-right-0">
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
        <div class="card-body">
          <button class={ 'btn btn-success float-right' : true, 'disabled' : this.loading() } onclick={ onSave } disabled={ this.loading() }>
            { this.loading('save') ? 'Saving...' : 'Save Invoice' }
          </button>
        </div>
      </div>
    </div>

    <div class="container-fluid">
      <div class="card">
        <div class="card-header">
          Invoice Payments
        </div>
        <div class="card-body">
          <grid grid={ opts.grid } ref="payments" table-class="table table-bordered table-striped" />
        </div>
        <div class="card-body text-right">
          <button class={ 'btn btn-success mr-2' : true, 'disabled' : this.loading() } onclick={ onPayment } disabled={ this.loading() }>
            { this.loading('record') ? 'Recording Payment...' : 'Record Payment' }
          </button>
        </div>
      </div>

    </div>
  </div>

  <div class="modal fade" id="modal-payment" ref="payment">
    <div class="modal-dialog modal-lg">
      <div class="modal-content">

        <!-- Modal Header -->
        <div class="modal-header">
          <h4 class="modal-title">
            Record Payment
          </h4>
          <button type="button" class="close" data-dismiss="modal">&times;</button>
        </div>

        <!-- Modal body -->
        <div class="modal-body">
          <div class="mb-3">
            <button class="btn btn-{ this.payment === 'normal' ? 'primary' : 'secondary' } mr-2" onclick={ onNormalPayment }>
              Normal Payment
            </button>
            <button class="btn btn-{ this.payment === 'manual' ? 'primary' : 'secondary' }" onclick={ onManualPayment }>
              Manual Payment
            </button>
          </div>
          <validate label="Amount" required name="amount" type="number" step="0.01" ref="amount">
            <yield to="prepend">
              <div class="input-group-prepend">
                <span class="input-group-text">$</span>
              </div>
            </yield>
            <yield to="append">
              <div class="input-group-append">
                <span class="input-group-text">
                  { eden.get('shop.currency') }
                </span>
              </div>
            </yield>
          </validate>
          <validate label="Details" required min-length={ 2 } name="details" type="textarea" ref="details" />
          <div if={ this.payment === 'normal' }>
            <payment-checkout ref="checkout" action={ this.action } />
          </div>
          <div if={ this.payment === 'manual' }>
            <div class="card">
              <div class="card-header">
                Manual Payment
              </div>
              <div class="card-body">
                <validate label="Method" required min-length={ 2 } name="method" type="text" ref="method" />
              </div>
            </div>
          </div>
        </div>

        <!-- Modal footer -->
        <div class="modal-footer">
          <button type="button" class={ 'btn btn-danger mr-2' : true, 'disabled' : this.loading('payment') } disabled={ this.loading('payment') } data-dismiss="modal">Close</button>
          <button type="button" class={ 'btn btn-success' : true, 'disabled' : this.loading('payment') } disabled={ this.loading('payment') } onclick={ onSubmitPayment }>
            Submit { this.payment === 'normal' ? 'Normal' : 'Manual' } Payment
          </button>
        </div>

      </div>
    </div>
  </div>

  <div class="modal fade" id="modal-email" ref="email">
    <div class="modal-dialog">
      <div class="modal-content">

        <!-- Modal Header -->
        <div class="modal-header">
          <h4 class="modal-title">
            Email Invoice
          </h4>
          <button type="button" class="close" data-dismiss="modal">&times;</button>
        </div>

        <!-- Modal body -->
        <div class="modal-body">
          Modal body..
        </div>

        <!-- Modal footer -->
        <div class="modal-footer">
          <button type="button" class="btn btn-danger" data-dismiss="modal">Close</button>
        </div>

      </div>
    </div>
  </div>

  <div class="modal fade" id="modal-product" ref="product">
    <div class="modal-dialog">
      <div class="modal-content">

        <!-- Modal Header -->
        <div class="modal-header">
          <h4 class="modal-title">
            Add Product Line
          </h4>
          <button type="button" class="close" data-dismiss="modal">&times;</button>
        </div>

        <!-- Modal body -->
        <div class="modal-body">
          <eden-select ref="select" class={ 'd-block' : true, 'mb-4' : this.item } url="/admin/shop/product/query" name="product" label={ 'Search by Name' } data={ { 'value' : null } } on-change={ onSelectProduct }>
            <option each={ product, i in opts.data.value || [] } selected="true" value={ product.id }>
              { product.title[this.i18n.lang()] }
            </option>
          </eden-select>

          <h1 class="text-center" if={ this.loading('product') }>
            <i class="fa fa-spinner fa-spin" />
          </h1>
          <div if={ this.item && !this.loading('product') } data-is="product-{ this.item.type }-buy" product={ this.item } on-add={ onAddProduct }/>
        </div>

        <!-- Modal footer -->
        <div class="modal-footer">
          <button type="button" class="btn btn-danger" data-dismiss="modal">Close</button>
        </div>

      </div>
    </div>
  </div>

  <script>
    // do mixin
    this.mixin('i18n');
    this.mixin('user');
    this.mixin('config');
    this.mixin('product');
    this.mixin('loading');

    // set initial discount
    this.item     = null;
    this.update   = {};
    this.action   = Object.assign(opts.orders[0].actions.payment, { 'manual' : true });
    this.invoice  = opts.invoice;
    this.payment  = 'normal';
    this.discount = (this.invoice || {}).discount || 0;
    this.colors   = {
      'paid'    : 'success',
      'sent'    : 'primary',
      'partial' : 'warning',
      'unpaid'  : 'danger',
      'pending' : 'info',
    };

    /**
     * get line title
     *
     * @param  {Event} e
     *
     * @return {*}
     */
    onNote(e) {
      // set value
      this.invoice.note = e.target.value.trim();
    }

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
    onEmail(e) {
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
    onPayment(e) {
      // prevent default
      e.preventDefault();
      e.stopPropagation();

      // show modal
      jQuery(this.refs.payment).modal('show');
    }

    /**
     * on save
     *
     * @param  {Event} e
     */
    onProduct(e) {
      // prevent default
      e.preventDefault();
      e.stopPropagation();

      // set order
      this.order = e.item.order;

      // show modal
      jQuery(this.refs.product).modal('show');
    }

    /**
     * on save
     *
     * @param  {Event} e
     */
    onNormalPayment(e) {
      // prevent default
      e.preventDefault();
      e.stopPropagation();

      // set order
      this.payment = 'normal';

      // show modal
      this.update();
    }

    /**
     * on save
     *
     * @param  {Event} e
     */
    onManualPayment(e) {
      // prevent default
      e.preventDefault();
      e.stopPropagation();

      // set order
      this.payment = 'manual';

      // show modal
      this.update();
    }

    /**
     * on save
     *
     * @param  {Event} e
     */
    onUpdateCompany(e) {
      // prevent default
      e.preventDefault();
      e.stopPropagation();

      // show modal
      this.update.company = !this.update.company;

      // update
      this.update();
    }

    /**
     * on select product
     *
     * @param  {Event} e
     */
    async onSelectProduct(e) {
      // get product
      const productID = e.target.value;

      // loading product
      this.loading('product', true);

      // get product
      this.item = (await eden.router.get(`/admin/shop/product/${productID}/get`)).result;

      // loading product
      this.loading('product', false);
    }

    /**
     * adds product line
     *
     * @param  {Event} e
     */
    onAddProduct(product, o) {
      // add product
      this.order.products.push(product);
      this.order.lines.push({
        qty     : 1,
        opts    : o,
        order   : this.order.id,
        price   : this.product.price(product, o),
        total   : this.product.price(product, o),
        product : product.id,
      });

      // update view
      this.update();
    }

    /**
     * on submit payment
     *
     * @param  {Event}  e
     *
     * @return {Promise}
     */
    async onSubmitPayment(e) {
      // prevent default
      e.preventDefault();
      e.stopPropagation();

      // check saving
      if (this.loading('payment')) return;

      // set saving
      this.loading('payment', true);

      // post
      const result = (await eden.router.post(`/admin/shop/invoice/${this.invoice.id}/payment/create`, {
        type     : this.payment,
        action   : this.action,
        method   : (this.refs.method || {}).value,
        amount   : parseFloat(this.refs.amount.value),
        details  : this.refs.details.value,
        currency : this.eden.get('shop.currency'),
      }));

      // success
      if (result.success) {
        // set invoice
        this.invoice = result.invoice;

        // update grid
        this.refs.payments.grid.update();

        // go redirect
        if ((result.result.data || {}).redirect) eden.router.go((result.result.data || {}).redirect);

        // show modal
        jQuery(this.refs.payment).modal('hide');
      }

      // set saving
      this.loading('payment', false);
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
        note     : this.invoice.note,
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

      // set saving
      this.loading('save', false);
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
