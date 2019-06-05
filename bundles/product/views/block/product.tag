<block-product>
  <block on-refresh={ opts.onRefresh } on-save={ opts.onSave } on-remove={ opts.onRemove } on-card={ onCard } on-product={ onProduct } block={ opts.block } data={ opts.data } ref="block" class="block-notes">
    <yield to="body">
      <div data-is="product-{ opts.data.product.type }-card" product={ opts.data.product } class={ opts.block.card } />
      <div if={ !opts.block.product } class="py-5 text-center">Add Product</div>
    </yield>

    <yield to="modal">

      <div class="form-group">
        <label>
          Product ID
        </label>
        <input class="form-control" ref="product" value={ opts.block.product } onchange={ opts.onProduct } />
      </div>
      <div class="form-group">
        <label>
          Product card class
        </label>
        <input class="form-control" ref="card" value={ opts.block.card } onchange={ opts.onCard } />
      </div>

    </yield>

  </block>

  <script>

    /**
     * on product row
     *
     * @param  {Event} e
     */
    onCard (e) {
      // set row value
      opts.block.card = e.target.value;

      // do update
      opts.onSave(opts.block, opts.data, opts.placement);
    }

    /**
     * on product row
     *
     * @param  {Event} e
     */
    onProduct (e) {
      // set row value
      opts.block.product = e.target.value;

      // do update
      opts.onSave(opts.block, opts.data, opts.placement);
    }

  </script>
</block-product>