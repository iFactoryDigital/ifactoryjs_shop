
// bind dependencies
const config     = require('config');
const socket     = require('socket');
const Controller = require('controller');

// require models
const Order = model('order');

// require helpers
const GridHelper  = helper('grid');
const OrderHelper = helper('order');
const ModelHelper = helper('model');

/**
 * build cart controller
 *
 * @mount /order
 */
class OrderController extends Controller {
  /**
   * construct user cart controller
   */
  constructor () {
    // run super
    super();

    // bind build method
    this.build = this.build.bind(this);

    // bind private methods
    this._status = this._status.bind(this);

    // build order controller
    this.build();
  }

  /**
   * builds order controller
   */
  build () {
    // on order change
    this.eden.pre('order.create', this._status);
    this.eden.pre('order.update', this._status);
  }

  /**
   * Socket listen action
   *
   * @param  {String} id
   * @param  {Object} opts
   *
   * @call   model.listen.order
   * @return {Async}
   */
  async liveListenAction (id, uuid, opts) {
    // Get server
    let viewOrder = await Order.findById(id);

    // Get admins
    if (opts.user.get('_id').toString() !== viewOrder.get('user.id')) return;

    // Add to room
    opts.socket.join('order.' + id);

    // Add to room
    return await ModelHelper.listen(opts.sessionID, viewOrder, uuid);
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
  async liveDeafenAction (id, uuid, opts) {
    // Get server
    let viewOrder = await Order.findById(id);

    // Get admins
    if (opts.user.get('_id').toString() !== viewOrder.get('user.id')) return;

    // Add to room
    opts.socket.leave('order.' + id);

    // Add to room
    return await ModelHelper.deafen(opts.sessionID, viewOrder, uuid);
  }

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
  async indexAction (req, res) {
    // render index
    res.render('order/index', {
      'grid' : await (await this._grid(req)).render(req)
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
  async viewAction (req, res) {
    // get order
    let viewOrder = await Order.findById(req.params.id);

    // check user
    if (await viewOrder.get('user') && (await viewOrder.get('user')).get('_id').toString() !== req.user.get('_id').toString()) {
      // redirect
      return res.redirect('/');
    }

    // render order page
    res.render('order', {
      'title' : 'View Order #' + viewOrder.get('_id').toString(),
      'order' : await viewOrder.sanitise()
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
  async createAction (lines, actions, opts) {
    // create order for user
    return await (await OrderHelper.create(opts.user, lines, actions)).sanitise();
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
  async gridAction (req, res) {
    // render index
    return (await this._grid(req)).post(req, res);
  }

  /**
   * pre order update
   *
   * @param  {order} Order
   */
  async _status (orderStatus) {
    // load invoice
    let invoice = await orderStatus.get('invoice');

    // check invoice
    if (!invoice) return;

    // sanitise invoice
    let sanitised = await invoice.sanitise();

    // set status
    if (orderStatus.get('status') !== 'paid' && sanitised.paid) {
      // emit paid
      orderStatus.set('status', 'paid');

      // save order
      await orderStatus.save();

      // emit create
      this.eden.emit('order.paid', {
        'id'    : orderStatus.get('_id').toString(),
        'model' : 'order'
      }, true);
    }
  }

  /**
   * renders grid
   *
   * @return {grid}
   */
  _grid (req) {
    // create new grid
    let orderGrid = new GridHelper(req);

    // set route
    orderGrid.route('/order/grid');

    // set grid model
    orderGrid.live(true);
    orderGrid.type('sanitise');
    orderGrid.model(Order);

    // add grid filters
    orderGrid.filter ('status', {
      'title' : 'Status',
      'type'  : 'select',
      'query' : (param) => {
        if (!param.toString().length || param.toString() === 'all') return;

        // another where
        if (param === 'pending') {
          // add where
          orderGrid.or({
            'status' : param.toString().toLowerCase().trim()
          }, {
            'status' : null
          });
        } else {
          // add where
          orderGrid.where({
            'status' : param.toString().toLowerCase().trim()
          });
        }
      },
      'options' : [
        {
          'name' : 'All',
          'value' : 'all'
        },
        {
          'name'  : 'Pending',
          'value' : 'pending'
        },
        {
          'name'  : 'Completed',
          'value' : 'completed'
        },
        {
          'name'  : 'Paid',
          'value' : 'paid'
        }
      ]
    });

    // add where
    orderGrid.where({
      'user.id' : req.user.get('_id').toString()
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
