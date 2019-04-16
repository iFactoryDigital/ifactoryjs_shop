<product-simple-price>
  <span itemprop="price" content={ this.price.amount.toFixed(2) }><money amount={ this.price.amount } small={ true } /></span><span itemprop="priceCurrency" content="USD" />
  <link itemprop="availability" href="http://schema.org/InStock" if={ this.price.available } />

  <script>
    // do mixins
    this.mixin('settings');

    // set default price
    this.price = opts.product.price;
  </script>
</product-simple-price>
