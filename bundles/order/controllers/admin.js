
// bind dependencies
const Grid        = require('grid');
const formatter   = require('currency-formatter');
const Controller  = require('controller');
const escapeRegex = require('escape-string-regexp');

// require models
const User    = model('user');
const Order   = model('order');
const Block   = model('block');
const Product = model('product');
const Payment = model('payment');

// bind local dependencies
const config = require('config');

// require helpers
const blockHelper = helper('cms/block');

/**
 * build user admin controller
 *
 * @acl   admin.order.view
 * @fail  /
 * @mount /admin/shop/order
 */
class AdminOrderController extends Controller {
  /**
   * construct user admin controller
   */
  constructor() {
    // run super
    super();

    // bind methods
    this.gridAction = this.gridAction.bind(this);
    this.indexAction = this.indexAction.bind(this);
    this.createAction = this.createAction.bind(this);
    this.updateAction = this.updateAction.bind(this);
    this.removeAction = this.removeAction.bind(this);
    this.createSubmitAction = this.createSubmitAction.bind(this);
    this.updateSubmitAction = this.updateSubmitAction.bind(this);
    this.removeSubmitAction = this.removeSubmitAction.bind(this);

    // bind private methods
    this._grid = this._grid.bind(this);

    // register simple block
    blockHelper.block('dashboard.cms.orders', {
      acl         : ['admin.shop'],
      for         : ['admin'],
      title       : 'Orders Grid',
      description : 'Shows grid of recent orders',
    }, async (req, block) => {
      // get notes block from db
      const blockModel = await Block.findOne({
        uuid : block.uuid,
      }) || new Block({
        uuid : block.uuid,
        type : block.type,
      });

      // create new req
      const fauxReq = {
        query : blockModel.get('state') || {},
      };

      // return
      return {
        tag   : 'grid',
        name  : 'Orders',
        grid  : await this._grid(req).render(fauxReq),
        class : blockModel.get('class') || null,
        title : blockModel.get('title') || '',
      };
    }, async (req, block) => {
      // get notes block from db
      const blockModel = await Block.findOne({
        uuid : block.uuid,
      }) || new Block({
        uuid : block.uuid,
        type : block.type,
      });

      // set data
      blockModel.set('class', req.body.data.class);
      blockModel.set('state', req.body.data.state);
      blockModel.set('title', req.body.data.title);

      // save block
      await blockModel.save(req.user);
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
  async indexAction(req, res) {
    // render grid
    res.render('order/admin', {
      grid : await (await this._grid(req)).render(req),
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
  createAction(req, res) {
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
  async updateAction(req, res) {
    // set website variable
    let order  = new Order();
    let create = true;

    // check for website model
    if (req.params.id) {
      // load by id
      order = await Order.findById(req.params.id);
      create = false;
    }

    // render page
    res.render('order/admin/update', {
      title : create ? 'Create Order' : `Update ${order.get('_id').toString()}`,
      order : await order.sanitise(),
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
  createSubmitAction(req, res) {
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
  async updateSubmitAction(req, res) {
    // set website variable
    let order  = new Order();
    let create = true;

    // check for website model
    if (req.params.id) {
      // load by id
      order = await Order.findById(req.params.id);
      create = false;
    }

    // await hook
    await this.eden.hook('order.submit', req, order);

    // save order
    await order.save(req.user);

    // send alert
    req.alert('success', `Successfully ${create ? 'Created' : 'Updated'} order!`);

    // render page
    res.render('order/admin/update', {
      title : create ? 'Create Order' : `Update ${order.get('_id').toString()}`,
      order : await order.sanitise(),
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
  async removeAction(req, res) {
    // set website variable
    let order = false;

    // check for website model
    if (req.params.id) {
      // load user
      order = await Order.findById(req.params.id);
    }

    // render page
    res.render('order/admin/remove', {
      title : `Remove ${order.get('_id').toString()}`,
      order : await order.sanitise(),
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
  async removeSubmitAction(req, res) {
    // set website variable
    let order = false;

    // check for website model
    if (req.params.id) {
      // load user
      order = await Order.findById(req.params.id);
    }

    // alert Removed
    req.alert('success', `Successfully removed ${order.get('_id').toString()}`);

    // delete website
    await order.remove(req.user);

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
  async gridAction(req, res) {
    // return post grid request
    return (await this._grid(req)).post(req, res);
  }

  /**
   * renders grid
   *
   * @return {grid}
   */
  _grid(req) {
    // create new grid
    const orderGrid = new Grid();

    // set route
    orderGrid.route('/admin/shop/order/grid');

    // set grid model
    orderGrid.model(Order);

    // add grid columns
    orderGrid.column('_id', {
      title  : 'ID',
      format : async (col) => {
        return col ? col.toString() : '<i>N/A</i>';
      },
    })
      .column('user', {
        sort   : true,
        title  : 'User',
        format : async (col, row) => {
          // get user
          const user = await row.get('user');

          // return user name
          return user ? `<a href="/admin/user/${user.get('_id').toString()}/update">${user.name() || user.get('email')}</a>` : (row.get('address.name') || 'Anonymous');
        },
      })
      .column('lines', {
        sort   : true,
        title  : 'Lines',
        format : async (col, row) => {
          // get invoice
          const lines = await row.get('lines');

          // get products
          return (await Promise.all(lines.map(async (line) => {
            // get product
            const product = await Product.findById(line.product);

            // return value
            return `${line.qty || 1}x <a href="/admin/shop/product/${product.get('_id').toString()}/update">${product.get(`title.${req.language}`)}</a>`;
          }))).join(', ');
        },
      })
      .column('total', {
        sort   : true,
        title  : 'Total',
        format : async (col, row) => {
          // get invoice
          const invoice = await row.get('invoice');

          // check invoice
          if (!invoice || !invoice.get('total')) return '<i>N/A</i>';

          // return invoice total
          return formatter.format(invoice.get('total'), {
            code : invoice.get('currency') || config.get('shop.currency') || 'USD',
          });
        },
      })
      .column('status', {
        sort   : true,
        title  : 'Status',
        format : (col) => {
          return req.t(`order.status.${col || 'pending'}`);
        },
      })
      .column('payments', {
        sort   : false,
        title  : 'Payments',
        format : async (col, row) => {
        // get invoice
          const invoice  = await row.get('invoice');
          const payments = await Payment.find({
            'invoice.id' : invoice ? invoice.get('_id').toString() : null,
          });

          // get paid
          return payments.map(payment => `<a href="/admin/shop/payment/${payment.get('_id').toString()}/update">${payment.get('_id').toString()}</a>`);
        },
      })
      .column('paid', {
        sort   : false,
        title  : 'Paid',
        format : async (col, row) => {
        // get invoice
          const invoice = await row.get('invoice');
          const payment = await Payment.findOne({
            'invoice.id' : invoice ? invoice.get('_id').toString() : null,
          });

          // get paid
          return payment && payment.get('complete') ? '<span class="btn btn-sm btn-success">Paid</span>' : '<span class="btn btn-sm btn-danger">Unpaid</span>';
        },
      })
      .column('actions.payment.value.type', {
        sort   : true,
        title  : 'Method',
        format : (col) => {
          // get paid
          return col ? req.t(`${col}.title`) : '<i>N/A</i>';
        },
      })
      .column('updated_at', {
        sort   : true,
        title  : 'Updated',
        format : (col) => {
          return col.toLocaleDateString('en-GB', {
            day   : 'numeric',
            month : 'short',
            year  : 'numeric',
          });
        },
      })
      .column('created_at', {
        sort   : true,
        title  : 'Created',
        format : async (col) => {
          return col.toLocaleDateString('en-GB', {
            day   : 'numeric',
            month : 'short',
            year  : 'numeric',
          });
        },
      })
      .column('actions', {
        type   : false,
        width  : '1%',
        title  : 'Actions',
        format : async (col, row) => {
          return [
            '<div class="btn-group btn-group-sm" role="group">',
            `<a href="/admin/shop/order/${row.get('_id').toString()}/update" class="btn btn-primary"><i class="fa fa-pencil"></i></a>`,
            `<a href="/admin/shop/order/${row.get('_id').toString()}/remove" class="btn btn-danger"><i class="fa fa-times"></i></a>`,
            '</div>',
          ].join('');
        },
      });

    // add grid filters
    orderGrid.filter('name', {
      type  : 'text',
      title : 'Name',
      query : async (param) => {
        // check param
        if (!param || !param.length) return;

        // get users
        const users = await User.match('username', new RegExp(escapeRegex(param.toString().toLowerCase()), 'i')).find();

        // user id in
        orderGrid.or({
          'user.id' : {
            $in : users.map(user => user.get('_id').toString()),
          },
        }, {
          'address.name' : new RegExp(escapeRegex(param.toString().toLowerCase()), 'i'),
        });
      },
    }).filter('email', {
      type  : 'text',
      title : 'Email',
      query : async (param) => {
        // check param
        if (!param || !param.length) return;

        // get users
        const users = await User.match('email', new RegExp(escapeRegex(param.toString().toLowerCase()), 'i')).find();

        // user id in
        orderGrid.in('user.id', users.map(user => user.get('_id').toString()));
      },
    }).filter('product', {
      type  : 'text',
      title : 'Product',
      query : async (param) => {
        // check param
        if (!param || !param.length) return;

        // get users
        const products = await Product.match(`title.${req.language}`, new RegExp(escapeRegex(param.toString().toLowerCase()), 'i')).find();

        // user id in
        orderGrid.elem('lines', {
          product : {
            $in : products.map(product => product.get('_id').toString()),
          },
        });
      },
    }).filter('status', {
      type  : 'text',
      title : 'Status',
      query : async (param) => {
        // check param
        if (!param || !param.length) return;

        // check pending
        if (param === 'pending') {
          // pending
          return orderGrid.or({
            status : 'pending',
          }, {
            status : null,
          });
        }

        // user id in
        orderGrid.where({
          status : param,
        });
      },
    });

    // set default sort order
    orderGrid.sort('created_at', -1);
    orderGrid.elem('lines', {
      qty : {
        $gt : 0,
      },
    });

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
