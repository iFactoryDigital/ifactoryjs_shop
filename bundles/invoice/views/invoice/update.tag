<invoice-update>
  <div class="{ opts.card || 'card mb-4' }">
    <div class="card-body">
      <span class="btn btn-{ this.colors[(this.invoice.status || 'pending')] }">Status: { this.t('invoice.status.' + (this.invoice.status || 'pending')) }</span>
      <button class={ 'btn btn-success float-right' : true, 'disabled' : this.loading() } onclick={ onSave } disabled={ this.loading() }>
        { this.loading('save') ? 'Saving...' : 'Save Invoice' }
      </button>
      <div class="dropdown float-right mr-2" if={ opts.actions !== false }>
        <button class="btn btn-secondary dropdown-toggle" type="button" id="dropdownMenuButton" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
          <i class="fa fa-bars mr-2" />
          Actions
        </button>
        <div class="dropdown-menu" aria-labelledby="dropdownMenuButton">
          <button class={ 'dropdown-item' : true, 'disabled' : this.loading() } onclick={ onUpdateCompany } disabled={ this.loading() }>
            { this.updates.company ? 'Save Update' : 'Update Company' }
          </button>
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
          <cms-placement placement="invoice.company" preview={ !this.updates.company } />
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
          <b class="d-block mb-3" if={ (opts.orders || []).length }>
            { (opts.orders[0].address || {}).name || (opts.orders[0].user || {}).username }
          </b>
        </div>
        <div class="col-sm-4">
          <p class="lead mb-2">
            Total Amount
          </p>
          <b class="d-block mb-3">
            <money amount={ (getSubtotal() - this.discount) } show-currency={ true } currency={ this.invoice.currency } />
          </b>

          <p class="lead mb-2">
            Total Paid
          </p>
          <b class="d-block">
            <money amount={ this.invoice.paid || 0 } show-currency={ true } currency={ this.invoice.currency } />
          </b>
        </div>
        <div class="col-sm-4">
          <p class="lead m-0">
            Balance Due
          </p>
          <h1 class="my-3">
            <money amount={ (getSubtotal() - this.discount) - (this.invoice.paid || 0) } show-currency={ true } currency={ this.invoice.currency } />
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
              <th width="1%"></th>
            </tr>
          </thead>

          <tbody each={ order, a in (opts.orders || []) } show={ order.id }>
            <tr>
              <td colspan="3" class="border-right-0">
                Order: <a href="/admin/shop/order/{ order.id }/update"><b>#{ order.id }</b></a>
              </td>
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
                <money amount={ line.price } show-currency={ true } currency={ this.invoice.currency } editable={ true } on-change={ onLinePrice } />
              </td>
              <td class="text-center" contenteditable={ this.user.acl.validate('admin') } onblur={ onLineQty }>{ line.qty.toLocaleString() }</td>
              <td class="text-right">
                <money show-currency={ true } amount={ line.total } currency={ (this.invoice || {}).currency } />
              </td>
              <td class="text-right">
                <button class="btn btn-sm btn-danger" onclick={ onRemoveLine } data-order={ order.id }>
                  <i class="fa fa-times" />
                </button>
              </td>
            </tr>
          </tbody>
          
          <tbody>
            <tr>
              <td colspan="7" class="text-right">
                <button class="btn btn-sm btn-primary" onclick={ onOrder }>
                  <i class="fa fa-plus mr-2" /> Add Order
                </button>
              </td>
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
              <td colspan="2" class="text-right border-left-0 border-right-0">
                <money show-currency={ true } amount={ getSubtotal() } currency={ (this.invoice || {}).currency } />
              </td>
            </tr>
            <tr>
              <td class="text-right border-left-0 border-right-0">
                <b class="d-block">Discount</b>
              </td>
              <td colspan="2" class="text-right border-left-0 border-right-0">
                <money amount={ this.discount } show-currency={ true } currency={ this.invoice.currency } editable={ true } on-change={ onDiscount } />
              </td>
            </tr>
            <tr>
              <td class="text-right border-left-0 border-right-0">
                <b class="d-block">Total</b>
              </td>
              <td colspan="2" class="text-right border-left-0 border-right-0">
                <b class="d-block">
                  <money amount={ (getSubtotal() - this.discount) } show-currency={ true } currency={ this.invoice.currency } editable={ true } />
                </b>
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

  <div class="modal fade" id="modal-order" ref="order">
    <div class="modal-dialog">
      <div class="modal-content">

        <!-- Modal Header -->
        <div class="modal-header">
          <h4 class="modal-title">
            Add Order
          </h4>
          <button type="button" class="close" data-dismiss="modal">&times;</button>
        </div>

        <!-- Modal body -->
        <div class="modal-body">
          <eden-select ref="select-order" class={ 'd-block' : true, 'mb-4' : this.item } url="{ opts.orderQuery || '/admin/shop/order/query' }" name="product" label={ 'Search by Name' } data={ { 'value' : null } }>
            <option each={ order, i in opts.data.value || [] } selected="true" value={ order.id }>
              { order.id }
            </option>
          </eden-select>
          
        </div>

        <!-- Modal footer -->
        <div class="modal-footer">
          <button type="button" class="btn btn-success" onclick={ onSelectOrder }>Add Order</button>
          <button type="button" class="btn btn-danger" data-target="#modal-order" data-dismiss="modal">Close</button>
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
    this.action   = opts.orders ? Object.assign(opts.orders[0].actions.payment, { 'manual' : true }) : null;
    this.updates  = {};
    this.invoice  = opts.invoice;
    this.discount = (this.invoice || {}).discount || 0;
    this.colors   = {
      'paid'     : 'success',
      'sent'     : 'primary',
      'partial'  : 'warning',
      'unpaid'   : 'danger',
      'pending'  : 'info',
      'approval' : 'warning',
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
      e.item.line.price = parseFloat((e.target.innerText || '').replace(/[^\d.-]/g, ''));
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
      e.item.line.qty = parseInt((e.target.innerText || '').replace(/[^\d.-]/g, ''));
      e.item.line.total = e.item.line.price * e.item.line.qty;

      // remove on 0
      if (!e.item.line.qty) return this.onRemoveLine(e);

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
      this.discount = parseFloat((e.target.innerText || '').replace(/[^\d.-]/g, ''));

      // update
      this.update();
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
      if (!jQuery(this.refs.product).is('.show')) jQuery(this.refs.product).modal('show');
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
     * on save
     *
     * @param  {Event} e
     */
    onOrder(e) {
      // prevent default
      e.preventDefault();
      e.stopPropagation();

      // show modal
      if (!jQuery(this.refs.order).is('.show')) jQuery(this.refs.order).modal('show');
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
      this.updates.company = !this.updates.company;

      // update
      this.update();
    }

    /**
     * on remove line
     *
     * @param  {Event} e
     */
    onRemoveLine(e) {
      // prevent default
      e.preventDefault();
      e.stopPropagation();
      
      // get target
      const target = jQuery(e.target).is('button') ? jQuery(e.target) : jQuery(e.target).closest('button');

      // get order
      const order = opts.orders.find(o => o.id === (e.item.line.order || target.attr('data-order')));
      
      // splice out
      order.lines.splice(e.item.i, 1);

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
     * on select order
     *
     * @param  {Event}  e
     *
     * @return {Promise}
     */
    async onSelectOrder(e) {
      // get product
      const orderID = this.refs['select-order'].val();

      // loading product
      this.loading('order', true);
      
      // set orders
      if (!opts.orders) opts.orders = [];
      
      // set order
      const order = (await eden.router.get(`/admin/shop/order/${orderID}/get`)).result;
      
      // set order id
      order.lines.forEach(l => l.order = order.id);

      // get product
      opts.orders.push(order);

      // loading product
      this.loading('order', false);
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
      const result = (await eden.router.post(opts.submit || `/admin/shop/invoice/${this.invoice.id}/update`, {
        id       : this.invoice.id,
        note     : this.invoice.note,
        lines    : [].concat(...(opts.orders.map((order) => order.lines))),
        discount : this.discount,
      }));
      const orders  = result.orders || result.result;
      const invoice = result.invoice || null;

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
      
      // set to invoice
      if (invoice) {
        // loop keys
        for (const key in invoice) {
          // set value
          this.invoice[key] = invoice[key];
        }
      }
      
      // on save
      if (opts.onSave) opts.onSave(this.invoice, opts.orders);

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
      return (((opts.orders || []).find(o => o.id === line.order) || (opts.orders || [])[0]).products || []).find(p => p.id === line.product) || {};
    }

    /**
     * get subtotal
     *
     * @return {*}
     */
    getSubtotal() {
      // reduce lines
      return (opts.orders || []).reduce((subtotal, order) => {
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
      
      // fix lines
      (opts.orders || []).forEach((order) => {
        // check lines
        order.lines.forEach((line) => {
          // add order
          line.order = line.order || order.id;
        });
      });

      // update
      this.update();
    });
  </script>
</invoice-update>
