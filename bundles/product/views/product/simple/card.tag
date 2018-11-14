<product-simple-card>

  <figure class="card card-product">
    <a href="/product/{ opts.product.slug }">
      <img class="card-img-top img-fluid" itemprop="image" src={ this.media.url(opts.product.images[0], '3x-sq') } alt={ opts.product.title[this.language] }>
    </a>
		<figcaption class="card-body product-info">
			<h4 class="title">
        <a href="/product/{ opts.product.slug }" class="text-body" itemprop="name" title={ opts.product.title[this.language] }>
          { opts.product.title[this.language] }
        </a>
        <span class="float-right" itemprop="offers" itemscope itemtype="http://schema.org/Offer" data-is="product-{ opts.product.type }-price" product={ opts.product } />
      </h4>
      <p class="desc m-0" itemprop="description">
        { opts.product.short[this.language] }
      </p>
		</figcaption>
    <div class="card-body card-categories" if={ (opts.product.categories || []).length }>
      <a class="badge badge-success mr-2" itemprop="category" each={ category, i in opts.product.categories } href="/{ category.slug }">{ category.title[this.language] }</a>
    </div>
		<div class="card-footer">
      <div class="row row-eq-height">
        <div class="col-md-6 d-flex align-items-center">
          <div class="w-100">
            <a href="/product/{ opts.product.slug }">
              <span class="m-0" itemprop="offers" itemscope itemtype="http://schema.org/Offer" data-is="product-{ opts.product.type }-price" product={ opts.product } />
            </a>
          </div>
        </div>
        <div class="col-md-6 text-right d-flex align-items-center">
          <div class="w-100">
      			<a href="/product/{ opts.product.slug }" class="btn btn-sm btn-primary">
              Order Now
            </a>
          </div>
        </div>
      </div>
		</div>
	</figure>

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
</product-simple-card>
