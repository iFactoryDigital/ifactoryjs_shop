<product-admin-page>

  <!-- product title -->
  <page-title title="Manage Products" description="Create, update and manage products">
    <yield to="right">
      <a href="/admin/product/create" class="btn btn-lg btn-success">Create Product</a>
    </yield>
  </page-title>
  <!-- / product title -->

  <div class="payment-admin">
    <grid grid={ opts.grid } table-class="table table-sm table-striped table-bordered" title="All Products" />
  </div>
</product-admin-page>
