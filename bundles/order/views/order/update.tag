<order-update>
  <div class="{ opts.card || 'card mb-4' }">
    <div class="card-body">
      <span class="btn btn-{ this.colors[(this.order.status || 'pending')] }">Status: { this.t('order.status.' + (this.order.status || 'pending')) }</span>
      
      <button class={ 'btn btn-success float-right' : true, 'disabled' : !this.order.status === 'paid' } disabled={ this.order.status === 'paid' } onclick={ onPayment } if={ this.order.id }>
        { this.order.status === 'paid' ? 'Order Paid' : 'Pay Order' }
      </button>
      <button class={ 'btn btn-success float-right mr-2' : true, 'disabled' : this.loading() } onclick={ onSave } disabled={ this.loading() }>
        { this.loading('save') ? 'Saving...' : 'Save Order' }
      </button>

      <div class="dropdown float-right mr-2" if={ opts.actions !== false }>
        <button class="btn btn-secondary dropdown-toggle" type="button" id="dropdownMenuButton" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
          <i class="fa fa-bars mr-2" />
          Actions
        </button>
        <div class="dropdown-menu" aria-labelledby="dropdownMenuButton">
          <button class={ 'dropdown-item' : true, 'disabled' : this.loading() } onclick={ onEmail } disabled={ this.loading() }>
            { this.loading('email') ? 'Emailing...' : 'Email Order' }
          </button>
          <a href="/admin/shop/order/{ this.order.id }/view" class="dropdown-item">
            View Order
          </a>
          <a href="/admin/shop/order/{ this.order.id }/print" target="_blank" class="dropdown-item">
            Print Order
          </a>
        </div>
      </div>
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

          <p class="lead mb-2" if={ this.invoice }>
            Invoice Number
          </p>
          <b class="d-block mb-3" if={ this.invoice }>
            { this.invoice.id }
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
              <th width="1%"></th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td colspan="3" class="border-right-0"></td>
              <td colspan="4" class="text-right border-left-0">
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
                <money show-currency={ true } amount={ line.price } currency={ (this.invoice || {}).currency } editable={ true } onchange={ onLinePrice } />
              </td>
              <td class="text-center" contenteditable={ this.user.acl.validate('admin') } onblur={ onLineQty }>{ line.qty.toLocaleString() }</td>
              <td class="text-right">
                <money show-currency={ true } amount={ line.total } currency={ (this.invoice || {}).currency } />
              </td>
              <td>
                <button class="btn btn-sm btn-danger" onclick={ onRemoveLine }>
                  <i class="fa fa-times" />
                </button>
              </td>
            </tr>
          </tbody>

          <tfoot>
            <tr>
              <td colspan="4" rowspan="2" class="border-0 bg-transparent" />
              <td class="text-right border-left-0 border-right-0">
                <b class="d-block">Subtotal</b>
              </td>
              <td colspan="2" class="text-right border-left-0 border-right-0">
                <money show-currency={ true } amount={ getSubtotal() } />
              </td>
            </tr>
            <tr>
              <td class="text-right border-left-0 border-right-0">
                <b class="d-block">Total</b>
              </td>
              <td colspan="2" class="text-right border-left-0 border-right-0">
                <b class="d-block">
                  <money show-currency={ true } amount={ getSubtotal() } />
                </b>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>

    <div class="card-body">
      <button class={ 'btn btn-success float-right' : true, 'disabled' : this.order.status === 'paid' } disabled={ this.order.status === 'paid' } onclick={ onPayment } if={ this.order.id }>
        { this.order.status === 'paid' ? 'Order Paid' : 'Pay Order' }
      </button>
      <button class={ 'btn btn-success float-right mr-2' : true, 'disabled' : this.loading() } onclick={ onSave } disabled={ this.loading() }>
        { this.loading('save') ? 'Saving...' : 'Save Order' }
      </button>
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
          <button onclick={ onDismissProduct } class="close">&times;</button>
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
          <button type="button" class="btn btn-danger" onclick={ onDismissProduct }>Close</button>
        </div>

      </div>
    </div>
  </div>
  
  <order-admin-payment order={ opts.order } loading={ this.loading } ref="payment" />

  <script>
    // do mixin
    this.mixin('i18n');
    this.mixin('user');
    this.mixin('config');
    this.mixin('loading');
    this.mixin('product');

    // set initial discount
    this.order   = opts.order;
    this.invoice = opts.invoice || this.order.invoice;
    this.colors  = {
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
     * on remove line
     *
     * @param  {Event} e
     */
    onRemoveLine(e) {
      // remove line
      this.order.lines.splice(e.item.i, 1);

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
      const order = (await eden.router.post(opts.submit || `/admin/shop/order/${this.order.id}/update`, {
        lines : this.order.lines,
      })).result;

      // set invoice
      this.order   = order;
      this.invoice = order.invoice;

      // on save
      if (opts.onSave) opts.onSave(order);

      // set saving
      this.loading('save', false);
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
      
      // show payment
      this.refs.payment.show();
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

      // show modal
      jQuery(this.refs.product).modal('show');
    }
    
    /**
     * on dismiss product
     *
     * @param  {Event} e
     */
    onDismissProduct(e) {
      // prevent default
      e.preventDefault();
      e.stopPropagation();

      // show modal
      jQuery(this.refs.product).modal('hide');
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
</order-update>
