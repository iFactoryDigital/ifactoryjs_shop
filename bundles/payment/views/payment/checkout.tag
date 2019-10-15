<payment-checkout>
  <div class="card card-payment card-checkout mb-3">

    <!-- payment choices -->
    <div class="card-body p-0">
      <div class="list-group list-group-flush">
        <virtual each={ method, i in methods() }>
          <li class={ 'list-group-item list-group-item-method' : true, 'list-group-item-active' : isActive(method.type) } data-is="{ method.type }-method" action={ action() } method={ method } val={ (action().value || {}) } on-ready={ onMethod } checkout={ this.checkout } />
        </virtual>
      </div>
    </div>
    <!-- / payment choices -->

  </div>

  <script>
    // mixin i18n
    this.mixin('i18n');
    
    // set checkout
    this.checkout = opts.checkout;

    /**
     * return action
     *
     * @return {Object}
     */
    action () {
      // return action
      return opts.action;
    }

    /**
     * return methods
     *
     * @return {Array}
     */
    methods () {
      // return methods
      return (opts.action.data.methods || []).filter((method) => method.show !== false);
    }

    /**
     * on method function
     *
     * @param  {Object} method
     */
    onMethod (method) {
      // set value
      opts.action.value = method;

      // update checkout
      if (opts.checkout) {
        // add checkout
        opts.checkout.update();
      } else {
        // update view
        this.update();
      }
    }

    /**
     * returns true if payment active
     *
     * @param  {String}  type
     *
     * @return {Boolean}
     */
    isActive (type) {
      // return is active
      return (opts.action.value || {}).type === type;
    }

  </script>
</payment-checkout>
