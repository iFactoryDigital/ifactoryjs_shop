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
    
      <grid grid={ opts.grid } table-class="table table-sm table-striped table-bordered" title="Payments Grid" />
    
    </div>
  </div>
</payment-admin-page>
