<product-variable-card>
  <div class={ 'card card-product mb-3' : true }>
    <div class="text-center card-body" if={ opts.product.images && opts.product.images[0] }>
      <a href="/product/{ opts.product.slug }">
        <img class="card-img-top img-fluid" itemprop="image" src={ this.media.url (opts.product.images[0], 'md-sq') } alt={ opts.product.title[this.language] }>
      </a>
    </div>
    <button class="btn btn-tag btn-sm btn-success">
      <span itemprop="offers" itemscope itemtype="http://schema.org/Offer" data-is="product-{ opts.product.type }-price" product={ opts.product } />
    </button>
    <button class="btn btn-tag btn-tag-left btn-sm btn-info" if={ this.cart.line (opts.product) }>
      { this.t ('cart.in') }
    </button>
    <div class="card-footer">
      <div class="card-title card-product-title mt-0 mb-2">
        <h6 class="text-overflow">
          <a href="/product/{ opts.product.slug }" class="text-body" itemprop="name" title={ opts.product.title[this.language] }>{ opts.product.title[this.language] }</a>
        </h6>
      </div>
      <div class="card-categories text-overflow mb-3" if={ false }>
        <a class="badge badge-success mr-2" itemprop="category" each={ category, i in opts.product.categories } href="/{ category.slug }">{ category.title[this.language] }</a>
      </div>
      <p class="card-text" itemprop="description">
        { opts.product.short[this.language] }
      </p>
    </div>
  </div>

  <script>
    // load mixins
    this.mixin ('cart');
    this.mixin ('i18n');
    this.mixin ('media');

    // set variables
    this.language = this.i18n.lang ();

    /**
     * on add function
     *
     * @param  {Event} e
     */
    onAdd (e) {
      // prevent default
      e.preventDefault ();

      // get product
      this.cart.add (opts.product);
    }

    /**
     * on remove function
     *
     * @param  {Event} e
     */
    onRemove (e) {
      // prevent default
      e.preventDefault ();

      // get product
      this.cart.remove (this.cart.line (opts.product));
    }

    /**
     * on language update function
     */
    this.on ('update', () => {
      // set language
      this.language = this.i18n.lang ();
    });

  </script>
</product-variable-card>
