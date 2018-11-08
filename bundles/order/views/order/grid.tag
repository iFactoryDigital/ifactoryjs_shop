<order-grid>

  <grid grid={ opts.grid } title={ opts.title } ref="grid">
    <yield to="data">
      <order-row each={ order, i in this.state.data } order={ order } />
    </yield>
  </grid>

  <script>
    // do mixins
    this.mixin('model');

    /**
     * on mount
     */
    this.on('mount', () => {
      // check frontend
      if (!this.eden.frontend) return;

      // socket
      socket.on('order.create', (order) => {
        // check mounted
        if (!this.isMounted) return;

        // create live task
        this.refs.grid.state.data.unshift(this.model('order', order));

        // add total
        this.refs.grid.state.total++;

        // check data
        if (this.refs.grid.state.rows < this.refs.grid.state.data.length) this.refs.grid.state.data.pop ();

        // update grid
        this.refs.grid.update ();
      });

    });
  </script>
</order-grid>
