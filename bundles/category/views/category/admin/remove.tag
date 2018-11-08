<category-admin-remove-page>
  <page-title description="Remove Category '{ opts.category.title[this.language] }'" />

  <form method="post" action="/admin/category/{ opts.category.id }/remove">
    <div class="card mb-3">
      <div class="card-body">
        <p>
          Are you sure you want to delete <b>{ opts.category.title[this.language] }</b>?
        </p>
      </div>
    </div>
    <button type="submit" class="btn btn-lg btn-success">Submit</button>
  </form>

  <script>
    // do mixins
    this.mixin ('i18n');

    // load data
    this.language = this.i18n.lang ();

  </script>
</category-admin-remove-page>
