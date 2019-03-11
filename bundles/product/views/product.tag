<product-page>
  <div class="container-product my-5" itemscope itemtype="http://schema.org/Product">
    <div class="row product-top mb-4">
      <div class="col-md-4 product-media" if={ this.thumbnail }>
        <div class="card card-product-image mb-3">
          <a class="card-body" href={ this.media.url(this.thumbnail) } target="_blank">
            <img class="img-fluid" itemprop="image" src={ this.media.url(this.thumbnail, 'md-sq') } alt={ title() }>
          </a>
        </div>
        <div class="row row-img-gallery mb-3">
          <a each={ image, i in opts.product.images } href="#!" class="col-4 mb-2" onclick={ onImage }>
            <div class="card py-2 px-2">
              <img class="img-fluid" src={ this.media.url(image, 'sm-sq') } alt={ title() }>
            </div>
          </a>
        </div>
      </div>
      <div class={ 'col-md-8' : this.thumbnail, 'col-md-12' : !this.thumbnail }>
        <div class="product-header">
          <h1 class="product-title mb-0">
            <div class="row">
              <div class="col-9">
                <div class="text-overflow" itemprop="name">{ opts.product.title[this.language] }</div>
              </div>
              <div class="col-3 text-right text-success">
                <small itemprop="offers" itemscope itemtype="http://schema.org/Offer" data-is="product-{ opts.product.type }-price" product={ opts.product } />
              </div>
            </div>
          </h1>
          <div class="product-meta">
            <div class="row">
              <div class="col-9 d-flex align-items-center">
                <a class="btn btn-sm btn-success mr-2" itemprop="category" each={ category, i in opts.product.categories } href="/{ category.url }">{ category.title[this.language] }</a>
              </div>
              <div class="col-3 product-quantity text-right text-success">
                <span class="btn btn-link pr-0">
                  <span data-is="product-{ opts.product.type }-availability" product={ opts.product } />
                </span>
              </div>
            </div>
          </div>
        </div>
        <div class="product-body">
          <div class="product-description my-5">
            <raw data={ { 'html' : opts.product.description[this.language] } } itemprop="description" />
          </div>
          <div data-is="product-{ opts.product.type }-buy" class="product-{ opts.product.type }-buy" product={ opts.product } />
        </div>

        <!-- REVIEWS -->
        <!--
        <ul class="nav nav-tabs">
          <li class="nav-item">
            <a class="nav-link active" href="#">Active</a>
          </li>
          <li class="nav-item">
            <a class="nav-link" href="#">Link</a>
          </li>
          <li class="nav-item">
            <a class="nav-link" href="#">Link</a>
          </li>
          <li class="nav-item">
            <a class="nav-link disabled" href="#">Disabled</a>
          </li>
        </ul>
      </div>
      -->
      <!-- / REVIEWS -->
    </div>
  </div>

  <script>
    // load mixins
    this.mixin('i18n');
    this.mixin('media');

    // set variables
    this.language  = this.i18n.lang();
    this.thumbnail = opts.product.images && opts.product.images.length ? opts.product.images[0] : null;

    /**
     * on image click
     *
     * @param  {Event} e
     */
    onImage (e) {
      // prevent default
      e.preventDefault();

      // set image
      this.thumbnail = e.item.image;

      // update view
      this.update();
    }

    /**
     * returns translated title
     *
     * @return {String}
     */
    title () {
      // return title
      return opts.product.title[this.language];
    }

    /**
     * on language update function
     */
    this.on('update', () => {
      // set language
      this.language = this.i18n.lang();
    });

  </script>
</product-page>
