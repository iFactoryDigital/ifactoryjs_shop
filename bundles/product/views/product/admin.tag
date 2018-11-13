<product-admin-page>
  <div class="page page-shop">
  
    <admin-header title="Manage Products">
      <yield to="right">
        <a href="/admin/product/create" class="btn btn-lg btn-success">
          Create
        </a>
      </yield>
    </admin-header>
    
    <div class="container-fluid">
    
      <grid grid={ opts.grid } table-class="table table-sm table-striped table-bordered" title="All Products" />
    
    </div>
  </div>
</product-admin-page>
