<product-list>
  <div class={ opts.row || 'row row-products' }>
    <div class={ opts.col || 'col-md-4' } each={ product, i in opts.products }>
      <div data-is="product-{ product.type }-card" product={ product } />
    </div>
  </div>

  <script>
    // do mixins
    this.mixin ('i18n');

  </script>
</product-list>
