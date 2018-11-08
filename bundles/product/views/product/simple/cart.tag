<product-simple-cart>
  <div class="row mx-0">
    <div class="col-3 px-0" if={ opts.product.images && opts.product.images.length }>
      <img class="img-responsive cart-image" src={ this.media.url (opts.product.images[0], 'sm-sq') } alt={ opts.product.title[this.language] }>
    </div>
    <div class="col-7 px-0 pl-3">
      <div class="cart-title mt-2">
        { opts.line.qty }x { opts.product.title[this.language] }
      </div>
      <money amount={ (this.price.price (opts.product, opts.line.opts) * opts.line.qty) } />
    </div>
    <div class="col-2 px-0">
      <a href="#!" onclick={ opts.remove } class="btn btn-sm btn-danger float-right">
        <fa i="times" />
      </a>
    </div>
  </div>

  <script>
    // do mixins
    this.mixin ('i18n');
    this.mixin ('cart');
    this.mixin ('price');
    this.mixin ('media');

    // set language
    this.language = this.i18n.lang ();

    /**
     * on language update function
     */
    this.on ('update', () => {
      // set language
      this.language = this.i18n.lang ();
    });

  </script>
</product-simple-cart>
