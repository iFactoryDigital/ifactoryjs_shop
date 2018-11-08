// Use strict

// Require dependencies
const Daemon = require('daemon');

// Require models
const Order   = model('order');
const Product = model('product');
const Payment = model('payment');

// Require helpers
const chatHelper = helper('chat');

/**
 * Build dameon class
 *
 * @compute 4
 */
class ChatSaleDaemon extends Daemon {

  /**
   * Construct rentlar daemon class
   */
  constructor () {
    // Run super eden
    super();

    this.build();
  }

  /**
   * Builds daemon
   */
  build () {
    // Emit create
    this.eden.on('order.paid', async (order) => {
      // Await order
      await this._order(await Order.findById(order.id));
    }, true);
  }

  /**
   * Set paid order
   *
   * @param  {Order}  paidOrder
   */
  async _order (paidOrder) {
    await paidOrder.lock();

    try {
      let user      = await paidOrder.get('user');
      let invoice   = await paidOrder.get('invoice');
      let payment   = await Payment.where('invoice.id', invoice.get('_id').toString()).findOne();
      let affiliate = await invoice.get('code');

      let fields = [{
        'name'  : 'When',
        'value' : paidOrder.get('created_at').toLocaleString()
      }, {
        'name'  : 'Name',
        'value' : user.get('email') || user.get('username')
      }, {
        'name'  : 'Amount',
        'value' : '$' + invoice.get('total').toFixed(2) + ' USD'
      }, {
        'name'  : 'Method',
        'value' : payment ? payment.get('method.type') : 'N/A'
      }, {
        'name'  : 'Discount',
        'value' : '$' + (invoice.get('discount') || 0).toFixed(2) + ' USD'
      }];

      if (affiliate) {
        fields.push(...[{
          'name'  : 'Affiliate',
          'value' : '$' + ((invoice.get('actual') || invoice.get('total')) * (affiliate.get('rate') / 100)).toFixed(2) + ' USD'
        }, {
          'name'  : 'Code',
          'value' : affiliate.get('code')
        }]);
      }

      fields.push({
        'name'  : 'Items',
        'value' : (await Promise.all(paidOrder.get('lines').map(async (line) => {
          let product = await Product.findById(line.product);

          let item = {
            'qty'     : line.qty,
            'opts'    : line.opts || {},
            'user'    : await paidOrder.get('user'),
            'product' : await product
          };

          await this.eden.hook('product.order', item);

          let opts = {
            'qty'   : parseInt(line.qty),
            'item'  : item,
            'base'  : (parseFloat(item.price) || 0),
            'price' : (parseFloat(item.price) || 0) * parseInt(line.qty),
            'order' : Order
          };

          await this.eden.hook('line.price', opts);

          return '$' + opts.price.toFixed(2) + ' USD • ' + line.qty + ' X ' + product.get('title.en-us') + ' (' + line.opts.slots + ' slots)';
        }))).join('\n\n')
      });

      await chatHelper.sendAdminMessage({
        'fields' : fields,
        'color'  : 'success',
        'title'  : 'Order Completed'
      }, 'sale');

      let admin = paidOrder.get('admin') || {};

      if (!admin.alerted) admin.alerted = [];

      if (admin.alerted.includes('chat')) {
        paidOrder.unlock();

        return;
      }

      admin.alerted.push('chat');

      paidOrder.set('admin', admin);
      await paidOrder.save();
    } catch (e) {
      console.error(e);
    }

    // Unlock
    paidOrder.unlock();
  }
}

/**
 * Export daemon class
 *
 * @type {ChatSaleDaemon}
 */
module.exports = ChatSaleDaemon;
