<category-page>
  <div class="category">
    <nav class="navbar navbar-toggleable navbar-search navbar-light bg-white mb-4">
      <div class="row w-100 mx-0">
        <div class="col-6 px-0">
          <virtual each={ item, i in opts.trail }>
            <a class="btn btn-link" href="/{ item.url }">
              { item.title[this.language] }
            </a>
          </virtual>
        </div>
        <div class="col-6 px-0">
          <ul class="navbar-nav float-right">
            <li class="nav-item dropdown">
              <a class="nav-link dropdown-toggle" href="#!" id="sort" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                Sort { this.sort }
              </a>
              <div class="dropdown-menu dropdown-menu-right" aria-labelledby="sort">
                <a class="dropdown-item" href="#!" data-sort="Default" onclick={ onSort }>Default</a>
                <a class="dropdown-item" href="#!" data-sort="Highest" onclick={ onSort }>Highest Price</a>
                <a class="dropdown-item" href="#!" data-sort="Lowest" onclick={ onSort }>Lowest Price</a>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </nav>

    <div class="subcategories mb-4" if={ opts.category.children }>
      <virtual each={ category, i in opts.category.children }>
        <a href="/{ category.url }" class="btn btn-sm btn-success mr-2 mb-2">{ category.title[this.language] }</a>
      </virtual>
    </div>

    <product-list products={ this.products } class="mb-4" />

    <!-- load more -->
    <button class={ 'btn btn-lg btn-block btn-primary' : true, 'disabled' : this.loading } disabled={ this.loading } if={ opts.total > this.products.length } onclick={ onLoad }>
      { this.loading ? 'Loading...' : 'Load More' }
    </button>
    <!-- / load more -->
  </div>

  <script>
    // do mixins
    this.mixin ('i18n');

    // set variables
    this.sort     = opts.sort || 'Default';
    this.products = opts.products;
    this.language = this.i18n.lang ();

    /**
     * on sort function
     *
     * @param  {Event} e
     */
    onSort (e) {
      // prevent default
      e.preventDefault ();

      // set sort
      this.sort = e.target.getAttribute ('data-sort').trim ();

      // update view
      this.update ();

      // go
      eden.router.go ('/' + opts.category.slug + '?sort=' + this.sort.toLowerCase ());
    }

    /**
     * on load
     *
     * @param  {Event} e
     */
    async onLoad (e) {
      // prevent default
      e.preventDefault ();

      // set loading
      this.loading = true;

      // update view
      this.update ();

      // push
      this.products.push (...(await socket.call ('category.load', opts.category.id, this.products.length, this.sort || '')))

      // set loading
      this.loading = false;

      // update view
      this.update ();
    }

    /**
     * on ready
     */
    onReady (update) {
      // set variables
      if (update) this.sort = opts.sort || 'Default';
      this.products = opts.products;

      // update
      if (update) this.update ();
    }

    /**
     * on mount function
     *
     * @type {String} 'mount'
     */
    this.on ('mount',  () => this.onReady (true));
    this.on ('update', () => this.onReady (false));
  </script>
</category-page>
