<product-summary>
  <div class="product-summary">
    <div each={ lines, key in groups() } class="summary-group summary-group-{ key.toLowerCase() }">
      <!-- do title -->
      <div data-is="product-{ key.toLowerCase() }-title" />

      <!-- loop lines -->
      <virtual each={ line, i in lines }>
        <div data-is="product-{ key.toLowerCase() }-summary" line={ line } />
      </virtual>
      <!-- / loop lines -->

    </div>
  </div>

  <script>
    // add mixins
    this.mixin('product');

    // group products by type
    groups() {
      // let groups
      let groups = {};

      // sort into groups
      (opts.lines || []).forEach((line) => {
        // find product
        let product = (opts.products || []).find((check) => {
          // return check
          return check.id === line.product;
        });

        // new line
        let newLine = {
          'qty'     : line.qty,
          'opts'    : line.opts,
          'type'    : product.type,
          'product' : product
        };

        // check group
        if (!groups[newLine.type]) groups[newLine.type] = [];

        // add line
        groups[newLine.type].push(newLine);
      });

      // return groups
      return groups;
    }

  </script>
</product-summary>
