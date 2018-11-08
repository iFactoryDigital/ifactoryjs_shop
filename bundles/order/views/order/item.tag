<order-item>
  <a href="/order/{ opts.order.id }" class="card card-order mb-3">
    <div class="card-block">
      <div class="row">
        <div class="col-md-2 display-3 text-center">
          <fa i={ opts.order.sent ? 'check' : ((opts.order.invoice || {}).paid ? 'check' : 'times') } class={ 'display-2' : true, 'text-success' : opts.order.sent, 'text-danger' : !(opts.order.invoice || {}).paid, 'text-primary' : (opts.order.invoice || {}).paid && !opts.order.sent } />
        </div>
        <div class="col-md-10 text-body">
          <h4 class="card-title text-overflow mb-3">
            { opts.order.sent ? this.t ('order.completed') : ((opts.order.invoice || {}).paid ? this.t ('order.processing') : this.t ('order.payment.pending') ) } { this.t ('order.title') } #{ opts.order.id }
          </h4>
          <p class="card-text mb-0 text-overflow">
            { count ().toString () } { this.t ('order.items') } <money if={ this.eden.frontend && opts.order.invoice } amount={ opts.order.invoice.total } convert={ false } currency={ opts.order.invoice.currency } show-currency={ true } />
          </p>
        </div>
      </div>
    </div>
  </a>

  <script>
    // do mixins
    this.mixin ('i18n');

    /**
     * count order items
     *
     * @return {Integer}
     */
    count () {
      // set quantities
      let quantities = opts.order.lines.map ((line) => parseInt (line.qty));

      // push 0 for non empty Array
      quantities.push (0);

      // reduce for total
      return quantities.reduce ((a, b) => {
        // return sum
        return (parseInt (a) + parseInt (b));
      });
    }
  </script>
</order-item>
