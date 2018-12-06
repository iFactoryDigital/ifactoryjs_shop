<product-variable-price>
  <span itemprop="price" content={ this.pricing.min.toFixed (2) }><money amount={ this.pricing.min } /></span><span itemprop="priceCurrency" content="USD" /><span if={ this.pricing.min !== this.pricing.max }>+</span>
  <link itemprop="availability" href="http://schema.org/InStock" if={ opts.product.available > 0 } />

  <script>
    // do mixins
    this.mixin('product');
    this.mixin('settings');

    // set pricing
    this.pricing = {
      'min' : parseFloat(opts.product.pricing.price) || 0,
      'max' : parseFloat(opts.product.pricing.price) || 0
    };

    /**
     * returns variation price
     *
     * @return {Object}
     */
    variationPrice () {
      // get price
      let price = this.product.price(opts.product, []);

      // get min
      let min = price;
      let max = price;

      // get opts
      for (let i = 0; i < (opts.product.variations || []).length; i++) {
        // get value
        let options = opts.product.variations[i].options.map((opt) => opt.price);

        // add to max
        max += Math.max(...options);
        min += Math.min(...options);
      }

      // return min/max
      return {
        min,
        max
      };
    }

    /**
     * on mount function
     */
    this.on('mount', () => {
      // check frontend
      if (!this.eden.frontend) return;

      // set procing
      this.pricing = this.variationPrice();

    });

  </script>
</product-variable-price>
