<product-variable-availability>
  <span>
    <span itemprop="numberOfItems">{ (opts.product.availability || {}).quantity }</span> { this.t ('left') }
  </span>

  <script>
    // do mixins
    this.mixin ('i18n');

  </script>
</product-variable-availability>
