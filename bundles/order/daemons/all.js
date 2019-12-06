/* eslint-disable no-empty */

// bind dependencies
const config = require('config');
const Daemon = require('daemon');
const moment = require('moment');
const uuid   = require('uuid');

// require models
const Sold    = model('sold');
const Invoice = model('invoice');
const Product = model('product');
const Order   = model('order');

// require helpers
const emailHelper   = helper('email');
const productHelper = helper('product');

/**
 * build cart controller
 */
class AllOrderDaemon extends Daemon {
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
    console.log('orderUpdateHook');
    console.log(orderStatus);
    // load invoice
    const invoice = await orderStatus.get('invoice') || await Invoice.findOne({
      'orders.id' : orderStatus.get('_id') ? orderStatus.get('_id') : 'null',
    });

    // Create Order No
    if (!orderStatus.get('orderno')) {
      const prefix = await orderStatus.get('customer');
      const orderno = 'Ord'+ (prefix ? prefix.get('uid') : [...Array(5)].map(i=>(~~(Math.random()*36)).toString(36)).join('')) + moment().format("MD")+[...Array(2)].map(i=>(~~(Math.random()*36)).toString(36)).join('');
      orderStatus.set('orderno', orderno);
    }

    orderStatus.get('lines').map(l => {
      !l.uuid ? l.uuid = uuid() : '';
    });

    // check invoice
    if (!invoice) return;

    //Update Invoice total
    const ototal = invoice.get('total') ? invoice.get('total') : 0;
    let ninvtotal = 0;
    (await invoice.get('orders') || []).map(o => o.get('_id') !== orderStatus.get('_id') ? ninvtotal += parseFloat(o.get('total')) : '');
    ninvtotal += orderStatus.get('total') ? parseFloat(orderStatus.get('total')) : 0;
    console.log(ototal);
    console.log(ninvtotal);
    if (ototal !== ninvtotal) {
      invoice.set('total', ninvtotal);
      invoice.save();
    }

    // set invoice
    orderStatus.set('invoice', invoice);

    // check pending paid
    if (!await invoice.hasPaid() && await invoice.hasApproval() && orderStatus.get('status') !== 'approval') {
      // set order
      orderStatus.set('status', 'approval');

      // save order
      await orderStatus.save(await orderStatus.get('user'));
    }

    // set status
    if (!orderStatus.get('complete') && await invoice.hasPaid()) {
      // set order
      orderStatus.set('status', 'paid');
      orderStatus.set('complete', new Date());

      // save order
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
        if (orderStatus.get('customer')) {
          const customer = await orderStatus.get('customer');
          address = customer.get('email');
        }
        // get email
        if (!address) address = await orderStatus.get('user') ? (await orderStatus.get('user')).get('email') : null;
        if (!address) address = await orderStatus.get('address') ? (await orderStatus.get('address')).get('email') : null;
      } catch (e) {
        console.log(e);
      }

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
        } catch (e) {}
      }

      // loop items
      await Promise.all(orderStatus.get('lines').map(async (line) => {
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
    console.log(orderStatus);
  }
}

/**
 * export order daemon
 *
 * @type {AllOrderDaemon}
 */
module.exports = AllOrderDaemon;
