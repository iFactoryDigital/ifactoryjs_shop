<product-admin-page>
  <div class="page page-shop">

    <admin-header title="Manage Products">
      <yield to="right">
        <a href="/admin/shop/product/create" class="btn btn-lg btn-success">
          Create
        </a>
      </yield>
    </admin-header>

    <div class="container-fluid">

      <grid grid={ opts.grid } title="All Products" rows-class="row row-eq-height" />

    </div>
  </div>
</product-admin-page>
