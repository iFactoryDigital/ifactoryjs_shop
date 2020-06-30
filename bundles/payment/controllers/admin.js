
// bind dependencies
const Grid        = require('grid');
const Controller  = require('controller');
const escapeRegex = require('escape-string-regexp');
const moment      = require('moment');

// require models
const User    = model('user');
const Block   = model('block');
const Payment = model('payment');
const Order   = model('order');
const Audit   = model('audit');

// require helpers
const blockHelper = helper('cms/block');
const paymentHelper = helper('payment');

// bind local dependencies
const config = require('config');

/**
 * build user admin controller
 *
 * @acl   admin.payment.view
 * @fail  /
 * @mount /admin/shop/payment
 */
class AdminPaymentController extends Controller {
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

    // build
    this.building = this.build();
  }


  // ////////////////////////////////////////////////////////////////////////////
  //
  // BUILD METHODS
  //
  // ////////////////////////////////////////////////////////////////////////////

  /**
   * build payment admin controller
   *
   * @return {Promise}
   */
  async build() {
    // register simple block
    blockHelper.block('dashboard.cms.payments', {
      acl         : ['admin.shop'],
      for         : ['admin'],
      title       : 'Payments Grid',
      description : 'Shows grid of recent payments',
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
        name  : 'Payments',
        grid  : await (await this._grid(req)).render(fauxReq),
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


  // ////////////////////////////////////////////////////////////////////////////
  //
  // ACTION METHODS
  //
  // ////////////////////////////////////////////////////////////////////////////

  /**
   *
   * @param {Request} req
   * @param {Response} res
   *
   * @route  {post} /:id/verify
   * @return {*}
   */
  async verifyAction(req, res) {
    const payment = await Payment.findById(req.params.id);
    const verify = payment.get('verify') ? payment.get('verify') : false;

    payment.set('verifydate', req.body.verifydate ? req.body.verifydate : moment(new Date()).format('YYYY-MM-DD'));
    payment.set('verify', !verify);
    !verify ? payment.set('verifyamount', req.body.verifyamount ? req.body.verifyamount : payment.get('amount')) : payment.set('verifyamount', 0);
    !verify ? payment.set('verifynote', req.body.verifynote ? req.body.verifynote : '') : payment.set('unverifynote', req.body.verifynote ? req.body.verifynote : '');
    !verify ? payment.set('state', 'paid') : payment.set('state', 'approval');

    payment.save(req.user);

    await this.eden.hook('audit.record', req, { model: payment, modelold: null, updates: null, update : true, message : !verify ? `Varified payment ${payment.get('paymentno')} ${req.body.orderno ? 'Order No:'+req.body.orderno : ''} Date: ${payment.get('verifydate')} Amount: ${payment.get('verifyamount')}` : `Unvarified payment ${payment.get('paymentno')} ${req.body.orderno ? 'Order No:'+req.body.orderno : ''} Date: ${payment.get('verifydate')}`, no : 'paymentno', client : config.get('client'), excloude : [] });

    res.json({
      succees : true,
    });
  }

  /**
   * User grid action
   *
   * @param {Request} req
   * @param {Response} res
   *
   * @route  {post} /:id/history
   * @return {*}
   */
  async displayHistoryAction(req, res) {
    const logs = await Audit.where({
      targetid : req.params.id,
    }).find();

    // get children
    res.json({
      result  : (await Promise.all(logs.map(log => log.sanitise()))),
      success : true,
    });
  }

  /**
   * index action
   *
   * @param req
   * @param res
   *
   * @icon    fa fa-credit-card-front
   * @menu    {ADMIN} Payments
   * @title   Payment Administration
   * @route   {get} /
   * @layout  admin
   * @parent  /admin/shop
   */
  async indexAction(req, res) {
    // render grid
    res.render('payment/admin', {
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
   * @route    {get} /:id/edit
   * @menu     {USERS} Add User
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
    let create  = true;
    let payment = new Payment();

    // check for website model
    if (req.params.id) {
      // load by id
      create = false;
      payment = await Payment.findById(req.params.id);
    }

    // render page
    res.render('payment/admin/update', {
      title   : create ? 'Create New' : `Update ${payment.get('_id').toString()}`,
      payment : await payment.sanitise(),
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
    let create  = true;
    let payment = new Payment();
    let message = '';

    // check for website model
    if (req.params.id) {
      // load by id
      create = false;
      payment = await Payment.findById(req.params.id);
    }

    // get orders on invoice
    const invoices = await payment.get('invoices') || '';

    const iids = invoices.map(i => i.invoice);
    const orders = await Order.where({'donotexist' : null}).in('invoice.id', iids).find();

    // set details
    if (!payment.get('complete') && req.body.paid === 'paid') {
      // set details
      payment.set('manual', {
        updated : new Date(),
      });
      payment.set('manual.by', req.user);
      payment.set('complete', true);
      payment.set('state', 'paid');

      // unset data
      payment.unset('data');
      message = 'update status to paid';
    } else {
      // set complete false
      payment.set('complete', false);

      // set manual
      payment.set('manual', {
        updated : new Date(),
      });
      payment.set('manual.by', req.user);
      payment.set('state', 'unpaid');

      // unset data
      payment.unset('data');
      message = 'update status to unpaid';
    }

    const originpayment = req.params.id ? await Payment.findById(req.params.id) : '';
    const updates = req.params.id ? payment.__updates : '';

    // save payment
    await payment.save(req.user);

    await this.eden.hook('audit.record', req, { model: payment, modelold: originpayment, updates, update : req.params.id ? true : false, message : message, no : 'paymentno', client : config.get('client'), excloude : [] });

    // save all orders
    await Promise.all(orders.map(async order => await order.save(req.user)));

    // render page
    res.render('payment/admin/update', {
      title   : create ? 'Create New' : `Update ${payment.get('_id').toString()}`,
      payment : await payment.sanitise(),
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
    let payment = false;

    // check for website model
    if (req.params.id) {
      // load user
      payment = await Payment.findById(req.params.id);
    }

    // render page
    res.render('payment/admin/remove', {
      title   : `Remove ${payment.get('_id').toString()}`,
      payment : await payment.sanitise(),
    });
  }

  /**
   * delete action
   *
   * @param req
   * @param res
   *
   * @route   {post} /:id/remove
   * @title   Payment Administration
   * @layout  admin
   */
  async removeSubmitAction(req, res) {
    // set website variable
    let payment = false;

    // check for website model
    if (req.params.id) {
      // load user
      payment = await Payment.findById(req.params.id);
    }

    // alert Removed
    req.alert('success', `Successfully removed ${payment.get('_id').toString()}`);

    // delete website
    await payment.remove(req.user);

    // render index
    return this.indexAction(req, res);
  }

  /**
   * user grid action
   *
   * @param req
   * @param res
   *
   * @route {get}  /grid
   * @route {post} /grid
   * @route {get}  /:invoice/grid
   * @route {post} /:invoice/grid
   */
  async gridAction(req, res) {
    // return post grid request
    return (await this._grid()).post(req, res);
  }


  // ////////////////////////////////////////////////////////////////////////////
  //
  // PRIVATE METHODS
  //
  // ////////////////////////////////////////////////////////////////////////////

  /**
   * renders grid
   *
   * @return {grid}
   */
  async _grid(req, invoice, omitActions) {
    // create new grid
    const paymentGrid = new Grid();

    // check invoice
    if (((req || {}).params || {}).invoice) {
      // set id
      // eslint-disable-next-line prefer-destructuring
      invoice = req.params.invoice;
    } else if (invoice) {
      // set id
      invoice = invoice.get('_id').toString();
    }

    // set route
    paymentGrid.route(`/admin/shop/${invoice ? `invoice/${invoice}` : 'payment'}/grid`);

    // set grid model
    paymentGrid.model(Payment);

    // add grid columns
    paymentGrid.column('_id', {
      title  : 'ID',
      format : async (col) => {
        return col ? col.toString() : '<i>N/A</i>';
      },
    }).column('user', {
      sort   : true,
      title  : 'User',
      format : async (col, row) => {
        // load user
        const user = await row.get('user');

        // get name
        return user && user.get('name') ? user.get('name') : '<i>N/A</i>';
      },
    }).column('amount', {
      title  : 'Amount',
      format : async (col, row) => {
        return col ? `$${col.toFixed(2)} ${row.get('currency')}` : '<i>N/A</i>';
      },
    }).column('status', {
      sort   : true,
      title  : 'Status',
      format : async (col, row) => {
        return row.get('complete') ? '<span class="btn btn-sm btn-success">Paid</span>' : '<span class="btn btn-sm btn-danger">Unpaid</span>';
      },
    })
    .column('method.type', {
      sort   : true,
      title  : 'Method',
      format : async (col) => {
        return col ? req.t(`${col}.title`) : '<i>N/A</i>';
      },
    })
    .column('details', {
      sort   : true,
      title  : 'Details',
      format : async (col) => {
        return col || '<i>N/A</i>';
      },
    })
    .column('invoiceno', {
      sort     : false,
      title    : 'INV #',
      priority : 93,
      format   : async (col, row) => {
        const invoice = await row.get('invoices');
        let invoices = '';
        invoice ? invoice.map(i => {
          invoices += `<div class="invoice invoice-${i.invoice}"><span class="no"><a href="/admin/shop/invoice/${i.invoice}/update">${i.invoiceno}</a></span><span class="ml-2"><button class="btn btn-sm" invoice-id="${i.invoice}" payment-id="${row.get('_id').toString()}" data-type="remove-invoice">Remove Transaction</button></span></div>`
        }) : '';
        // return customer
        return invoices;
      },
    })
    .column('unallocated', {
      sort   : true,
      title  : 'Unallocated',
      format : async (col, row) => {
        let total = row.get('amount');
        const invoice = row.get('invoices') ? (await row.get('invoices')).map(i => {
          total -= parseFloat(i.amount);
        }) : '';
        return parseFloat(total) <= 0 || total === "0" ? `$${'0.00'.toString()} AUD` : `$${total.toFixed(2)} AUD`;
      },
    });

    // continue grid
    paymentGrid.column('error', {
      sort   : true,
      title  : 'Error',
      format : async (col) => {
        // eslint-disable-next-line no-nested-ternary
        return col && col.text ? col.text : (col ? JSON.stringify(col) : '<i>N/A</i>');
      },
    })
      .column('updated_at', {
        sort   : true,
        title  : 'Updated',
        format : async (col) => {
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
      });

    // omit actions
    if (!omitActions) {
      // add actions column
      paymentGrid.column('actions', {
        width  : '1%',
        title  : 'Actions',
        export : false,
        format : async (col, row) => {
          return [
            '<div class="btn-group btn-group-sm" role="group">',
            `<a href="/admin/shop/payment/${row.get('_id').toString()}/update" class="btn btn-primary"><i class="fa fa-pencil-alt"></i></a>`,
            `<a href="/admin/shop/payment/${row.get('_id').toString()}/remove" class="btn btn-danger"><i class="fa fa-times"></i></a>`,
            '</div>',
          ].join('');
        },
      });
    }

    // add grid filters
    paymentGrid.filter('username', {
      title : 'Username',
      type  : 'text',
      query : async (param) => {
        // check param
        if (!param || !param.length) return;

        // get users
        const users = await User.match('username', new RegExp(escapeRegex(param.toString().toLowerCase()), 'i')).find();

        // user id in
        paymentGrid.in('user.id', users.map(user => user.get('_id').toString()));
      },
    }).filter('email', {
      title : 'Email',
      type  : 'text',
      query : async (param) => {
        // check param
        if (!param || !param.length) return;

        // get users
        const users = await User.match('email', new RegExp(escapeRegex(param.toString().toLowerCase()), 'i')).find();

        // user id in
        paymentGrid.in('user.id', users.map(user => user.get('_id').toString()));
      },
    }).filter('error', {
      title : 'Error',
      type  : 'text',
      query : async (param) => {
        // check param
        if (!param || !param.length) return;

        // user id in
        paymentGrid.or({
          error : new RegExp(escapeRegex(param.toString().toLowerCase()), 'i'),
        }, {
          'error.text' : new RegExp(escapeRegex(param.toString().toLowerCase()), 'i'),
        });
      },
    });

    // set default sort order
    paymentGrid.sort('created_at', -1);

    // check invoice
    if (invoice) {
      // by invoice
      paymentGrid.where({
        'invoice.id' : invoice,
      });
    }

    // add hook
    await this.eden.hook('shop.payment.grid', {
      req,

      grid : paymentGrid,
    });

    // return grid
    return paymentGrid;
  }
}

/**
 * export admin controller
 *
 * @type {AdminPaymentController}
 */
module.exports = AdminPaymentController;
