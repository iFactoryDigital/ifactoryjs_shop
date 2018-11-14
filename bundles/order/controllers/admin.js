
// bind dependencies
const Grid       = require('grid');
const alert      = require('alert');
const crypto     = require('crypto');
const formatter  = require('currency-formatter');
const Controller = require('controller');

// require models
const User    = model('user');
const Order   = model('order');
const Block   = model('block');
const Payment = model('payment');

// bind local dependencies
const config = require('config');

// require helpers
const BlockHelper = helper('cms/block');

/**
 * build user admin controller
 *
 * @acl   admin.order.view
 * @fail  /
 * @mount /admin/order
 */
class AdminOrderController extends Controller {
  /**
   * construct user admin controller
   */
  constructor () {
    // run super
    super();

    // bind methods
    this.gridAction         = this.gridAction.bind(this);
    this.indexAction        = this.indexAction.bind(this);
    this.createAction       = this.createAction.bind(this);
    this.updateAction       = this.updateAction.bind(this);
    this.removeAction       = this.removeAction.bind(this);
    this.createSubmitAction = this.createSubmitAction.bind(this);
    this.updateSubmitAction = this.updateSubmitAction.bind(this);
    this.removeSubmitAction = this.removeSubmitAction.bind(this);

    // bind private methods
    this._grid = this._grid.bind(this);

    // register simple block
    BlockHelper.block('dashboard.cms.orders', {
      'acl'         : ['admin.shop'],
      'for'         : ['dashboard'],
      'title'       : 'Orders Grid',
      'description' : 'Shows grid of recent orders'
    }, async (req, block) => {
      // get notes block from db
      let blockModel = await Block.findOne({
        'uuid' : block.uuid
      }) || new Block({
        'uuid' : block.uuid,
        'type' : block.type
      });

      // create new req
      let fauxReq = {
        'query' : blockModel.get('state') || {}
      };

      // return
      return {
        'tag'   : 'grid',
        'name'  : 'Orders',
        'grid'  : await this._grid(req).render(fauxReq),
        'title' : blockModel.get('title') || ''
      };
    }, async (req, block) => {
      // get notes block from db
      let blockModel = await Block.findOne({
        'uuid' : block.uuid
      }) || new Block({
        'uuid' : block.uuid,
        'type' : block.type
      });

      // set data
      blockModel.set('state', req.body.data.state);
      blockModel.set('title', req.body.data.title);

      // save block
      await blockModel.save();
    });
  }

  /**
   * index action
   *
   * @param req
   * @param res
   *
   * @icon    fa fa-box-heart
   * @menu    {ADMIN} Orders
   * @title   Order Administration
   * @route   {get} /
   * @layout  admin
   * @parent  /admin/shop
   */
  async indexAction (req, res) {
    // render grid
    res.render('order/admin', {
      'grid' : await this._grid(req).render(req)
    });
  }

  /**
   * add/edit action
   *
   * @param req
   * @param res
   *
   * @route    {get} /create
   * @layout   admin
   * @priority 12
   */
  createAction (req, res) {
    // return update action
    return this.updateAction(req, res);
  }

  /**
   * update action
   *
   * @param req
   * @param res
   *
   * @route   {get} /:id/update
   * @layout  admin
   */
  async updateAction (req, res) {
    // set website variable
    let order  = new Order();
    let create = true;

    // check for website model
    if (req.params.id) {
      // load by id
      order   = await Order.findById(req.params.id);
      create  = false;
    }

    // render page
    res.render('order/admin/update', {
      'title' : create ? 'Create Order' : 'Update ' + order.get('_id').toString(),
      'order' : await order.sanitise()
    });
  }

  /**
   * create submit action
   *
   * @param req
   * @param res
   *
   * @route   {post} /create
   * @layout  admin
   */
  createSubmitAction (req, res) {
    // return update action
    return this.updateSubmitAction(req, res);
  }

  /**
   * add/edit action
   *
   * @param req
   * @param res
   *
   * @route   {post} /:id/update
   * @layout  admin
   */
  async updateSubmitAction (req, res) {
    // set website variable
    let order  = new Order ();
    let create = true;

    // check for website model
    if (req.params.id) {
      // load by id
      order  = await Order.findById(req.params.id);
      create = false;
    }

    // await hook
    await this.eden.hook('order.submit', req, order);

    // save order
    await order.save();

    // send alert
    req.alert('success', 'Successfully ' + (create ? 'Created' : 'Updated') + ' order!');

    // render page
    res.render('order/admin/update', {
      'title' : create ? 'Create Order' : 'Update ' + order.get('_id').toString(),
      'order' : await order.sanitise()
    });
  }

