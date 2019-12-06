<invoice-admin-remove-page>
  <div class="page page-shop">

    <admin-header title="Remove Invoice">
      <yield to="right">
        <a href="/admin/shop/invoice" class="btn btn-lg btn-primary">
          Back
        </a>
      </yield>
    </admin-header>

    <div class="container-fluid">

      <form method="post" action="/admin/shop/invoice/{ opts.invoice.id }/remove">
        <div class="card">
          <div class="card-body">
            <p>
              Are you sure you want to delete <b>{ opts.invoice.id }</b>?
            </p>
          </div>
          <div class="card-footer">
            <button type="submit" class="btn btn-primary">Submit</button>
          </div>
        </div>
      </form>

    </div>
  </div>
  <script>
  // on update
  this.on('update', () => {
    // check frontend
    if (!this.eden.frontend) return;
    var queryString = location.search;
    console.log(queryString);
  });

  // on mount
  this.on('mount', () => {
    // check frontend
    if (!this.eden.frontend) return;

    // update
    this.update();
  });
  </script>
</invoice-admin-remove-page>
