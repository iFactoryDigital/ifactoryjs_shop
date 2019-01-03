<block-cart-dropdown>
  <block on-refresh={ opts.onRefresh } on-save={ opts.onSave } on-remove={ opts.onRemove } on-dropdown={ onDropdown } block={ opts.block } data={ opts.data } on-update-title={ onUpdateTitle } on-complete-update-title={ onCompleteUpdateTitle } on-should-update-title={ onShouldUpdateTitle } on-update-content={ onUpdateContent } ref="block" class="block-wysiwyg">
    <yield to="body">
      <cart-dropdown dropdown-class={ opts.block.dropdown } />
    </yield>
    <yield to="modal">
      <div class="form-group">
        <label>
          Dropdown Class
        </label>
        <input class="form-control" ref="dropdown" value={ opts.data.dropdown } onchange={ opts.onDropdown } />
      </div>
    </yield>
  </block>

  <script>

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
    async onDropdown (e) {
      // prevent default
      e.preventDefault();
      e.stopPropagation();

      // set class
      opts.block.dropdown = e.target.value.length ? e.target.value : null;

      // run opts
      if (opts.onSave) await opts.onSave(opts.block, opts.data);
    }

  </script>
</block-cart-dropdown>
