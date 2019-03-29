<field-order>
  <field ref="field" is-input={ true } class="field-container-inner" on-container-class={ onFieldClass } is-multiple={ true } get-fields={ getFields } get-element={ getElement }>
    <yield to="body">
      <div class={ opts.field.group || 'form-group' }>
        <label for={ opts.field.uuid }>
          { opts.field.label }
          <i if={ !opts.field.label }>Set Label</i>
        </label>
        <eden-select url="/admin/order/query" required={ opts.field.required } name={ opts.field.uuid } multiple={ opts.field.multiple } ref="select" label={ opts.field.label || 'Search by Name' } data={ opts.data }>
          <option each={ order, i in opts.data.value || [] } selected="true" value={ order.id }>
            { order.id }
          </option>
        </eden-select>
      </div>
    </yield>
  </field>
  
  <script>
    // do mixins
    this.mixin('acl');
    
    // set initialized
    this.roles = opts.data.value || [];
    
    /**
     * return value
     *
     * @return {*}
     */
    val() {
      // return value
      return this.refs.field.refs.select.val();
    }

    /**
     * on mount function
     */
    this.on('mount', () => {
      // check frontend
      if (!this.eden.frontend || this.initialized) return;
      
    });
    
  </script>
</field-order>
