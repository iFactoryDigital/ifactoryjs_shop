<product-variable-pricing>
  <div class="card mb-3">
    <div class="card-header">
      Variable Pricing
    </div>
    <div class="card-body">
      <div data-is={ 'product-' + this.payment + '-update' } />
      <div class="form-group">
        <label for="pricing-price">Base Price</label>
        <div class="input-group">
        <div class="input-group-prepend">
          <span class="input-group-text">$</span>
        </div>
          <input type="number" name="pricing[price]" step="0.01" class="form-control" id="pricing-price" aria-describedby="pricing-price" placeholder="Enter price" value={ (opts.product.pricing || {}).price }>
          <div class="input-group-append">
            <span class="input-group-text">USD</span>
          </div>
        </div>
      </div>
      <div class="form-group">
        <label for="availability-quantity">Quantity Available</label>
        <div class="input-group">
          <input type="number" name="availability[quantity]" step="1" class="form-control" id="availability-quantity" aria-describedby="availability-quantity" placeholder="Enter quantity" value={ (opts.product.availability || {}).quantity }>
        </div>
      </div>
    </div>
  </div>
</product-variable-pricing>
