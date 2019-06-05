<block-products>
  <block on-refresh={ opts.onRefresh } on-save={ opts.onSave } on-remove={ opts.onRemove } on-row={ onRow } on-col={ onCol } block={ opts.block } data={ opts.data } ref="block" class="block-notes">
    <yield to="body">
      <div if={ !opts.data.products.length } class="py-5 text-center">Add Products</div>
      <product-list products={ opts.data.products } row={ opts.block.row } col={ opts.block.col } />
    </yield>

    <yield to="modal">

      <div class="form-group">
        <label>
          Product row class
        </label>
        <input class="form-control" ref="row" value={ opts.block.row } onchange={ opts.onRow } />
      </div>
      <div class="form-group">
        <label>
          Product card column class
        </label>
        <input class="form-control" ref="col" value={ opts.block.col } onchange={ opts.onCol } />
      </div>

    </yield>

  </block>

  <script>

    /**
     * on product row
     *
     * @param  {Event} e
     */
    onRow (e) {
      // set row value
      opts.block.row = e.target.value;

      // do update
      opts.onSave(opts.block, opts.data, opts.placement);
    }

    /**
     * on product col
     *
     * @param  {Event} e
     */
    onCol (e) {
      // set row value
      opts.block.col = e.target.value;

      // do update
      opts.onSave(opts.block, opts.data, opts.placement);
    }

  </script>
</block-products>