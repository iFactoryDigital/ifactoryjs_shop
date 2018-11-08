<payment-admin-update-page>
  <!-- product title -->
  <page-title description="Admin Update Payment" />
  <!-- / product title -->

  <form method="post" action="/admin/payment/{ opts.payment && opts.payment.id ? (opts.payment.id + '/update') : 'create' }">
    <div class="card">
      <div class="card-header">
        <strong>{ opts.payment && opts.payment.id ? 'Update' : 'Add' } Payment</strong>
        <p class="mb-0">{ opts.payment.username || opts.payment.email || '' }</p>
      </div>
      <div class="card-body">
        TODO admin payment edit
      </div>
      <div class="card-footer">
        <button type="submit" class="btn btn-primary">Submit</button>
      </div>
    </div>
  </form>

  <script>

  </script>
</payment-admin-update-page>
