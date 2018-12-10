<product-variable-buy>
  <div class="product-simple-buy">
    <div class="card">
      <div class="card-body pb-0">
        <div class="row">
          <div class="col-6" each={ variation, i in opts.product.variations }>
            <div if={ variation.type === 'select' } class="form-group">
              <label for="variation-{ i }">
                { variation.title }
              </label>
              <select name="variation-{ i }" data-variation={ i } class="form-control" onchange={ onChange }>
                <option each={ option, a in variation.options } value={ option.sku } no-reorder>
                  { option.name } { parseFloat (option.price) > 0 ? '+' + format (parseFloat (option.price)) : '' }
                </option>
              </select>
            </div>
          </div>
        </div>
      </div>
      <div class="card-body">
        <span class="btn btn-link px-0">
          <span data-is="product-{ opts.product.type }-availability" product={ opts.product } />
        </span>
        <span class="btn-group float-right">
          <a href="#!" if={ this.cart.line (opts.product, Object.values (skus ())) } onclick={ onRemove } class="btn btn-danger">
            <i class="fa fa-times" />
          </a>
          <a href="#!" onclick={ onAdd } class={ 'btn btn-success' : true, 'disabled' : !opts.product.available }>
            <money amount={ price () } /> { this.t('cart.add') }
          </a>
        </span>
        <span class="float-right btn btn-link" if={ this.cart.line (opts.product, Object.values(skus())) }>
          <span>{ this.cart.line (opts.product, Object.values (skus ())).qty }</span>
        </span>
      </div>
    </div>
  </div>

  <script>
    // do mixins
    this.mixin ('i18n');
    this.mixin ('cart');
    this.mixin ('settings');

    /**
     * returns price
     *
     * @return {Float}
     */
    price () {
      // check frontend
      if (!this.eden.frontend) return opts.product.price;

      // return price
      let base = parseFloat (opts.product.price);
      let skus = this.skus ();

      // get prices
      for (let key in skus) {
        // get value
        let option = opts.product.variations[key].options.find ((opt) => {
          // return found
          return opt.sku === skus[key];
        });

        // add to base
        base += parseFloat (option.price);
      }

      // return base
      return base;
    }

    /**
     * skus
     *
     * @return {Array}
     */
    skus () {
      // set array
      let skus = {};

      // check frontend
      if (!this.eden.frontend) return skus;

      // loop options
      jQuery ('[data-variation]').each (function () {
        // get sku
        skus[jQuery (this).attr ('data-variation')] = jQuery (this).val ();
      });

      // return skus
      return skus;
    }

    /**
     * on add function
     *
     * @param  {Event} e
     */
    onAdd (e) {
      // prevent default
      e.preventDefault ();

      // get product
      this.cart.add (opts.product, Object.values (this.skus ()));
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
      this.cart.remove (this.cart.line (opts.product, Object.values (this.skus ())));
    }

    /**
     * update view
     *
     * @param  {Event} e
     */
    onChange (e) {
      // update view
      this.update ();
    }

    /**
     * formats currency
     *
     * @return {String}
     */
    format (amount) {
      // require currency
      let currency = require ('currency-formatter');
      
      // get value
      let value = opts.convert !== false ? (parseFloat (amount) * this.eden.get ('rates')[opts.currency || this.settings.currency || this.eden.get('shop.currency')]) : amount;

      // check value
      if (this.settings.currency === 'JPY') {
        // round to nearest 10
        value = Math.ceil (value / 10) * 10;
      } else {
        value = Math.ceil (value * 10) / 10;
      }

      // return formatted currency
      return this.eden.frontend ? currency.format (value, {
        'code' : opts.currency || this.settings.currency || this.eden.get('shop.currency')
      }) : value.toLocaleString ();
    }
  </script>
</product-variable-buy>
