
// bind dependencies
const grid       = require('grid');
const alert      = require('alert');
const crypto     = require('crypto');
const Controller = require('controller');

// require models
const Widget  = model('widget');
const Payment = model('payment');

// bind local dependencies
const config = require('config');

// require helpers
const productHelper   = helper('product');
const DashboardHelper = helper('dashboard');

/**
 * build user admin controller
 *
 * @acl   admin.payment.view
 * @fail  /
 * @mount /admin/payment
 */
class AdminPaymentController extends Controller {
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

    // register default payment types
    productHelper.payment('once');

    // register simple widget
    DashboardHelper.widget('dashboard.cms.payments', {
      'acl'         : ['admin.shop'],
      'title'       : 'Payments Widget',
      'description' : 'Shows grid of recent payments'
    }, async (req, widget) => {
      // get notes widget from db
      let widgetModel = await Widget.findOne({
        'uuid' : widget.uuid
      }) || new Widget({
        'uuid' : widget.uuid,
        'type' : widget.type
      });

      // create new req
      let fauxReq = {
        'query' : widgetModel.get('state') || {}
      };

      // return
      return {
        'tag'   : 'grid',
        'name'  : 'Payments',
        'grid'  : await this._grid(req).render(fauxReq),
        'title' : widgetModel.get('title') || ''
      };
    }, async (req, widget) => {
      // get notes widget from db
      let widgetModel = await Widget.findOne({
        'uuid' : widget.uuid
      }) || new Widget({
        'uuid' : widget.uuid,
        'type' : widget.type
      });

      // set data
      widgetModel.set('state', req.body.data.state);
      widgetModel.set('title', req.body.data.title);

      // save widget
      await widgetModel.save();
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
  async indexAction (req, res) {
    // render grid
    res.render('payment/admin', {
      'grid' : await this._grid().render()
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
    let create  = true;
    let payment = new Payment();

    // check for website model
    if (req.params.id) {
      // load by id
      create  = false;
      payment = await Payment.findById(req.params.id);
    }

    // render page
    res.render('payment/admin/update', {
      'title'   : create ? 'Create New' : 'Update ' + payment.get('_id').toString(),
      'payment' : await payment.sanitise()
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
    let create  = true;
    let payment = new Payment();

    // check for website model
    if (req.params.id) {
      // load by id
      create  = false;
      payment = await Payment.findById (req.params.id);
    }

    // render page
    res.render('payment/admin/update', {
      'title'   : create ? 'Create New' : 'Update ' + payment.get('_id').toString(),
      'payment' : await payment.sanitise()
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
    let payment = false;

    // check for website model
    if (req.params.id) {
      // load user
      payment = await Payment.findById(req.params.id);
    }

    // render page
    res.render('payment/admin/remove', {
      'title'   : 'Remove ' + payment.get('_id').toString(),
      'payment' : await payment.sanitise()
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
  async removeSubmitAction (req, res) {
    // set website variable
    let payment = false;

    // check for website model
    if (req.params.id) {
      // load user
      payment = await Payment.findById(req.params.id);
    }

    // alert Removed
    req.alert('success', 'Successfully removed ' + (payment.get('_id').toString()));

    // delete website
    await payment.remove();

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
    return this._grid().post(req, res);
  }

  /**
   * renders grid
   *
   * @return {grid}
   */
  _grid () {
    // create new grid
    let paymentGrid = new grid();

    // set route
    paymentGrid.route('/admin/payment/grid');

    // set grid model
    paymentGrid.model(Payment);

    // add grid columns
    paymentGrid.column('_id', {
      'title'  : 'ID',
      'format' : async (col) => {
        return col ? col.toString() : '<i>N/A</i>';
      }
    }).column('user', {
      'sort'   : true,
      'title'  : 'User',
      'format' : async (col, row) => {
        // load user
        let user = await row.get('user');

        // get name
        return user ? user.name() : '<i>N/A</i>';
      }
    }).column('amount', {
      'title'  : 'Amount',
      'format' : async (col, row) => {
        return col ? '$' + col.toFixed(2) + ' ' + row.get('currency') : '<i>N/A</i>';
      }
    }).column('pending', {
      'sort'   : true,
      'title'  : 'Pending',
      'format' : async (col, row) => {
        return row.get('complete') ? 'false' : 'true';
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
            '<a href="/admin/payment/' + row.get('_id').toString() + '/update" class="btn btn-primary"><i class="fa fa-pencil"></i></a>',
            '<a href="/admin/payment/' + row.get('_id').toString() + '/remove" class="btn btn-danger"><i class="fa fa-times"></i></a>',
          '</div>'
        ].join('');
      }
    });

    // add grid filters
    paymentGrid.filter('username', {
      'title' : 'Username',
      'type'  : 'text',
      'query' : async (param) => {
        // another where
        paymentGrid.match('username', new RegExp(param.toString().toLowerCase(), 'i'));
      }
    }).filter('email', {
      'title' : 'Email',
      'type'  : 'text',
      'query' : async (param) => {
        // another where
        paymentGrid.match('email', new RegExp(param.toString().toLowerCase(), 'i'));
      }
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
