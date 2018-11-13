<category-admin-page>
  <div class="page page-shop">

    <admin-header title="Manage Product Categories">
      <yield to="right">
        <a href="/admin/category/create" class="btn btn-lg btn-success">
          Create Category
        </a>
      </yield>
    </admin-header>
    
    <div class="container-fluid">
    
      <grid grid={ opts.grid } table-class="table table-sm table-striped table-bordered" title="Categories Grid" />
    
    </div>
  </div>
</category-admin-page>
