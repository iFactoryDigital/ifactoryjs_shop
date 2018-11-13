<payment-admin-update-page>
  <div class="page page-shop">

    <admin-header title="{ opts.payment.id ? 'Update' : 'Create' } Payment">
      <yield to="right">
        <a href="/admin/payment" class="btn btn-lg btn-primary">
          Back
        </a>
      </yield>
    </admin-header>
    
    <div class="container-fluid">
    
      <form method="post" action="/admin/payment/{ opts.payment && opts.payment.id ? (opts.payment.id + '/update') : 'create' }">
        <div class="card">
          <div class="card-header">
            <strong>{ opts.payment && opts.payment.id ? 'Update' : 'Add' } Payment</strong>
            <p class="mb-0">{ opts.payment.username || opts.payment.email || '' }</p>
          </div>
          <div class="card-body">
            TODO admin payment edit
          </div>
          <div class="card-footer">
            <button type="submit" class="btn btn-primary">Submit</button>
          </div>
        </div>
      </form>
    
    </div>
  </div>
</payment-admin-update-page>
