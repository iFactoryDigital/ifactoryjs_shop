<product-variable-summary>
  <div class="row mb-2">
    <div class="col-2 pr-0">
      <img class="img-fluid cart-image" if={ opts.line.product.images && opts.line.product.images[0] } src={ this.media.url(opts.line.product.images[0], '3x-sq') } alt={ opts.line.product.title[this.language] }>
    </div>
    <div class="col-7">
      <b class="d-block mb-0 text-overflow">
        { opts.line.qty }x { opts.line.product.title[this.language] }
      </b>
      <div class="options">
        <span class="badge mr-2 bg-primary" each={ opt, i in opts.line.opts }>
          { this.option(opt).name }
        </span>
      </div>
    </div>
    <div class="col-3 text-right">
      <money class="lead" amount={ (this.product.price(opts.line.product, opts.line.opts) * opts.line.qty) } />
    </div>
  </div>

  <script>
    // do media
    this.mixin('i18n');
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
      for (let i = 0; i < opts.line.product.variations.length; i++) {
        // get value
        let check = opts.line.product.variations[i].options.find((opt) => {
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
</product-variable-summary>
