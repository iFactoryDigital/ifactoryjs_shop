<order-actions>
  <div class="btn-group btn-group-sm" role="group">
    <a href="/admin/shop/order/{ opts.row._id }/update" class="btn btn-primary" onclick={ onUpdate }>
      <i class="fa fa-pencil-alt" />
    </a>
    <a href="/admin/shop/order/{ opts.row._id }/remove" class="btn btn-danger" onclick={ onRemove }>
      <i class="fa fa-times" />
    </a>
  </div>
  
  <script>
  
    /**
     * on update
     *
     * @param  {Event} e
     */
    onUpdate(e) {
      // check update button
      if (this.parent.opts.onUpdateButton) {
        // do update button
        return this.parent.opts.onUpdateButton(e, opts.row);
      }
    }
    
    /**
     * on remove
     *
     * @param  {Event} e
     */
    onRemove(e) {
      // check update button
      if (this.parent.opts.onRemoveButton) {
        // do update button
        return this.parent.opts.onRemoveButton(e, opts.row);
      }
    }
  
  </script>
</order-actions>
