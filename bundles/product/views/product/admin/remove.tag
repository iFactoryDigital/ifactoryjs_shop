<product-admin-remove-page>

  <!-- product title -->
  <page-title description="Confirm Removing Product" />
  <!-- / product title -->

  <form method="post" action="/admin/product/{ opts.product.id }/remove">
    <div class="card mb-3">
      <div class="card-header">
        Remove Product
      </div>
      <div class="card-body">
        Are you sure you want to delete <b>{ opts.product.title[this.language] }</b>?
      </div>
    </div>
    <button type="submit" class="btn btn-lg btn-success">Submit</button>
  </form>

  <script>
    // do mixins
    this.mixin ('i18n');

    // load data
    this.language = this.i18n.lang ();

  </script>
</product-admin-remove-page>
