<cart-dropdown>
  <ul class={ opts.dropdown || 'nav navbar-nav navbar-cart' }>
    <li class="nav-item dropdown">
      <button class="btn btn-primary dropdown-toggle" id="cart" onclick={ onShow }>
        <i class={ 'fa fa-shopping-cart' : true, 'mr-2' : this.cart.count() } /> { this.cart.count() || '' }
      </button>
      <div class={ 'dropdown-menu dropdown-menu-right dropdown-cart px-3 py-3' : true, 'show' : this.show } role="menu" ref="menu">
        <div class="cart-line" each={ type, i in this.types() }>
          <h4 class="mb-3">
            { this.t(type + '.plural') }
          </h4>
          <virtual each={ line, i in this.lines (type) }>
            <div data-is="product-{ type }-cart" line={ line } product={ this.cart.product(line) } class="cart-product mb-3" remove={ onRemove } />
          </virtual>
        </div>
        <a class="btn btn-block btn-success mt-3" href="/checkout" onclick={ onClose }>Checkout</a>
      </div>
    </li>
  </ul>

  <script>
    // do mixins
    this.mixin('cart');
    this.mixin('i18n');

    // set variables
    this.show = false;

    /**
     * on show dropdown
     *
     * @param  {Event} e
     */
    onShow (e) {
      // prevent default
      e.preventDefault();

      // set show
      this.show = !this.show;

      // update view
      this.update();
    }

    /**
     * close dropdown
     */
    onClose () {
      // set show
      this.show = false;

      // update view
      this.update();
    }

    /**
     * on remove function
     *
     * @param  {Event} e
     */
    onRemove (e) {
      // get product
      this.cart.remove(e.item.line);
    }

    /**
     * return different cart types
     *
     * @return {Array}
     */
    types () {
      // set cart type Array
      let types = [];

      // loop cart
      for (let i = 0; i < this.cart.lines.length; i++) {
        // let product
        let product = this.cart.product(this.cart.lines[i]);

        // check product
        if (!product) continue;

        // check types
        if (types.indexOf(product.type) > -1) continue;

        // add type
        types.push(product.type);
      }

      // return lines
      return types;
    }

    /**
     * set types
     *
     * @param  {String} type
     *
     * @return {Array}
     */
    lines (type) {
      // let lines
      let lines = [];

      // loop cart
      for (let i = 0; i < this.cart.lines.length; i++) {
        // let product
        let product = this.cart.product(this.cart.lines[i]);

        // check types
        if (product.type !== type) continue;

        // add type
        lines.push(this.cart.lines[i]);
      }

      // return lines
      return lines;
    }

    /**
     * on mount function
     *
     * @type {Event} 'mount'
     */
    this.on ('mount', () => {
      // check frontend
      if (!this.eden.frontend) return;

      // on mouseup
      jQuery(document).on('click', (e) => {
        // check show
        if (!this.show) return;

        // let container
        let container = jQuery(this.root);

        // check target
        if (container.is(e.target)) return;
        if (jQuery(e.target).closest(container).length) return;

        // check show
        this.show = false;

        // update view
        this.update();
      });
    });

  </script>
</cart-dropdown>
