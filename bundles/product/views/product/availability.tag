<product-availability>
  <div class="card mb-3">
    <div class="card-header">
      Availability
    </div>
    <div class="card-body">
      <div class="form-group">
        <label for="availability-quantity">Total Quantity</label>
        <div class="input-group mb-1">
          <input type="number" name="total[quantity]" step="1" class="form-control" id="total-quantity" aria-describedby="total-quantity" placeholder="Enter quantity" value={ (opts.product.total || {}).quantity }>
        </div>
        <label for="availability-quantity">Quantity Available</label>
        <div class="input-group  mb-1">
           { (opts.product.availability || {}).quantity }
        </div>
        <label for="availability-quantity">Scanned Product</label>
        <div class="input-group  mb-1">
            { (opts.product.scanned || {}).quantity }
        </div>
      </div>
    </div>
  </div>
</product-availability>
