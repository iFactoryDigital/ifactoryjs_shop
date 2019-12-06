<invoice-admin-update-page>

  <div class="page page-shop">
    <admin-header title="{ opts.invoice.id ? 'Update' : 'Create' } Invoice" invoice={ opts.invoice } loading={ this.loading } on-email={ onEmail } on-pdf={ onPdf } back={ this.back ? this.back : '' }>
      <yield to="right">
        <a class={ 'btn btn-lg btn-info mr-2' : true, 'disabled' : !opts.invoice } href="/admin/shop/invoice/{ (opts.invoice || {}).id }/view{ opts.back ? '?back='+opts.back : ''}" disabled={ !opts.invoice }>
          View Invoice
        </a>
        <a class={ 'btn btn-lg btn-info mr-2' : true, 'disabled' : !opts.invoice } href="/admin/shop/invoice/{ (opts.invoice || {}).id }/print{ opts.back ? '?back='+opts.back : ''}" disabled={ !opts.invoice }>
          Print Invoice
        </a>
        <button class={ 'btn btn-lg btn-info mr-2' : true, 'disabled' : opts.loading() } onclick={ opts.onPdf } disabled={ opts.loading() }>
          { opts.loading('pdf') ? 'Create PDF...' : 'Download PDF' }
        </button>
        <button class={ 'btn btn-lg btn-info mr-2' : true, 'disabled' : opts.loading() } onclick={ opts.onEmail } disabled={ opts.loading() }>
          { opts.loading('email') ? 'Emailing...' : 'Email Invoice' }
        </button>
        <a href={ opts.back ? opts.back : '/admin/shop/invoice' } class="btn btn-lg btn-primary">
        Back
        </a>
      </yield>
    </admin-header>

    <div class="container">
      <invoice-update invoice={ opts.invoice } orders={ opts.orders } invoices={ opts.invoices }/>
    </div>

    <invoice-admin-payment invoice={ opts.invoice } loading={ this.loading } orders={ opts.orders } grid={ opts.grid } />
    <div class="downloadProject"></div>
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
          <div class="form-group">
            <label for="email-email">
              Email Address
            </label>
            <input class="form-control" type="email" name="email" ref="email-email" id="email-email" />
          </div>
          <div class="form-group">
            <label for="email-body">
              Email Body
            </label>
            <textarea class="form-control" name="body" ref="email-body" id="email-body" />
          </div>
        </div>

        <!-- Modal footer -->
        <div class="modal-footer">
          <button type="button" class={ 'btn btn-success' : true, 'disabled' : this.loading() } disabled={ this.loading() } onclick={ onEmailSend }>
            { this.loading('email') ? 'Emailing...' : 'Submit' }
          </button>
          <button type="button" class={ 'btn btn-danger' : true, 'disabled' : this.loading() } data-dismiss="modal" disabled={ this.loading() }>
            Close
          </button>
        </div>

      </div>
    </div>
  </div>

  <script>
    // do mixin
    this.mixin('i18n');
    this.mixin('loading');
    this.mixin('config');

    const q = require('querystring');
    this.back = '';

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
      if (!jQuery(this.refs.email).is('.show')) jQuery(this.refs.email).modal('show');
    }

    /**
     * on select product
     *
     * @param  {Event} e
     */
    async onEmailSend(e) {
      // prevent default
      e.preventDefault();
      e.stopPropagation();

      // loading product
      this.loading('email', true);

      // get product
      const result = (await eden.router.post(`/admin/shop/invoice/${opts.invoice.id}/email`, {
        body  : this.refs['email-body'].value || '',
        email : this.refs['email-email'].value || '',
      })).result;

      // loading product
      this.loading('email', false);
    }

    /**
     * on select product
     *
     * @param  {Event} e
     */
    async onPdf(e) {
      // prevent default
      e.preventDefault();
      e.stopPropagation();

      // loading product
      this.loading('pdf', true);

      // get product
      const result = (await eden.router.post(`/admin/shop/invoice/${opts.invoice.id}/pdf`, {
        body  : this.refs['email-body'].value || '',
      }));

      if (result.success) {
        const url = `//${this.config.domain}${result.result.url}`;

        var a = document.createElement('a');
        a.setAttribute('href', url);
        a.setAttribute('download', `${opts.invoice.invoiceno ? opts.invoice.invoiceno : opts.invoice.id}.pdf`);

        var aj = jQuery(a);
        aj.appendTo('body');
        aj[0].click();
        aj.remove();
      }

      // loading product
      this.loading('pdf', false);
    }

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
</invoice-admin-update-page>
