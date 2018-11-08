<order-row>
  <div class="card card-order mb-3">
    <div class="card-body">
      <div class="row row-eq-height">
        <div class="col-lg-2 text-overflow d-flex align-items-center">
          <div class="w-100 text-overflow">
            <i class={ 'fa fa-circle mr-2' : true, 'text-success' : opts.order.get('invoice').paid && opts.order.get('status') !== 'completed', 'text-info' : opts.order.get('status') === 'paid', 'text-danger' : !opts.order.get('invoice').paid } />
            { opts.order.get('id') }
          </div>
        </div>
        <div class="col-lg-2 text-overflow d-flex align-items-center">
          <div class="w-100">
            <span class={ 'badge' : true, 'badge-danger' : !opts.order.get('invoice').paid, 'badge-success' : opts.order.get('invoice').paid }>
              { opts.order.get('invoice').paid ? 'Paid' : 'Unpaid' }
            </span>
            ${ opts.order.get('invoice').total.toFixed(2) } { opts.order.get('invoice').currency }<br />
            <span class="text-muted">
              Created { formatDate(opts.order.get('created')) }
            </span>
          </div>
        </div>
        <div class="col-lg-5 text-overflow d-flex align-items-center">
          <div class="w-100">
            <div each={ line, i in opts.order.get('lines') } data-is="product-{ getLine(line).product.type }-line" line={ getLine(line) } />
          </div>
        </div>
        <div class="col-lg-3 text-right d-flex align-items-center">
          <div class="w-100">
            <span class={ 'btn mr-3' : true, 'btn-success' : opts.order.get('invoice').paid && opts.order.get('status') !== 'completed', 'btn-info' : opts.order.get('status') === 'paid', 'btn-danger' : !opts.order.get('invoice').paid }>
              { this.t('order.status.' + opts.order.get('status')) }
            </span>

            <div class="btn-group">
              <a href="/order/{ opts.order.get('id') }" class="btn btn-info">
                <i class="fa fa-eye" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <script>
    // mixin
    this.mixin ('i18n');
    this.mixin ('media');

    /**
     * formats date
     *
     * @param  {Date} date
     *
     * @return {String}
     */
    formatDate (date) {
      // get moment
      let moment = require('moment');

      // return string
      return moment(date).fromNow();
    }

    /**
     * gets line
     *
     * @param  {Object} line
     *
     * @return {Object}
     */
    getLine (line) {
      // set new line
      line = Object.assign({}, line);

      // return line
      line.product = opts.order.get('products').find((product) => product.id === line.product);

      // return line
      return line;
    }

  </script>
</order-row>
