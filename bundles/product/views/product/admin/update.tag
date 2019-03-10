<product-admin-update-page>
  <div class="page page-shop">
    <form method="post" action="/admin/shop/product/{ opts.product.id ? (opts.product.id + '/update') : 'create' }">

      <admin-header title="{ this.product.id ? 'Update' : 'Create' } Product" preview={ this.preview } on-preview={ onPreview }>
        <yield to="right">
          <button class={ 'btn btn-lg mr-3' : true, 'btn-success' : this.parent.promoted, 'btn-danger' : !this.parent.promoted } onclick={ this.parent.togglePromoted }>
            { this.parent.promoted ? 'Promoted' : 'Unpromoted' }
          </button>
          <button class={ 'btn btn-lg mr-3' : true, 'btn-success' : this.parent.published, 'btn-danger' : !this.parent.published } onclick={ this.parent.togglePublish }>
            { this.parent.published ? 'Published' : 'Unpublished' }
          </button>
          <button class={ 'btn btn-lg mr-3' : true, 'btn-primary' : opts.preview, 'btn-info' : !opts.preview } onclick={ opts.onPreview }>
            { opts.preview ? 'Alter Form' : 'Finish Altering' }
          </button>
          <button class="btn btn-lg btn-success" type="submit">
            <i class="fa fa-save mr-2" />
            Save
          </button>
        </yield>
      </admin-header>
      
      <div class="container-fluid mb-4">
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
                    <option each={ type, i in opts.types } value={ type.type } selected={ isType(type) }>{ this.t('product:' + type.type + '.title') }</option>
                  </select>
                </div>
              </div>
            </div>
            <!-- /product type -->
              
            <!-- product options -->
            <div each={ option, i in this.type.opts.options || [] } data-is="product-{ option }" product={ this.product } type={ this.type } form={ opts.form } fields={ opts.fields } preview={ this.preview } />
            <!-- product options -->
          </div>

          <div class="col col-lg-8">
            
            <!-- product sections -->
            <div each={ section, i in this.type.opts.sections || [] } data-is="product-{ section }" product={ this.product } type={ this.type } form={ opts.form } fields={ opts.fields } preview={ this.preview } />
            <!-- product sections -->
            
          </div>
        </div>
        <!-- / product information -->
        
      </div>
      
      <div class="jumbotron py-4 text-right m-0">
        <button class={ 'btn btn-lg mr-3' : true, 'btn-success' : promoted, 'btn-danger' : !promoted } onclick={ togglePromoted }>
          { promoted ? 'Promoted' : 'Unpromoted' }
        </button>
        <button class={ 'btn btn-lg mr-3' : true, 'btn-success' : published, 'btn-danger' : !published } onclick={ togglePublish }>
          { published ? 'Published' : 'Unpublished' }
        </button>
        <button class="btn btn-lg btn-success" type="submit">
          <i class="fa fa-save mr-2" />
          Save
        </button>
      </div>
    </form>
  </div>

  <script>
    // do mixins
    this.mixin('i18n');

    // set product
    this.product = opts.product;

    // load data
    this.type      = this.product.type ? opts.types.find((t) => t.type === this.product.type) : opts.types[0];
    this.preview   = true;
    this.promoted  = this.product.promoted;
    this.published = this.product.published;
    
    /**
     * on preview
     *
     * @param  {Event} e
     *
     * @return {*}
     */
    onPreview (e) {
      // prevent default
      e.preventDefault();
      e.stopPropagation();
      
      // set loading
      this.preview = !this.preview;
      
      // update view
      this.update();
    }

    /**
     * on description update
     */
    onDescription () {
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
      this.type = opts.types.find(t => t.type === e.target.value);
      
      // set opts
      const o = this.type.opts;
      
      // set opts
      this.type.opts = {};

      // update view
      this.update();
      
      // reset opts
      this.type.opts = o;

      // update view
      this.update();
    }

    /**
     * set Publish
     *
     * @param  {Event} e
     */
    togglePublish (e) {
      // prevent default
      e.preventDefault();

      // set publish
      this.published = !this.published;

      // update view
      this.update();
    }

    /**
     * toggle promoted
     *
     * @param  {Event} e
     */
    togglePromoted (e) {
      // prevent default
      e.preventDefault();

      // set publish
      this.promoted = !this.promoted;

      // update view
      this.update();
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
      return (this.product.categories || []).map((category) => {
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
      return this.type.type === type.type;
    }

    /**
     * on mount function
     */
    this.on('mount', () => {
      // check frontend
      if (!this.eden.frontend) return;

      // set product
      this.product = opts.product;

    });

  </script>
</product-admin-update-page>
