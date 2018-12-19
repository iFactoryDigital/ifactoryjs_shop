<block-products>
  <block on-refresh={ opts.onRefresh } on-save={ opts.onSave } on-remove={ opts.onRemove } on-row={ onRow } on-col={ onCol } block={ opts.block } data={ opts.data } on-update-title={ onUpdateTitle } on-complete-update-title={ onCompleteUpdateTitle } on-should-update-title={ onShouldUpdateTitle } on-update-content={ onUpdateContent } ref="block" class="block-notes">  
    <yield to="body">
      <div if={ !opts.data.products.length } class="py-5 text-center">Add Products</div>
      <product-list products={ opts.data.products } row={ opts.data.row } col={ opts.data.col } />
    </yield>
    
    <yield to="modal">
    
      <div class="form-group">
        <label>
          Product row class
        </label>
        <input class="form-control" ref="row" value={ opts.data.row } onchange={ opts.onRow } />
      </div>
      <div class="form-group">
        <label>
          Product card column class
        </label>
        <input class="form-control" ref="col" value={ opts.data.col } onchange={ opts.onCol } />
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
      opts.data.row = e.target.value;

      // do update
      opts.onSave(opts.block, opts.data);
    }
    
    /**
     * on product col
     *
     * @param  {Event} e
     */
    onCol (e) {
      // set row value
      opts.data.col = e.target.value;

      // do update
      opts.onSave(opts.block, opts.data);
    }

  </script>
</block-products>
