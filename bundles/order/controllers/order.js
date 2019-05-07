
// bind dependencies
const config     = require('config');
const Controller = require('controller');

// require models
const Sold    = model('sold');
const Order   = model('order');
const Product = model('product');

// require helpers
const GridHelper    = helper('grid');
const orderHelper   = helper('order');
const emailHelper   = helper('email');
const modelHelper   = helper('model');
const productHelper = helper('product');

/**
 * build cart controller
 *
 * @mount /order
 */
class OrderController extends Controller {
  /**
   * construct user cart controller
   */
  constructor() {
    // run super
    super();

    // bind build method
    this.build = this.build.bind(this);

    // bind private methods
    this._status = this._status.bind(this);

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
    // on order change
    this.eden.pre('order.create', this._status);
    this.eden.pre('order.update', this._status);
  }


  // ////////////////////////////////////////////////////////////////////////////
  //
  // LIVE METHODS
  //
  // ////////////////////////////////////////////////////////////////////////////

  /**
   * Socket listen action
   *
   * @param  {String} id
   * @param  {Object} opts
   *
   * @call   model.listen.order
   * @return {Async}
   */
  async liveListenAction(id, uuid, opts) {
    // Get server
    const viewOrder = await Order.findById(id);

    // Get admins
    if (!opts.user || opts.user.get('_id').toString() !== viewOrder.get('user.id')) return;

    // Add to room
    opts.socket.join(`order.${id}`);

    // Add to room
    return await modelHelper.listen(opts.sessionID, viewOrder, uuid);
  }

  /**
   * Socket listen action
   *
   * @param  {String} id
   * @param  {Object} opts
   *
   * @call   model.deafen.order
   * @return {Async}
   */
  async liveDeafenAction(id, uuid, opts) {
    // Get server
    const viewOrder = await Order.findById(id);

    // Get admins
    if (!opts.user || opts.user.get('_id').toString() !== viewOrder.get('user.id')) return;

    // Add to room
    opts.socket.leave(`order.${id}`);

    // Add to room
    return await modelHelper.deafen(opts.sessionID, viewOrder, uuid);
  }


  // ////////////////////////////////////////////////////////////////////////////
  //
  // ACTION METHODS
  //
  // ////////////////////////////////////////////////////////////////////////////

  /**
   * view order index
   *
   * @menu   {MAIN}     Orders
   * @param  {Request}  req
   * @param  {Response} res
   *
   * @acl   true
   * @icon  fa fa-box-heart
   * @fail  /
   * @route {get} /
   */
  async indexAction(req, res) {
    // render index
    res.render('order/index', {
      grid : await (await this._grid(req)).render(req),
    });
  }

  /**
   * view order action
   *
   * @param  {Request}  req
   * @param  {Response} res
   *
   * @route {get} /:id
   */
  async viewAction(req, res) {
    // get order
    const viewOrder = await Order.findById(req.params.id);

    // check user
    if (req.user && await viewOrder.get('user') && (await viewOrder.get('user')).get('_id').toString() !== req.user.get('_id').toString()) {
      // redirect
      return res.redirect('/');
    }

    // render order page
    res.render('order', {
      title : `View Order #${viewOrder.get('_id').toString()}`,
      order : await viewOrder.sanitise(),
    });
  }

  /**
   * order call action
   *
   * @param  {Array}  lines
   * @param  {Array}  actions
   * @param  {Object} opts
   *
   * @call   order.create
   * @return {Promise}
   */
  async createAction(lines, actions, opts) {
    // create order for user
    return await (await orderHelper.create(opts.user, lines, actions)).sanitise();
  }

  /**
   * order grid
   *
   * @param  {Request}  req
   * @param  {Response} res
   *
   * @acl   true
   * @fail  /
   * @route {post} /grid
   */
  async gridAction(req, res) {
    // render index
    return (await this._grid(req)).post(req, res);
  }


  // ////////////////////////////////////////////////////////////////////////////
  //
  // PRIVATE METHODS
  //
  // ////////////////////////////////////////////////////////////////////////////

  /**
   * pre order update
   *
   * @param  {order} Order
   */
  async _status(orderStatus) {
    // load invoice
    const invoice = await orderStatus.get('invoice');

    // check invoice
    if (!invoice) return;

    // sanitise invoice
    const sanitised = await invoice.sanitise();

    // set status
    if (orderStatus.get('status') !== 'paid' && sanitised.paid) {
      // emit paid
      invoice.set('status', 'paid');
      orderStatus.set('status', 'paid');

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

  /**
   * renders grid
   *
   * @return {grid}
   */
  _grid(req) {
    // create new grid
    const orderGrid = new GridHelper(req);

    // set route
    orderGrid.route('/order/grid');

    // set grid model
    orderGrid.row('order-row');
    orderGrid.model(Order);
    orderGrid.models(true);

    // add grid filters
    orderGrid.filter('status', {
      title : 'Status',
      type  : 'select',
      query : (param) => {
        if (!param.toString().length || param.toString() === 'all') return;

        // another where
        if (param === 'pending') {
          // add where
          orderGrid.or({
            status : param.toString().toLowerCase().trim(),
          }, {
            status : null,
          });
        } else {
          // add where
          orderGrid.where({
            status : param.toString().toLowerCase().trim(),
          });
        }
      },
      options : [
        {
          name  : 'All',
          value : 'all',
        },
        {
          name  : 'Pending',
          value : 'pending',
        },
        {
          name  : 'Completed',
          value : 'completed',
        },
        {
          name  : 'Paid',
          value : 'paid',
        },
      ],
    });

    // add where
    orderGrid.where({
      'user.id' : req.user.get('_id').toString(),
    }).ne('invoice', null);

    // set default sort order
    orderGrid.sort('created_at', -1);

    // return grid
    return orderGrid;
  }
}

/**
 * export cart controller
 *
 * @type {OrderController}
 */
exports = module.exports = OrderController;
