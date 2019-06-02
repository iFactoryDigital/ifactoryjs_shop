
// bind dependencies
const config = require('config');
const Daemon = require('daemon');

// require models
const Sold    = model('sold');
const Invoice = model('invoice');
const Product = model('product');

// require helpers
const emailHelper   = helper('email');
const productHelper = helper('product');

/**
 * build cart controller
 *
 * @mount /order
 */
class OrderDaemon extends Daemon {
  /**
   * construct user cart controller
   */
  constructor() {
    // run super
    super();

    // bind build method
    this.build = this.build.bind(this);

    // bind methods
    this.orderUpdateHook = this.orderUpdateHook.bind(this);

    // build order controller
    this.build();
  }


  // ////////////////////////////////////////////////////////////////////////////
  //
  // BUILD METHODS
  //
  // ////////////////////////////////////////////////////////////////////////////

  /**
   * builds order controller
   */
  build() {
    
  }


  // ////////////////////////////////////////////////////////////////////////////
  //
  // HOOK METHODS
  //
  // ////////////////////////////////////////////////////////////////////////////

  /**
   * pre order update
   *
   * @param  {order} Order
   *
   * @pre order.update
   * @pre order.create
   */
  async orderUpdateHook(orderStatus) {
    // load invoice
    const invoice = await orderStatus.get('invoice') || await Invoice.findOne({
      'orders.id' : orderStatus.get('_id'),
    });

    // check invoice
    if (!invoice) return;

    // set invoice
    orderStatus.set('invoice', invoice);

    // set status
    if (!orderStatus.get('complete') && await invoice.hasPaid()) {
      // set invoice
      invoice.set('status', 'paid');

      // set order
      orderStatus.set('status', 'paid');
      orderStatus.set('complete', new Date());

      // save order
      await invoice.save(await invoice.get('user'));
      await orderStatus.save(await orderStatus.get('user'));

      // emit create
      this.eden.emit('order.complete', {
        id    : orderStatus.get('_id').toString(),
        model : 'order',
      }, true);

      // complete order
      await this.eden.hook('order.complete', orderStatus);

      // set address to null
      let address = null;

      // run try/catch
      try {
        // get address
        address = orderStatus.get('address.email') || orderStatus.get('actions.address.value.email');

        // get email
        if (!address) address = await orderStatus.get('user') ? (await orderStatus.get('user')).get('email') : null;
        if (!address) address = await orderStatus.get('address') ? (await orderStatus.get('address')).get('email') : null;
      } catch (e) {}

      // send email
      if (address) {
        // try/catch
        try {
          // email
          emailHelper.send(address, 'order', {
            order   : await orderStatus.sanitise(),
            subject : `${config.get('domain')} - order #${orderStatus.get('_id').toString()}`,
          }).then(async (email) => {
            // lock
            await orderStatus.lock();

            // set order email
            orderStatus.set('emails.ordered', email);

            // save order
            await orderStatus.save(await orderStatus.get('user'));

            // unlock
            orderStatus.unlock();
          });
        } catch (e) { console.log(e); }
      }

      // loop items
      await Promise.all(orderStatus.get('lines').map(async (line, i) => {
        // get product
        const product = await Product.findById(line.product);

        // do in product helper
        await productHelper.complete(product, line, orderStatus);

        // update product
        await this.eden.hook('product.sold', product, line, async () => {
          // set qty
          const qty = parseInt(line.qty, 10);

          // check qty
          if (!qty) return;

          // lock product
          await product.lock();

          // do try/catch
          try {
            // create new sold entry for stats
            const sold = new Sold({
              qty     : line.qty,
              price   : line.price,
              order   : orderStatus,
              total   : line.total,
              product : {
                id    : line.product,
                model : 'product',
              },
            });

            // save sold
            await sold.save();

            // set new qty
            product.set('availability.quantity', parseInt(product.get('availability.quantity') || 0, 10) - qty);

            // save product
            await product.save();
          } catch (e) {}

          // unlock product
          product.unlock();
        });
      }));
    }
  }
}

/**
 * export order daemon
 *
 * @type {OrderDaemon}
 */
exports = module.exports = OrderDaemon;
