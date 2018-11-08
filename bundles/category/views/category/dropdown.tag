<category-dropdown>
  <input type="hidden" name="c" if={ this.category } value={ this.category.id } />
  <button type="button" class="btn btn-search dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
    { this.category ? this.category.title[this.language] : 'All' }
  </button>
  <div class="dropdown-menu dropdown-menu-right">
    <a class={ 'dropdown-item' : true, 'active' : !this.category } href="#!" onclick={ onCategory }>All</a>
    <div role="separator" class="dropdown-divider"></div>
    <a each={ category, i in this.categories } class={ 'dropdown-item' : true, 'active' : isCategory (category) } href="#!" onclick={ onCategory }>{ category.title[this.language] }</a>
  </div>

  <script>
    // do mixins
    this.mixin ('i18n');

    // set variables
    this.language   = this.i18n.lang ();
    this.category   = false;
    this.categories = this.eden.get ('categories');

    /**
     * changes category
     *
     * @param  {Event} e
     */
    onCategory (e) {
      // prevent default
      e.preventDefault ();

      // on category
      this.category = e.item ? e.item.category : false;

      // update view
      this.update ();
    }

    /**
     * returns true if category
     *
     * @param  {Object}  category
     *
     * @return {Boolean}
     */
    isCategory (category) {
      // return true if category
      return (category.id === (this.category || {}).id);
    }

    /**
     * on language update function
     */
    this.on ('update', () => {
      // set language
      this.language = this.i18n.lang ();
    });

  </script>
</category-dropdown>
