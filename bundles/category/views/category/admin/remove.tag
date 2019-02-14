<category-admin-remove-page>
  <div class="page page-shop">

    <admin-header title="Remove Category '{ opts.category.title[this.language] }'">
      <yield to="right">
        <a href="/admin/shop/category" class="btn btn-lg btn-primary">
          Back
        </a>
      </yield>
    </admin-header>
    
    <div class="container-fluid">
    
      <form method="post" action="/admin/shop/category/{ opts.category.id }/remove">
        <div class="card mb-3">
          <div class="card-body">
            <p>
              Are you sure you want to delete <b>{ opts.category.title[this.language] }</b>?
            </p>
          </div>
        </div>
        <button type="submit" class="btn btn-lg btn-success">Submit</button>
      </form>
    
    </div>
  </div>
  
  <script>
    // do mixins
    this.mixin('i18n');

    // load data
    this.language = this.i18n.lang();

  </script>
</category-admin-remove-page>
