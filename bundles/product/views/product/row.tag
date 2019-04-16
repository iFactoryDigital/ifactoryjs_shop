<product-row class={ getColClass() }>
  <div data-is="product-{ opts.row.get('type') }-card" product={ opts.row.get() } />
  
  <script>
  
    /**
     * gets column class
     *
     * @return {*}
     */
    getColClass() {
      // get class
      return this.parent.getClass('col', 'col-lg-2 col-md-3 col-6');
    }
  </script>
</product-row>
