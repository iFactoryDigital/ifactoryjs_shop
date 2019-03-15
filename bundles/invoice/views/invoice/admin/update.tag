<invoice-admin-update-page>
  <div class="page page-shop">

    <admin-header title="{ opts.invoice.id ? 'Update' : 'Create' } Invoice">
      <yield to="right">
        <a href="/admin/shop/invoice" class="btn btn-lg btn-primary">
          Back
        </a>
      </yield>
    </admin-header>
    
    <div class="container-fluid">
    
      <form method="post" action="/admin/shop/invoice/{ opts.invoice && opts.invoice.id ? (opts.invoice.id + '/update') : 'create' }">
        <div class="card">
          <div class="card-header">
            <strong>{ opts.invoice && opts.invoice.id ? 'Update' : 'Add' } Invoice</strong>
            <p class="mb-0">{ opts.invoice.username || opts.invoice.email || '' }</p>
          </div>
          <div class="card-body">
            <div class="form-group">
              <label>
                Invoice Status
              </label>
              <select class="form-control">
                <option value="paid" selected={ opts.invoice.complete }>Paid</option>
                <option value="unpaid" selected={ !opts.invoice.complete }>Unpaid</option>
              </select>
            </div>
          </div>
          <div class="card-footer">
            <button type="submit" class="btn btn-primary">Submit</button>
          </div>
        </div>
      </form>
    
    </div>
  </div>
</invoice-admin-update-page>
