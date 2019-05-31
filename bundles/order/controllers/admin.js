
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
const fieldHelper = helper('form/field');

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
    this.build = this.build.bind(this);
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

    // set building
    this.building = this.build();
  }


  // ////////////////////////////////////////////////////////////////////////////
  //
  // BUILD METHODS
  //
  // ////////////////////////////////////////////////////////////////////////////

  /**
   * build method
   *
   * @return {Promise}
   */
  async build() {
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
        user  : req.user,
        query : blockModel.get('state') || {},
      };

      // return
      return {
        tag   : 'grid',
        name  : 'Orders',
        grid  : await (await this._grid(req, blockModel.get('_id') ? blockModel.get('_id').toString() : null)).render(fauxReq),
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

    // register simple field
    fieldHelper.field('order', {
      for         : ['frontend', 'admin'],
      title       : 'User',
      description : 'Order field',
    }, async (req, field, value) => {
      // set tag
      field.tag = 'order';
      // eslint-disable-next-line no-nested-ternary
      field.value = value ? (Array.isArray(value) ? await Promise.all(value.map(item => item.sanitise())) : await value.sanitise()) : null;

      // return
      return field;

      // eslint-disable-next-line no-unused-vars
    }, async (req, field) => {
      // save field
    }, async (req, field, value, old) => {
      // check value
      if (!Array.isArray(value)) value = [value];

      // return value map
      return await Promise.all((value || []).filter(val => val).map(async (val, i) => {
        // run try catch
        try {
          // buffer company
          const acl = await Order.findById(val);

          // check company
          if (acl) return acl;

          // return null
          return null;
        } catch (e) {
          // return old
          return old[i];
        }
      }));
    });
  }


  // ////////////////////////////////////////////////////////////////////////////
  //
  // ACTION METHODS
  //
  // ////////////////////////////////////////////////////////////////////////////

  /**
   * index action
   *
   * @param {Request}  req
   * @param {Response} res
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
   * index action
   *
   * @param req
   * @param res
   *
   * @acl   admin
   * @fail  next
   * @route {GET} /query
   */
  async queryAction(req, res) {
    // find children
    let orders = Order.ne('status', 'paid');

    // set query
    if (req.query.q) {

    }

    // add roles
    orders = await orders.skip(((parseInt(req.query.page, 10) || 1) - 1) * 20).limit(20).sort('name', 1)
      .find();

    // get children
    res.json((await Promise.all(orders.map(order => order.sanitise()))).map((sanitised) => {
      // return object
      return {
        text : `#${sanitised.id.substring(0, 4)}...${sanitised.id.substr(-4, 4)} | ${sanitised.lines.map((line) => {
          // return text
          return `${line.qty}x ${sanitised.products.find(prod => prod.id === line.product).title[req.language]} $${line.total.toFixed(2)}`;
        }).join(', ')}`,
        value : sanitised.id,
      };
    }));
  }

  /**
   * index action
   *
   * @param req
   * @param res
   *
   * @acl   admin
   * @fail  next
   * @route {GET} /:id/get
   */
  async getAction(req, res) {
    // set website variable
    let order  = new Order();
    let create = true;

    // check for website model
    if (req.params.id) {
      // load by id
      order = await Order.findById(req.params.id);
      create = false;
    }

    // return json
    return res.json({
      result  : await order.sanitise(),
      success : true,
    });
  }

  /**
   * add/edit action
   *
   * @param {Request}  req
   * @param {Response} res
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
   * @param {Request}  req
   * @param {Response} res
   *
   * @route   {get} /:id/view
   * @layout  admin
   */
  async viewAction(req, res) {
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
    res.render('order/admin/view', {
      title : `View ${order.get('_id').toString()}`,
      order : await order.sanitise(),
    });
  }

  /**
   * update action
   *
   * @param {Request}  req
   * @param {Response} res
   *
   * @route   {get} /:id/print
   * @layout  print
   */
  async printAction(req, res) {
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
    res.render('order/admin/view', {
      title : `View ${order.get('_id').toString()}`,
      order : await order.sanitise(),
    });
  }

  /**
   * update action
   *
   * @param {Request}  req
   * @param {Response} res
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
   * @param {Request}  req
   * @param {Response} res
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
   * @param {Request}  req
   * @param {Response} res
   *
   * @route   {post} /:id/update
   * @layout  admin
   */
  async updateSubmitAction(req, res) {
    // set website variable
    let order  = new Order();
    let create = true;

    // check for website model
    if (req.params.id || req.body.order) {
      // load by id
      order = await Order.findById(req.params.id || req.body.order);
      create = false;
    }

    // check body
    if (req.body.lines) {
      // set lines
      order.set('lines', req.body.lines);
    }

    // await hook
    await this.eden.hook('order.submit', req, order);

    // save order
    await order.save(req.user);

    // send alert
    req.alert('success', `Successfully ${create ? 'Created' : 'Updated'} order!`);

    // render page
    res.json({
      result  : await order.sanitise(),
      success : true,
    });
  }

  /**
   * delete action
   *
   * @param {Request}  req
   * @param {Response} res
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
   * @param {Request}  req
   * @param {Response} res
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
   * delete action
   *
   * @param {Request}  req
   * @param {Response} res
   *
   * @route   {get} /:id/cancel
   * @layout  admin
   */
  async cancelAction(req, res) {
    // set website variable
    let order = false;

    // check for website model
    if (req.params.id) {
      // load user
      order = await Order.findById(req.params.id);
    }

    // render page
    res.render('order/admin/cancel', {
      title : `Remove ${order.get('_id').toString()}`,
      order : await order.sanitise(),
    });
  }

  /**
   * delete action
   *
   * @param {Request}  req
   * @param {Response} res
   *
   * @route   {post} /:id/remove
   * @title   order Administration
   * @layout  admin
   */
  async cancelSubmitAction(req, res) {
    // set website variable
    let order = false;

    // check for website model
    if (req.params.id) {
      // load user
      order = await Order.findById(req.params.id);
    }

    // alert Removed
    req.alert('success', `Successfully cancelled ${order.get('_id').toString()}`);

    // set status
    order.set('status', 'cancelled');

    // delete website
    await order.save(req.user);

    // render index
    return this.indexAction(req, res);
  }

  /**
   * user grid action
   *
   * @param {Request}  req
   * @param {Response} res
   *
   * @route {get}  /grid
   * @route {post} /grid
   */
  async gridAction(req, res) {
    // return post grid request
    return (await this._grid(req)).post(req, res);
  }


  // ////////////////////////////////////////////////////////////////////////////
  //
  // PRIVATE METHODS
  //
  // ////////////////////////////////////////////////////////////////////////////

  /**
   * renders grid
   *
   * @param {Request} req
   * @param {String}  id
   *
   * @return {grid}
   */
  async _grid(req, id) {
    // create new grid
    const orderGrid = new Grid();

    // set route
    orderGrid.route('/admin/shop/order/grid');

    // set grid model
    orderGrid.model(Order);

    // set id
    if (id) orderGrid.id(id);

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
          // return user name
          return col ? `<a href="/admin/user/${col.get('_id').toString()}/update">${col.name() || col.get('email')}</a>` : (row.get('address.name') || 'Anonymous');
        },
        export : async (col, row) => {
          // return user name
          return col ? (col.name() || col.get('email')) : (row.get('address.name') || 'Anonymous');
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
          }))).join(',<br>');
        },
        export : async (col, row) => {
          // get invoice
          const lines = await row.get('lines');

          // get products
          return (await Promise.all(lines.map(async (line) => {
            // get product
            const product = await Product.findById(line.product);

            // return value
            return `${line.qty || 1}x ${product.get(`title.${req.language}`)}`;
          }))).join(', ');
        },
      })
      .column('total', {
        sort   : true,
        title  : 'Total',
        format : async (col, row) => {
          // get invoice
          const invoice = await row.get('invoice');

          // return invoice total
          return formatter.format((invoice ? invoice.get('total') : row.get('total')) || row.get('lines').reduce((accum, line) => {
            // return value
            return accum + line.total;
          }, 0), {
            code : (invoice ? invoice.get('currency') : null) || config.get('shop.currency') || 'USD',
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
      .column('invoice', {
        sort   : false,
        title  : 'Invoice',
        format : async (col) => {
          // get paid
          return col ? `<a href="/admin/shop/invoice/${col.get('_id').toString()}/update">${col.get('_id').toString()}</a>` : '<i>N/A</i>';
        },
        export : async (col) => {
          // get invoice
          return col ? col.get('_id').toString() : '';
        },
      })
      .column('paid', {
        sort   : false,
        title  : 'Paid',
        format : async (col, row) => {
        // get invoice
          const invoice = await row.get('invoice');

          // get paid
          return invoice && (await invoice.sanitise()).paid ? '<span class="btn btn-sm btn-success">Paid</span>' : '<span class="btn btn-sm btn-danger">Unpaid</span>';
        },
      })
      .column('method', {
        sort   : true,
        title  : 'Method(s)',
        format : async (col, row) => {
          // get payments
          const payments = await Payment.where({
            complete     : true,
            'invoice.id' : row.get('invoice.id') || 'null',
          }).find();

          // return payments
          return payments.length ? payments.map(payment => `<a href="/admin/shop/payment/${payment.get('_id')}/update">$${payment.get('amount').toFixed(2)} ${payment.get('currency')}, by ${payment.get('method.type')}</a>`).join(',<br>') : '<i>N/A</i>';
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
        tag    : 'order-actions',
        width  : '1%',
        title  : 'Actions',
        export : false,
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
          orderGrid.or({
            status : 'pending',
          }, {
            status : null,
          });

          // return no value
          return;
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

    // do hook
    await this.eden.hook('shop.admin.order.grid', {
      req,
      grid : orderGrid,
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
