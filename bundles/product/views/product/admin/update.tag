<product-admin-update-page>
  <div class="page page-shop">

    <admin-header title="{ this.product.id ? 'Update' : 'Create' } Product">
      <yield to="right">
        <button class={ 'btn btn-lg mr-3' : true, 'btn-success' : this.parent.promoted, 'btn-danger' : !this.parent.promoted } onclick={ this.parent.togglePromoted }>
          { this.parent.promoted ? 'Promoted' : 'Unpromoted' }
        </button>
        <button class={ 'btn btn-lg mr-3' : true, 'btn-success' : this.parent.published, 'btn-danger' : !this.parent.published } onclick={ this.parent.togglePublish }>
          { this.parent.published ? 'Published' : 'Unpublished' }
        </button>
        <button class="btn btn-lg btn-success" type="submit">
          <i class="fa fa-save mr-2" />
          Save
        </button>
      </yield>
    </admin-header>
    
    <div class="container-fluid">
      <form method="post" action="/admin/product/{ opts.product.id ? (opts.product.id + '/update') : 'create' }">
        <!-- hidden inputs -->
        <input type="hidden" name="public" value={ this.public ? 'true' : 'false' } />
        <input type="hidden" name="promoted" value={ this.promoted ? 'true' : 'false' } />
        <input type="hidden" name="published" value={ this.published ? 'true' : 'false' } />
        <!-- / hidden inputs -->

        <!-- product information -->
        <div class="row">

          <div class="col-md-12 col-lg-4">

            <!-- product type -->
            <div class="card mb-3">
              <div class="card-header">
                Type
              </div>
              <div class="card-body">
                <div class="form-group">
                  <label for="sku">Product SKU</label>
                  <input type="text" name="sku" class="form-control" id="sku" aria-describedby="sku" placeholder="Enter sku" value={ this.product.sku }>
                </div>
                <div class="form-group">
                  <label for="type">Product Type</label>
                  <select class="form-control" name="type" id="type" onchange={ onType }>
                    <option each={ type, i in opts.types } value={ type } selected={ isType (type) }>{ type }</option>
                  </select>
                </div>
              </div>
            </div>
            <!-- /product type -->

            <!-- product organization -->
            <div class="card mb-3">
              <div class="card-header">
                Organization
              </div>
              <div class="card-body">
                <category-select name="categories" values={ categories () || [] } />
              </div>
            </div>
            <!-- / product organization -->

            <!-- product extra -->
            <div data-is="product-{ this.type }-extra" product={ this.product } />
            <!-- / product extra -->
          </div>

          <div class="col col-lg-8">

            <!-- product pricing -->
            <div data-is="product-{ this.type }-pricing" product={ this.product } />
            <!-- / product pricing -->

            <!-- product pricing -->
            <div data-is="product-{ this.type }-variation" product={ this.product } />
            <!-- / product pricing -->

            <!-- product display -->
            <div class="card mb-3">
              <div class="card-header">
                Display
              </div>
              <div class="card-body">
                <div class="btn-group mb-3">
                  <virtual each={ lng, i in this.languages }>
                    <a class={ 'btn btn-primary' : true, 'btn-success' : this.language === lng } href="#!" onclick={ onLanguage }>{ lng }</a>
                  </virtual>
                </div>
                <div class="form-group" each={ lng, i in this.languages } hide={ this.language !== lng }>
                  <label for="title">Title ({ lng })</label>
                  <input type="text" name="title[{ lng }]" class="form-control" id="title" aria-describedby="title" placeholder="Enter title" value={ (getProduct ().title || {})[lng] }>
                  <small id="title" class="form-text text-muted">This will be slugified (eng) for the product URL.</small>
                </div>
                <div class="form-group" each={ lng, i in this.languages } hide={ this.language !== lng }>
                  <label for="short">Short Description ({ lng })</label>
                  <textarea class="form-control" name="short[{ lng }]" id="short" rows="3">{ (getProduct ().short || {})[lng] }</textarea>
                </div>
                <div class="form-group" each={ lng, i in this.languages } hide={ this.language !== lng }>
                  <label for="short">Description ({ lng })</label>
                  <markdown-editor name="description[{ lng }]" ref="md-{ lng }" content={ (parent.getProduct ().description || {})[lng] } on-change={ onDescription } />
                </div>
              </div>
            </div>
            <!-- / product display -->

            <!-- product images -->
            <div class="card mb-3">
              <div class="card-header">
                Images
              </div>
              <div class="card-body">
                <upload name="images" label="Images" multi={ true } image={ this.product.images } />
              </div>
            </div>
            <!-- / product images -->

            <!-- product pricing -->
            <div data-is="product-{ this.type }-shipping" product={ this.product } />
            <!-- / product pricing -->

          </div>
        </div>
        <!-- / product information -->
      </form>
      
    </div>
  </div>

  <script>
    // do mixins
    this.mixin ('i18n');

    // set product
    this.product = opts.product;

    // load data
    this.type      = this.product.type || 'simple';
    this.promoted  = this.product.promoted;
    this.language  = this.i18n.lang ();
    this.published = this.product.published;
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
     * on description update
     */
    onDescription () {
      console.log (this.refs);
      // update descriptions
      for (let i = 0; i < this.languages.length; i++) {
        // set value
        this.product.description[this.languages[i]] = this.refs['md-' + this.languages[i]].value;
      }
    }

    /**
     * on type
     *
     * @param  {Event} e
     */
    onType (e) {
      // set type
      this.type = e.target.value;

      // update view
      this.update ();
    }

    /**
     * set Publish
     *
     * @param  {Event} e
     */
    togglePublish (e) {
      // prevent default
      e.preventDefault ();

      // set publish
      this.published = !this.published;

      // update view
      this.update ();
    }

    /**
     * toggle promoted
     *
     * @param  {Event} e
     */
    togglePromoted (e) {
      // prevent default
      e.preventDefault ();

      // set publish
      this.promoted = !this.promoted;

      // update view
      this.update ();
    }

    /**
     * get product
     *
     * @return {Object}
     */
    getProduct () {
      // return product
      return this.product;
    }

    /**
     * return categories
     *
     * @return {Array}
     */
    categories () {
      // return ids0
      return (this.product.categories || []).map ((category) => {
        // return category id
        return category.id;
      });
    }

    /**
     * returns true if this product type
     *
     * @param  {String}  type
     *
     * @return {Boolean}
     */
    isType (type) {
      // return true if type
      return this.type === type;
    }

    /**
     * on mount function
     */
    this.on ('mount', () => {
      // check frontend
      if (!this.eden.frontend) return;

      // set product
      this.product = opts.product;

    });

  </script>
</product-admin-update-page>
