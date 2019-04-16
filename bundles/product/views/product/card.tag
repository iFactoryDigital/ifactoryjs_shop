<product-card>

  <figure class="card card-product card-product-{ opts.product.type }">
    <div class="card-product-admin" if={ this.acl.validate('admin') }>
      <div class="btn-group">
        <a href="/admin/shop/product/{ opts.product.id }/update" class="btn btn-info">
          <i class="fa fa-pencil" />
        </a>
        <a href="/admin/shop/product/{ opts.product.id }/remove" class="btn btn-danger">
          <i class="fa fa-times" />
        </a>
      </div>
    </div>
    <a href="/product/{ opts.product.slug }">
      <div class="card-shadow" />
      <div class="card-product-image">
        <div class="card-button">
          <button class="btn btn-lg btn-primary">
            View Product
          </button>
        </div>
        <img class="card-img-top img-fluid" itemprop="image" src={ this.media.url(opts.product.images[0], '3x-sq') } alt={ opts.product.title[this.i18n.lang()] }>
      </div>
      <figcaption class="card-body product-info">
        <h2 class="card-product-title h5">
          <span class="text-body" itemprop="name" title={ opts.product.title[this.i18n.lang()] }>
            { opts.product.title[this.i18n.lang()] }
          </span>
          <span class="float-right text-primary" itemprop="offers" itemscope itemtype="http://schema.org/Offer" data-is="product-{ opts.product.type }-price" product={ opts.product } />
        </h2>
        <p class="text-muted m-0" itemprop="description">
          { opts.product.short[this.i18n.lang()] }
        </p>
      </figcaption>
    </a>
  </figure>

  <script>
    // load mixins
    this.mixin('acl');
    this.mixin('cart');
    this.mixin('i18n');
    this.mixin('media');

    /**
     * on language update function
     */
    this.on('mount', () => {
      
    });

  </script>
</product-card>
