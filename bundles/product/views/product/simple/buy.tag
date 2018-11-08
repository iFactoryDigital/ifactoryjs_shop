<product-simple-buy>
  <div class="product-simple-buy">
    <div class="card">
      <div class="card-body">
        <span class="btn btn-link px-0">
          <span data-is="product-{ opts.product.type }-availability" product={ opts.product } />
        </span>
        <span class="btn-group float-right">
          <a href="#!" if={ this.cart.line (opts.product) } onclick={ onRemove } class="btn btn-danger">
            <fa i="times" />
          </a>
          <a href="#!" onclick={ onAdd } class={ 'btn btn-success' : true, 'disabled' : !opts.product.available }>
            { this.t ('buy') } <span if={ this.cart.line (opts.product) }>{ this.cart.line (opts.product).qty }</span>
          </a>
        </span>
      </div>
    </div>
  </div>

  <script>
    // do mixins
    this.mixin ('i18n');
    this.mixin ('cart');

    /**
     * on add function
     *
     * @param  {Event} e
     */
    onAdd (e) {
      // prevent default
      e.preventDefault ();

      // get product
      this.cart.add (opts.product);
    }

    /**
     * on remove function
     *
     * @param  {Event} e
     */
    onRemove (e) {
      // prevent default
      e.preventDefault ();

      // get product
      this.cart.remove (this.cart.line (opts.product));
    }

  </script>
</product-simple-buy>
