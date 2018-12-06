<product-variable-cart>
  <div class="row mx-0">
    <div class="col-3 px-0" if={ opts.product.images && opts.product.images.length }>
      <img class="img-fluid cart-image" src={ this.media.url(opts.product.images[0], '3x-sq') } alt={ opts.product.title[this.language] }>
    </div>
    <div class="col-7 px-0 pl-3">
      <div class="cart-title mt-2">
        { opts.line.qty }x { opts.product.title[this.language] }
      </div>
      <div class="options">
        <span class="badge mr-2 bg-primary" each={ opt, i in opts.line.opts }>
          { this.option(opt).name }
        </span>
      </div>
      <money amount={ (this.product.price(opts.product, opts.line.opts) * opts.line.qty) } />
    </div>
    <div class="col-2 px-0">
      <a href="#!" onclick={ opts.remove } class="btn btn-sm btn-danger float-right">
        <fa i="times" />
      </a>
    </div>
  </div>

  <script>
    // do mixins
    this.mixin('i18n');
    this.mixin('cart');
    this.mixin('media');
    this.mixin('product');

    // set language
    this.language = this.i18n.lang();

    /**
     * finds option
     *
     * @param  {String} option
     *
     * @return {*}
     */
    option (option) {
      // get prices
      for (let i = 0; i < opts.product.variations.length; i++) {
        // get value
        let check = opts.product.variations[i].options.find((opt) => {
          // return found
          return opt.sku === option;
        });

        // add to base
        if (check) return check;
      }
    }

    /**
     * on language update function
     */
    this.on('update', () => {
      // set language
      this.language = this.i18n.lang();
    });

  </script>
</product-variable-cart>
