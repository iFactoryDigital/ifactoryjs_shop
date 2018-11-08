<addresses>
  <div class="row row-eq-height addresses">
    <input if={ opts.pick } name={ opts.pick } type="hidden" value={ JSON.stringify(this.address) } />
    <div class="col-4" each={ address, i in (this.user.addresses || []) }>
      <a class={ 'card card-address' : true, 'card-outline-success' : isActive(address) } href="#!" onclick={ onAddress }>
        <div class="card-body">
          <h4 class="card-title">
            { address.name }
          </h4>
          <p class="card-text">
            { address.formatted }
          </p>
        </div>
      </a>
    </div>
    <div class="col-4">
      <a class="card card-address card-address-create text-center" href="#!" onclick={ onCreate }>
        Create Address
      </a>
    </div>
  </div>
  <div class="modal fade" id="create-address">
    <div class="modal-dialog" role="document">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Create Address</h5>
          <button type="button" class="close" data-dismiss="modal" aria-label="Close">
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Name</label>
            <input type="text" name="name" ref="name" value={ this.user.name } class="form-control" />
          </div>
          <address name="address" ref="address" />
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary mr-auto" data-dismiss="modal">Close</button>
          <button type="button" class="btn btn-success ml-atuo" onclick={ onSave }>Save Address</button>
        </div>
      </div>
    </div>
  </div>

  <script>
    // do user mixin
    this.mixin('user');

    // set variables
    this.address = {};

    /**
     * on save function
     *
     * @param  {Event} e
     */
    onSave (e) {
      // prevent default
      e.preventDefault ();

      // get name and address
      let name    = this.refs.name.value;
      let address = this.refs.address.address;

      // check formatted
      if (!address.formatted) return eden.alert.error('Please use a valid address');

      // log details
      this.user.addresses = this.user.addresses || [];

      // set name to address
      address.name = name;

      // add address
      this.user.addresses.push(address);

      // emit address
      socket.emit('address', address);

      // open modal
      jQuery('#create-address').modal('hide');

      // update view
      this.update();
    }

    /**
     * on create function
     *
     * @param  {Event} e
     */
    onCreate (e) {
      // prevent default
      e.preventDefault();

      // open modal
      jQuery('#create-address').modal('show');
    }

    /**
     * on address function
     *
     * @param  {Event} e
     */
    onAddress (e) {
      // prevent default
      e.preventDefault();

      // set address
      this.address = e.item.address;

      // trigger update
      this.update();

      // update view
      this.parent.trigger('address', this.address);
    }

    /**
     * checks address is active
     *
     * @param  {Object}  address
     *
     * @return {Boolean}
     */
    isActive (address) {
      // check address is active
      return address.id === this.address.id;
    }

  </script>
</addresses>
