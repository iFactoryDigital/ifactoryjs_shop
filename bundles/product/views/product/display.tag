<product-display>
  <div class="card mb-3">
    <div class="card-header">
      Display
    </div>
    <div class="card-body">
      <form-render ref="form" form={ opts.form } placement="shop.product" positions={ this.positions } preview={ opts.preview } class="d-block mb-3" />
    </div>
  </div>

  <script>
    // do mixins
    this.mixin('acl');
    this.mixin('i18n');
    
    // require uuid
    const uuid = require('uuid');  

    // set placements
    this.positions = opts.positions || opts.fields.map((field) => {
      // return field
      return {
        'type'     : field.type,
        'uuid'     : uuid(),
        'name'     : field.name,
        'i18n'     : !!field.i18n,
        'label'    : field.label,
        'force'    : true,
        'multiple' : field.multiple,
        'children' : []
      };
    });
  </script>
</product-display>
