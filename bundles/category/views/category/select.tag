<category-select>
  <div class="form-group">
    <label for={ opts.name || 'categories' }>{ opts.label || 'Categories' }</label>
    <input type="hidden" name={ opts.name || 'categories' } value={ this.selected.join (',') } if={ opts.multi !== 'false' } />
    <div if={ opts.multi !== 'false' } class="text-lg mb-3">
      <span each={ value, i in this.values () } class="badge bg-success mr-2">
        { value.name }
        <a href="#!" class="ml-2 text-white" onclick={ onRemove }>
          <fa i="times" />
        </a>
      </span>
    </div>
    <select class="form-control" ref="select" name={ opts.multi !== 'false' ? 'ignore' : opts.name || 'category' } id={ opts.name || 'categories' } onChange={ onCategory }>
      <option value="null">Select Category</option>
      <option each={ option, i in this.options (this.categories) } value={ option.value } selected={ isCategory (option.value) }>{ option.name }</option>
    </select>
  </div>

  <script>
    // do mixins
    this.mixin ('i18n');

    // get all categories
    this.selected   = opts.values && opts.values !== 'selected' ? opts.values : [];
    this.selected   = Array.isArray (this.selected) ? this.selected : [this.selected];
    this.language   = this.i18n.lang ();
    this.categories = this.eden.get ('categories') || [];

    /**
     * gets values
     *
     * @return {Array}
     */
    values () {
      // get options
      let options = this.options (this.categories);

      // set values
      let values = [];

      // loop selected
      for (let i = 0; i < this.selected.length; i++) {
        // push to values if found
        let find = options.find ((option) => {
          // return found
          return option.value === this.selected[i];
        });

        // check find
        if (find) values.push (find);
      }

      // return values
      return values;
    }

    /**
     * gets options
     *
     * @return {Array}
     */
    options (categories, prefix) {
      // loop options
      let rtn = [];

      // check prefix
      prefix = prefix || '';

      // loop categories
      for (let i = 0; i < categories.length; i++) {
        // push option
        rtn.push ({
          'name'  : prefix + categories[i].title[this.language],
          'value' : categories[i].id
        });

        // push children
        rtn.push (...this.options (categories[i].children || [], prefix + ' -- '));
      }

      // return categories flattened
      return rtn;
    }

    /**
     * get category
     *
     * @param  {Event} e
     */
    onRemove (e) {
      // get value
      let value = e.item.value;

      // remove from selected
      this.selected.splice (this.selected.indexOf (value), 1);

      // update view
      this.update ();
    }

    /**
     * get category
     *
     * @param  {Event} e
     */
    onCategory (e) {
      // get value
      let value = e.target.value;

      // add to categories
      if (this.selected.indexOf (value) === -1) this.selected.push (value);

      // set value
      if (opts.multi !== 'false') this.refs.select.value = 'null';

      // update view
      this.update ();
    }

    /**
     * checks if category is selected
     *
     * @param  {String}  id
     *
     * @return {Boolean}
     */
    isCategory (id) {
      // return is selected
      if (this.selected.indexOf (id) > -1 && opts.multi === 'false') return true;
    }
  </script>
</category-select>
