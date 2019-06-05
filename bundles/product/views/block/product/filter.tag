<block-product-filter>
  <block on-refresh={ opts.onRefresh } on-save={ opts.onSave } on-remove={ opts.onRemove } on-card={ onCard } on-product={ onProduct } block={ opts.block } data={ opts.data } ref="block" class="block-notes">
    <yield to="body">
      <nav class="navbar navbar-toggleable navbar-search navbar-light bg-white mb-4">
        <div class="row w-100 mx-0">
          <div class="col-6 px-0">
            <virtual each={ item, i in opts.data.trail }>
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
                  <a class="dropdown-item" href="#!" data-sort="default" onclick={ opts.onSort }>Default</a>
                  <a class="dropdown-item" href="#!" data-sort="highest" onclick={ opts.onSort }>Highest Price</a>
                  <a class="dropdown-item" href="#!" data-sort="lowest" onclick={ opts.onSort }>Lowest Price</a>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </nav>
    </yield>

    <yield to="modal">

      <!--
      <div class="form-group">
        <label>
          Product ID
        </label>
        <input class="form-control" ref="product" value={ opts.block.product } onchange={ opts.onProduct } />
      </div>
      <div class="form-group">
        <label>
          Product card class
        </label>
        <input class="form-control" ref="card" value={ opts.block.card } onchange={ opts.onCard } />
      </div>
      -->

    </yield>

  </block>

  <script>

    /**
     * on product row
     *
     * @param  {Event} e
     */
    onCard (e) {
      // set row value
      opts.block.card = e.target.value;

      // do update
      opts.onSave(opts.block, opts.data, opts.placement);
    }

    /**
     * on product row
     *
     * @param  {Event} e
     */
    onProduct (e) {
      // set row value
      opts.block.product = e.target.value;

      // do update
      opts.onSave(opts.block, opts.data, opts.placement);
    }

  </script>
</block-product-filter>