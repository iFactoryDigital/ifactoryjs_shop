<category-admin-update-page>
  <div class="page page-shop">

    <admin-header title="{ opts.category.id ? 'Update' : 'Create' } Category">
      <yield to="right">
        <a href="/admin/shop/category" class="btn btn-lg btn-primary">
          Back
        </a>
      </yield>
    </admin-header>
    
    <div class="container-fluid">
      <form method="post" action="/admin/shop/category/{ opts.category.id ? (opts.category.id + '/update') : 'create' }">
        <div class="card mb-3">
          <div class="card-header">
            Category Information
          </div>
          <div class="card-body">
            <div class="btn-group mb-3">
              <virtual each={ lng, i in this.languages }>
                <a class={ 'btn btn-primary' : true, 'btn-success' : this.language === lng } href="#!" onclick={ onLanguage }>{ lng }</a>
              </virtual>
            </div>
            <div class="form-group" each={ lng, i in this.languages } hide={ this.language !== lng }>
              <label for="title">Category Title ({ lng })</label>
              <input type="text" name="title[{ lng }]" class="form-control" id="title" aria-describedby="title" placeholder="Enter title" value={ (category ().title || {})[lng] }>
              <small id="title" class="form-text text-muted">This will be slugified (eng) for the category URL.</small>
            </div>
            <div class="form-group">
              <label for="active">Active</label>
              <select class="form-control" name="active" id="active">
                <option value="true" selected={ opts.category.active }>Active</option>
                <option value="false" selected={ !opts.category.active }>Inactive</option>
              </select>
            </div>
            <category-select label="Parent" name="parent" multi="false" values={ opts.category.parent } />
            <div class="form-group">
              <label for="promoted">Promoted</label>
              <select class="form-control" name="promoted" id="promoted">
                <option value="true" selected={ opts.category.promoted }>Yes</option>
                <option value="false" selected={ !opts.category.promoted }>No</option>
              </select>
            </div>
            <div class="form-group">
              <label for="adult">Adult</label>
              <select class="form-control" name="adult" id="adult">
                <option value="true" selected={ opts.category.adult }>Yes</option>
                <option value="false" selected={ !opts.category.adult }>No</option>
              </select>
            </div>
            <div class="form-group" each={ lng, i in this.languages } hide={ this.language !== lng }>
              <label for="slug">Category Slug</label>
              <input type="text" id="slug" readonly class="form-control" value={ category ().slug }>
            </div>
            <div class="form-group" each={ lng, i in this.languages } hide={ this.language !== lng }>
              <label for="short">Short Description ({ lng })</label>
              <textarea class="form-control" name="short[{ lng }]" id="short" rows="3">{ (category ().short || {})[lng] }</textarea>
            </div>
            <div class="form-group" each={ lng, i in this.languages } hide={ this.language !== lng }>
              <label for="short">Long Description ({ lng })</label>
              <markdown-editor name="description[{ lng }]" label="Description ({ lng })" content={ (category ().description || {})[lng] } />
            </div>
          </div>
        </div>
        <div class="card mb-3">
          <div class="card-header">
            Category Images
          </div>
          <div class="card-body">
            <upload name="images" label="Images" multi={ true } image={ opts.category.images } />
          </div>
        </div>
        <button type="submit" class="btn btn-lg btn-success">Submit</button>
      </form>
    </div>
  </div>

  <script>
    // do mixins
    this.mixin ('i18n');

    // load data
    this.language  = this.i18n.lang ();
    this.languages = this.eden.get ('i18n').lngs || [];

    // check has language
    if (this.languages.indexOf (this.i18n.lang ()) === -1) this.languages.unshift (this.i18n.lang ());

    /**
     * on language
     *
     * @param  {Event} e
     */
    onLanguage (e) {
      // set language
      this.language = e.item.lng;

      // update view
      this.update ();
    }

    /**
     * get category
     *
     * @return {Object}
     */
    category () {
      // return category
      return opts.category;
    }

    /**
     * on language update function
     */
    this.on ('update', () => {
      // set language
      this.language = this.i18n.lang ();
    });

  </script>
</category-admin-update-page>
