<element-category>
  <span each={ item, i in this.categories }>
    <a href="/admin/shop/category/{ item.id }/update">{ item.title[this.i18n.lang()] }</a>
    { i === this.categories.length - 1 ? '' : ', ' }
  </span>
  
  <script>
    // do mixins
    this.mixin('i18n');
    
    // set categories
    this.categories = (Array.isArray(opts.data.value) ? opts.data.value : [opts.data.value]).filter(v => v);
    
  </script>
</element-category>
