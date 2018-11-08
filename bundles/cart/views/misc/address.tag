<address>
  <div class="form-group">
    <label for={ (opts.name || 'address') + '-geo' }>{ opts.label || 'Address' }</label>
    <input type="hidden" name={ opts.name || 'address' } value={ JSON.stringify (this.address) } />
    <input type="text" name={ (opts.name || 'address') + '-geo' } class={ 'form-control' : true } id={ (opts.name || 'address') + '-geo' } value={ this.address.formatted || '' }>
  </div>

  <script>
    // set address
    this.address = opts.address || {};

    /**
     * renders location input
     */
    _location () {
      // get location input
      var input = jQuery('input[type="text"]', this.root);

      // geocomplete
      if (input && input.length) input.geocomplete().on('geocode:result', (e, result) => {
        // set values
        this.address = {
          'id'         : result.id,
          'geo'        : {
            'lat' : result.geometry.location.lat(),
            'lng' : result.geometry.location.lng()
          },
          'formatted'  : result.formatted_address,
          'components' : result.address_components
        };

        // update view
        this.update();
      });
    }

    /**
     * on mount function
     *
     * @param {Event} 'mount'
     */
    this.on ('mount', () => {
      // check jQuery
      if (typeof jQuery !== 'undefined') {
        // render location
        this._location();
      }
    });
  </script>
</address>
