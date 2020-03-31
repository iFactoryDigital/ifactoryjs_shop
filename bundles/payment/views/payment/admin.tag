<payment-admin-page>
  <div class="page page-shop">

    <admin-header title="Manage Payments">
      <yield to="right">
        <a href="/admin/shop" class="btn btn-lg btn-primary">
          Back
        </a>
      </yield>
    </admin-header>

    <div class="container-fluid">

      <grid grid={ opts.grid } table-class="table table-striped table-bordered" title="Payments Grid" />

    </div>
  </div>
  <div class="modal fade" ref="remove-transaction-modal">
    <div class="modal-dialog modal-lg">
      <div class="modal-content">

        <!-- Modal Header -->
        <div class="modal-header">
          <h4 class="modal-title">
            Remove Transaction
          </h4>
          <button type="button" class="close" data-dismiss="modal">&times;</button>
        </div>

        <!-- Modal body -->
        <div class="modal-body">
          <div class="container">
            <div class="row mb-2">
              Are you sure you want to remove this transaction? This will only take the payment off the order/invoice, the payment will still be on the users account
            </div>
          </div>
        </div>

        <!-- Modal footer -->
        <div class="modal-footer">
          <button type="button" class="btn btn-danger" data-dismiss="modal">Close</button>
          <button type="button" class="btn btn-verify" data-dismiss="modal" onclick={ saveRemoveTransaction }>Remove</button>
        </div>

      </div>
    </div>
  </div>
  <script>
  // Add mixins
  this.mixin('i18n');
  this.mixin('grid');
  this.mixin('model');

  let paymentid = '';
  let invoiceid = '';

  async onRemoveTransaction(e) {
    // prevent default
    e.preventDefault();
    e.stopPropagation();

    paymentid = '';
    invoiceid = '';
    paymentid = jQuery(e.target).attr('payment-id');
    invoiceid = jQuery(e.target).attr('invoice-id');

    // show modal
    jQuery(this.refs['remove-transaction-modal']).modal('show');
  }

  async saveRemoveTransaction(e) {
    // prevent default
    e.preventDefault();
    e.stopPropagation();

    const result = (await eden.router.post(`/admin/shop/invoice/${invoiceid}/${paymentid}/removetransaction`, {}));
    // show modal
    jQuery(this.refs['remove-transaction-modal']).modal('hide');
    this.grid.update();
  }

  /**
   * on mount function
   */
  this.on('mount', () => {
    // check frontend
    if (!this.eden.frontend) return;

    // add click function
    jQuery(document).off('click', '[data-type]', this.onRemoveTransaction);

    // add click function
    jQuery(document).on('click', '[data-type]', this.onRemoveTransaction);
  });

  /**
   * on mount function
   */
  this.on('unmount', () => {
    // check frontend
    if (!this.eden.frontend) return;

    // add click function
    jQuery(document).off('click', '[data-type]', this.onRemoveTransaction);
  });
  </script>
</payment-admin-page>
