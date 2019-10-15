<product-simple-buy>
  <div class="product-simple-buy">
    <div class="card">
      <div class="card-body">
        <span class="btn btn-link px-0">
          <span data-is="product-{ opts.product.type }-availability" product={ opts.product } />
        </span>

        <a href="/checkout" class="btn btn-primary float-right ml-2" if={ this.cart.has(opts.product) && !opts.onAdd }>
          { this.t('checkout.proceed') }
        </a>

        <span class="btn-group float-right">
          <a href="#!" if={ this.cart.has(opts.product) && !opts.onAdd } onclick={ onRemove } class="btn btn-danger">
            <i class="fa fa-times" />
          </a>
          <a href="#!" onclick={ onAdd } class={ 'btn btn-success' : true, 'disabled' : !opts.product.price.available }>
            <span if={ this.cart.has(opts.product) && !opts.onAdd }>{ this.cart.line(opts.product).qty }</span> { this.t(this.cart.has(opts.product) && !opts.onAdd ? 'cart.added' : 'cart.add') }
          </a>
        </span>
      </div>
    </div>
  </div>

  <script>
    // do mixins
    this.mixin('i18n');
    this.mixin('cart');

    /**
     * on add function
     *
     * @param  {Event} e
     */
    onAdd (e) {
      // prevent default
      e.preventDefault();

      // get product
      if (opts.onAdd) {
        // on add
        opts.onAdd(opts.product);
      } else {
        // add cart
        this.cart.add(opts.product);
      }
    }

    /**
     * on remove function
     *
     * @param  {Event} e
     */
    onRemove (e) {
      // prevent default
      e.preventDefault();

      // get product
      this.cart.remove(this.cart.line(opts.product));
    }

  </script>
</product-simple-buy>
