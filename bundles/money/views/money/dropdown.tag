<money-dropdown>
  <ul class="nav navbar-nav">
    <li class={ 'nav-item dropdown' : true, 'show' : this.show }>
      <button class="btn btn-link dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
        { this.currency }
      </button>
      <div class="dropdown-menu">
        <virtual each={ currency, key in this.eden.get('shop.rates') }>
          <a href="#!" class={ 'dropdown-item' : true, 'active' : isCurrency(key) } onclick={ onChange }>{ key }</a>
        </virtual>
      </div>
    </li>
  </ul>

  <script>
    // do mixins
    this.mixin('i18n');
    this.mixin('media');
    this.mixin('settings');

    // set variables
    this.show     = false;
    this.currency = this.settings.currency || this.eden.get('shop.currency');

    /**
     * on show dropdown
     *
     * @param  {Event} e
     */
    onChange (e) {
      // prevent default
      e.preventDefault();

      // set show
      this.currency = e.item.key;

      // set show
      this.show = false;

      // set currency
      this.settings.set('currency', this.currency);
    }

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
     * return true if currency is selected
     *
     * @param  {String}  currency
     *
     * @return {Boolean}
     */
    isCurrency (currency) {
      // return true
      return currency === this.currency;
    }

    /**
     * on mount function
     *
     * @type {Event} 'mount'
     */
    this.on('mount', () => {
      // check frontend
      if (!this.eden.frontend) return;

      // on mouseup
      jQuery(document).mouseup((e) => {
        // check show
        if (!this.show) return;

        // let container
        let container = jQuery(this.root);

        // check container
        if (!container.is(e.target) && container.has(e.target).length === 0) {
          // check show
          this.show = false;

          // update view
          this.update();
        }
      });
    });

  </script>
</money-dropdown>
