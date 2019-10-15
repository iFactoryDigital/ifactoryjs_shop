<order-admin-cancel-page>
  <div class="page page-shop">

    <admin-header title="Cancel Order">
      <yield to="right">
        <a href="/admin/shop/order" class="btn btn-lg btn-primary">
          Back
        </a>
      </yield>
    </admin-header>

    <div class="container-fluid">

      <form method="post" action="/admin/shop/order/{ opts.order.id }/cancel">
        <div class="card">
          <div class="card-body">
            <p>
              Are you sure you want to cancel <b>{ opts.order.id }</b>?
            </p>
          </div>
          <div class="card-footer">
            <button type="submit" class="btn btn-primary">Submit</button>
          </div>
        </div>
      </form>

    </div>
  </div>
</order-admin-cancel-page>
