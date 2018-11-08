<product-variable-variation>
  <div class="card mb-3">
    <div class="card-header">
      Variations
    </div>
    <div class="card-body" each={ variation, i in this.variations }>
      <div class="form-group">
        <label for="variation-{ i }-title">Variation #{ i + 1 } Title</label>
        <input type="text" name="variation[{ i }][title]" class="form-control" id="variation-{ i }-title" placeholder="Enter variation title" value={ (variation || {}).title }>
      </div>
      <div class="form-group">
        <label for="variation-{ i }-type">Variation #{ i + 1 } Type</label>
        <select name="variation[{ i }][type]" class="form-control">
          <option value="select" selected={ (variation || {}).type === 'select' }>Select</option>
        </select>
      </div>
      <div class="card">
        <div class="card-header">
          Variation Options
        </div>
        <div class="card-body">
          <div class="form-group" each={ option, a in variation.options }>
            <label>Variation #{ i + 1 } Option #{ a + 1 }</label>
            <div class="row">
              <div class="col-3">
                <input type="text" name="variation[{ i }][options][{ a }][sku]" class="form-control" id="variation-{ i }-options-{ a }-sku" placeholder="Option SKU" value={ (option || {}).sku }>
              </div>
              <div class="col-3">
                <input type="text" name="variation[{ i }][options][{ a }][name]" class="form-control" id="variation-{ i }-options-{ a }-name" placeholder="Option name" value={ (option || {}).name }>
              </div>
              <div class="col-4">
                <div class="input-group">
                  <div class="input-group-prepend">
                    <span class="input-group-text">+ $ </span>
                  </div>
                  <input type="number" name="variation[{ i }][options][{ a }][price]" step="0.01" class="form-control" id="variation-{ i }-options-{ a }-price" placeholder="Option price" value={ (option || {}).price }>
                  <div class="input-group-append">
                    <span class="input-group-text">USD</span>
                  </div>
                </div>
              </div>
              <div class="col-2">
                <button data-variation={ i } type="button" class="btn btn-block btn-danger" onclick={ onRemoveOption }>
                  <fa i="times" />
                </button>
              </div>
            </div>
          </div>
        </div>
        <div class="card-footer">
          <button type="button" class="btn btn-success" onclick={ onVariationOption }>
            Add Option
          </button>
        </div>
      </div>
      <button type="button" class="btn btn-danger mt-4" onclick={ onRemoveVariation }>
        Remove Variation
      </button>
    </div>
    <div class="card-footer">
      <button type="button" class="btn btn-success" onclick={ onVariation }>
        Add Variation
      </button>
    </div>
  </div>

  <script>
    // set Variations
    this.variations = opts.product.variations || [];

    /**
     * on variation
     *
     * @param  {Event} e
     */
    onVariation (e) {
      // add variation
      this.variations.push ({
        'type'    : 'select',
        'options' : []
      });

      // update view
      this.update ();
    }

    /**
     * on variation
     *
     * @param  {Event} e
     */
    onRemoveVariation (e) {
      // add variation
      this.variations.splice (e.item.i, 1);

      // update view
      this.update ();
    }

    /**
     * on remove option
     *
     * @param  {Event} e
     */
    onRemoveOption (e) {
      // get target
      let target = jQuery (e.target).is ('button') ? jQuery (e.target) : jQuery (e.target).closest ('button');

      // add variation
      this.variations[target.attr ('data-variation')].options.splice (e.item.a, 1);

      // update view
      this.update ();
    }

    /**
     * on variation option
     *
     * @param  {Event} e
     */
    onVariationOption (e) {
      // get variation
      let variation = e.item.variation;

      // check options
      if (!variation.options) variation.options = [];

      // push to options
      variation.options.push ({});

      // update view
      this.update ();
    }

  </script>
</product-variable-variation>
