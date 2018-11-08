<payment-admin-remove-page>
  <!-- product title -->
  <page-title title="Remove Payment" description="Remove Payment { opts.payment.id }" />
  <!-- / product title -->

  <form method="post" action="/admin/payment/{ opts.payment.id }/remove">
    <div class="card">
      <div class="card-body">
        <p>
          Are you sure you want to delete <b>{ opts.payment.id }</b>?
        </p>
      </div>
      <div class="card-footer">
        <button type="submit" class="btn btn-primary">Submit</button>
      </div>
    </div>
  </form>
</payment-admin-remove-page>
