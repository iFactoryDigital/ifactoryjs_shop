<order-admin-remove-page>
  <!-- product title -->
  <page-title title="Remove Order" description="Remove Existing Order" />
  <!-- / product title -->

  <form method="post" action="/admin/order/{ opts.order.id }/remove">
    <div class="card">
      <div class="card-body">
        <p>
          Are you sure you want to delete <b>{ opts.order.id }</b>?
        </p>
      </div>
      <div class="card-footer">
        <button type="submit" class="btn btn-primary">Submit</button>
      </div>
    </div>
  </form>
</order-admin-remove-page>
