<category-admin-page>
  <!-- product title -->
  <page-title description="Manage Product Categories">
    <yield to="right">
      <a href="/admin/category/create" class="btn btn-lg btn-success">
        Create Category
      </a>
    </yield>
  </page-title>

  <grid grid={ opts.grid } table-class="table table-sm table-striped table-bordered" title="Categories Grid" />
</category-admin-page>
