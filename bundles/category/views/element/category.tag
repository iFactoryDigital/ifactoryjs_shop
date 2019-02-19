<element-category>
  <span each={ item, i in this.categories }>
    <a href="/admin/shop/category/{ item.id }/update">{ item.title }</a>
    { i === this.categories.length - 1 ? '' : ', ' }
  </span>
  
  <script>
    // set categories
    this.categories = (Array.isArray(opts.data.value) ? opts.data.value : [opts.data.value]).filter(v => v);
    
  </script>
</element-category>
