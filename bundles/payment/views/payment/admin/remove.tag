<payment-admin-remove-page>
  <div class="page page-shop">

    <admin-header title="Remove Payment">
      <yield to="right">
        <a href="/admin/shop/payment" class="btn btn-lg btn-primary">
          Back
        </a>
      </yield>
    </admin-header>

    <div class="container-fluid">

      <form method="post" action="/admin/shop/payment/{ opts.payment.id }/remove">
        <div class="card">
          <div class="card-body">
            <p>
              Are you sure you want to delete <b>{ opts.payment.id }</b>?
            </p>
          </div>
          <div class="card-footer">
            <button type="submit" class="btn btn-primary">Submit</button>
          </div>
        </div>
      </form>

    </div>
  </div>
</payment-admin-remove-page>
