<order-admin-payment>
  <div class="modal fade" id="modal-payment" ref="payment">
    <div class="modal-dialog modal-lg">
      <div class="modal-content">

        <div class="modal-header">
          <h4 class="modal-title">
            Record Payment
          </h4>
          <button type="button" class="close" data-dismiss="modal">&times;</button>
        </div>

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
                <validate label="Method" required min-length={ 2 } name="method" type="select" options={ [{ label : 'Cash', value : 'cash' }, { label : 'Bank Deposit', value : 'bank' }] } ref="method" />
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class={ 'btn btn-danger mr-2' : true, 'disabled' : this.loading('payment') } disabled={ this.loading('payment') } data-dismiss="modal">Close</button>
          <button type="button" class={ 'btn btn-success' : true, 'disabled' : this.loading('payment') } disabled={ this.loading('payment') } onclick={ onSubmitPayment }>
            Submit { this.payment === 'normal' ? 'Normal' : 'Manual' } Payment
          </button>
        </div>

      </div>
    </div>
  </div>

  <script>
    // set loading
    this.loading = opts.loading;
    this.invoice = opts.invoice;

    // set initial discount
    this.action  = Object.assign(opts.order.actions.payment, { 'manual' : true });
    this.payment = 'normal';

    /**
     * on save
     */
    async show() {
      // show modal
      jQuery(this.refs.payment).modal('show');
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
      if (!jQuery(this.refs.payment).is('.show')) jQuery(this.refs.payment).modal('show');
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
      const result = (await eden.router.post(`/admin/shop/invoice/${this.invoice ? this.invoice.id : 'create'}/payment/create`, {
        type     : this.payment,
        orders   : [opts.order.id],
        action   : this.action,
        method   : (this.refs.method || {}).value,
        amount   : parseFloat(this.refs.amount.value),
        details  : this.refs.details.value,
        currency : this.eden.get('shop.currency'),
      }));

      // success
      if (result.success) {
        // set invoice
        if (!this.invoice) this.invoice = result.invoice;
        
        // set invoice
        for (let key in result.invoice) {
          // update invoice
          this.invoice[key] = result.invoice[key];
        }

        // go redirect
        if ((result.result.data || {}).redirect) eden.router.go((result.result.data || {}).redirect);

        // show modal
        jQuery(this.refs.payment).modal('hide');
        
        // on update
        if (opts.onUpdate) opts.onUpdate(result);
      }

      // set saving
      this.loading('payment', false);
    }

  </script>
</order-admin-payment>
