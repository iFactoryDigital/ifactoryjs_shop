<product-variable-price>
  <span if={ this.pricing.min !== this.pricing.max }>from&nbsp;</span><span itemprop="price" content={ this.pricing.min.toFixed(2) }><money amount={ this.pricing.min } small={ true } /></span><span itemprop="priceCurrency" content="USD" />
  <link itemprop="availability" href="http://schema.org/InStock" if={ opts.product.available > 0 } />

  <script>
    // do mixins
    this.mixin('product');
    this.mixin('settings');

    // get price
    const price = parseFloat(opts.product.pricing.price);

    // get min
    let min = price;
    let max = price;

    // get opts
    for (let i = 0; i < (opts.product.variations || []).length; i++) {
      // get value
      const options = opts.product.variations[i].options.map((opt) => parseFloat(opt.price));

      // add to max
      max += Math.max(...options);
      min += Math.min(...options);
    }

    // return min/max
    this.pricing = {
      min,
      max
    };

    /**
     * on mount function
     */
    this.on('mount', () => {
      // check frontend
      if (!this.eden.frontend) return;
    });

  </script>
</product-variable-price>
