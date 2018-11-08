<product-simple-price>
  <span itemprop="price" content={ this.price.price (opts.product).toFixed (2) }><money amount={ this.price.price (opts.product) } /></span><span itemprop="priceCurrency" content="USD" />
  <link itemprop="availability" href="http://schema.org/InStock" if={ opts.product.available > 0 } />

  <script>
    // do mixins
    this.mixin ('price');
    this.mixin ('settings');

  </script>
</product-simple-price>
