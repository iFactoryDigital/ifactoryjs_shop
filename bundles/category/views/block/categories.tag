<block-categories>
  <block on-refresh={ opts.onRefresh } on-save={ opts.onSave } on-remove={ opts.onRemove } on-row={ onRow } on-col={ onCol } block={ opts.block } data={ opts.data } ref="block" class="block-notes" get-categories={ getCategories } i18n={ this.i18n }>  
    <yield to="body">
      <div if={ !opts.data.categories.length } class="py-5 text-center">Add Categories</div>
      <div if={ opts.data.categories.length } class="card">
        <div class="card-body">
          <ul class="nav flex-column">
            <li class="nav-item" each={ category, i in opts.getCategories() }>
              <a class="nav-link" href="/{ category.slug }">
                { category.title[opts.i18n.lang()] }
              </a>
            </li>
          </ul>
        </div>
      </div>
    </yield>
    
    <yield to="modal">
      
    </yield>
    
  </block>

  <script>
    // i18n
    this.mixin('i18n');
  
    /**
     * get categories by parent
     *
     * @param  {Object} parent
     *
     * @return {Array}
     */
    getCategories(parent) {
      // filter categories
      return opts.data.categories.filter((cat) => {
        // check parent
        return (parent && cat.parent === parent) || (!parent && !(cat.parent || []).length);
      });
    }

  </script>
</block-categories>
