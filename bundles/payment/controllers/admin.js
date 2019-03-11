
// bind dependencies
const Grid        = require('grid');
const Controller  = require('controller');
const escapeRegex = require('escape-string-regexp');

// require models
const User    = model('user');
const Block   = model('block');
const Payment = model('payment');

// require helpers
const blockHelper = helper('cms/block');

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

    // check for website model
    if (req.params.id) {
      // load by id
      create = false;
      payment = await Payment.findById(req.params.id);
    }

    // get order
    const order = await (await payment.get('invoice')).get('order');

    // set details
    if (!payment.get('complete') && req.body.paid === 'paid') {
      // set details
      payment.set('complete', true);
      payment.set('method', {
        type : 'manual',
      });
      payment.set('manual', {
        by      : req.user,
        updated : new Date(),
      });

      // unset data
      payment.unset('data');
    }

    // save payment
    await payment.save(req.user);

    // run hook
    order.set('state', 'paid');

    // save order
    await order.save(req.user);

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
   */
  async gridAction(req, res) {
    // return post grid request
    return (await this._grid()).post(req, res);
  }

  /**
   * renders grid
   *
   * @return {grid}
   */
  _grid(req) {
    // create new grid
    const paymentGrid = new Grid();

    // set route
    paymentGrid.route('/admin/shop/payment/grid');

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
        return user ? user.name() : '<i>N/A</i>';
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
      .column('error', {
        sort   : true,
        title  : 'Error',
        format : async (col) => {
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
      })
      .column('actions', {
        width  : '1%',
        title  : 'Actions',
        export : false,
        format : async (col, row) => {
          return [
            '<div class="btn-group btn-group-sm" role="group">',
            `<a href="/admin/shop/payment/${row.get('_id').toString()}/update" class="btn btn-primary"><i class="fa fa-pencil"></i></a>`,
            `<a href="/admin/shop/payment/${row.get('_id').toString()}/remove" class="btn btn-danger"><i class="fa fa-times"></i></a>`,
            '</div>',
          ].join('');
        },
      });

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
    paymentGrid.sort('created_at', 1);

    // return grid
    return paymentGrid;
  }
}

/**
 * export admin controller
 *
 * @type {AdminPaymentController}
 */
exports = module.exports = AdminPaymentController;
