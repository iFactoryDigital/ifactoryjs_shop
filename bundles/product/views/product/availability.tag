<product-availability>
  <div class="card mb-3">
    <div class="card-header">
      Availability
    </div>
    <div class="card-body">
      <div class="form-group">
        <label for="availability-quantity">Quantity Available</label>
        <div class="input-group">
          <input type="number" name="availability[quantity]" step="1" class="form-control" id="availability-quantity" aria-describedby="availability-quantity" placeholder="Enter quantity" value={ (opts.product.availability || {}).quantity }>
        </div>
      </div>
    </div>
  </div>
</product-availability>
