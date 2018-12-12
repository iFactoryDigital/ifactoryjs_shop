<block-checkout-summary>
  <block on-refresh={ opts.onRefresh } on-save={ opts.onSave } checkout={ this.checkout } on-remove={ opts.onRemove } on-card={ onCard } block={ opts.block } data={ opts.data } on-update-title={ onUpdateTitle } on-complete-update-title={ onCompleteUpdateTitle } on-should-update-title={ onShouldUpdateTitle } on-update-content={ onUpdateContent } ref="block" class="block-wysiwyg">
    <yield to="body">
      <checkout-summary card-class={ opts.data.card } checkout={ opts.checkout } />
    </yield>
    <yield to="modal">
      <div class="form-group">
        <label>
          Checkout Summary Class
        </label>
        <input class="form-control" ref="card" value={ opts.data.card } onchange={ opts.onCard } />
      </div>
    </yield>
  </block>

  <script>
    // do checkout mixin
    this.mixin('checkout');

    /**
     * on update name
     *
     * @param  {Event} e
     */
    async onUpdateContent (content) {
      // set name
      opts.data.content = content;

      // do update
      await opts.onSave(opts.block, opts.data);
    }

    /**
     * on class

     * @param  {Event} e
     */
    async onCard (e) {
      // prevent default
      e.preventDefault();
      e.stopPropagation();

      // set class
      opts.data.card = e.target.value.length ? e.target.value : null;

      // run opts
      if (opts.onSave) await opts.onSave(opts.block, opts.data);
    }

  </script>
</block-checkout-summary>