  /**
   * delete action
   *
   * @param req
   * @param res
   *
   * @route   {get} /:id/remove
   * @layout  admin
   */
  async removeAction (req, res) {
    // set website variable
    let order = false;

    // check for website model
    if (req.params.id) {
      // load user
      order = await Order.findById(req.params.id);
    }

    // render page
    res.render('order/admin/remove', {
      'title' : 'Remove ' + order.get('_id').toString(),
      'order' : await order.sanitise()
    });
  }

  /**
   * delete action
   *
   * @param req
   * @param res
   *
   * @route   {post} /:id/remove
   * @title   order Administration
   * @layout  admin
   */
  async removeSubmitAction (req, res) {
    // set website variable
    let order = false;

    // check for website model
    if (req.params.id) {
      // load user
      order = await Order.findById(req.params.id);
    }

    // alert Removed
    req.alert('success', 'Successfully removed ' + (order.get('_id').toString()));

    // delete website
    await order.remove();

    // render index
    return this.indexAction(req, res);
  }

  /**
   * user grid action
   *
   * @param req
   * @param res
   *
   * @route {post} /grid
   */
  gridAction (req, res) {
    // return post grid request
    return this._grid(req).post(req, res);
  }

  /**
   * renders grid
   *
   * @return {grid}
   */
  _grid (req) {
    // create new grid
    let orderGrid = new Grid();

    // set route
    orderGrid.route('/admin/order/grid');

    // set grid model
    orderGrid.model(Order);

    // add grid columns
    orderGrid.column('_id', {
      'title'  : 'ID',
      'format' : async (col) => {
        return col ? col.toString() : '<i>N/A</i>';
      }
    }).column('user', {
      'sort'   : true,
      'title'  : 'User',
      'format' : async (col, row) => {
        // get user
        let user = await row.get('user');

        // return user name
        return user ? (user.name() || user.get('email')) : 'Anonymous';
      }
    }).column('total', {
      'sort'   : true,
      'title'  : 'Total',
      'format' : async (col, row) => {
        // get invoice
        let invoice = await row.get('invoice');

        // check invoice
        if (!invoice || !invoice.get('total')) return '<i>N/A</i>';

        // return invoice total
        return formatter.format(invoice.get('total'), {
          'code' : invoice.get('currency') || 'USD'
        });
      }
    }).column('status', {
      'sort'   : true,
      'title'  : 'Status',
      'format' : async (col, row) => {
        return !col ? 'Pending' : col;
      }
    }).column('paid', {
      'sort'   : true,
      'title'  : 'Paid',
      'format' : async (col, row) => {
        // get invoice
        let invoice = await row.get('invoice');
        let payment = await Payment.findOne({
          'invoice.id' : invoice ? invoice.get('_id').toString() : null
        });

        // get paid
        return payment && payment.get('complete') ? '<span class="btn btn-sm btn-success">Paid</span>' : '<span class="btn btn-sm btn-danger">Unpaid</span>';
      }
    }).column('updated_at', {
      'sort'   : true,
      'title'  : 'Updated',
      'format' : async (col) => {
        return col.toLocaleDateString('en-GB', {
          'day'   : 'numeric',
          'month' : 'short',
          'year'  : 'numeric'
        });
      }
    }).column('created_at', {
      'sort'   : true,
      'title'  : 'Created',
      'format' : async (col) => {
        return col.toLocaleDateString('en-GB', {
          'day'   : 'numeric',
          'month' : 'short',
          'year'  : 'numeric'
        });
      }
    }).column('actions', {
      'type'   : false,
      'width'  : '1%',
      'title'  : 'Actions',
      'format' : async (col, row) => {
        return [
          '<div class="btn-group btn-group-sm" role="group">',
            '<a href="/admin/order/' + row.get('_id').toString() + '/update" class="btn btn-primary"><i class="fa fa-pencil"></i></a>',
            '<a href="/admin/order/' + row.get('_id').toString() + '/remove" class="btn btn-danger"><i class="fa fa-times"></i></a>',
          '</div>'
        ].join('');
      }
    });

    // add grid filters
    orderGrid.filter('username', {
      'title' : 'Username',
      'type'  : 'text',
      'query' : async (param) => {
        // check param
        if (!param || !param.length) return;

        // get users
        let users = await User.match('username', new RegExp(escapeRegex(param.toString().toLowerCase()), 'i')).find();

        // user id in
        orderGrid.in('user.id', users.map((user) => user.get('_id').toString()));
      }
    }).filter('email', {
      'title' : 'Email',
      'type'  : 'text',
      'query' : async (param) => {
        // check param
        if (!param || !param.length) return;

        // get users
        let users = await User.match('email', new RegExp(escapeRegex(param.toString().toLowerCase()), 'i')).find();

        // user id in
        orderGrid.in('user.id', users.map((user) => user.get('_id').toString()));
      }
    });

    // set default sort order
    orderGrid.sort('created_at', 1);

    // return grid
    return orderGrid;
  }
}

/**
 * export admin controller
 *
 * @type {admin}
 */
exports = module.exports = AdminOrderController;
