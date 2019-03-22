
// bind dependencies
const Grid        = require('grid');
const puppeteer   = require('puppeteer');
const Controller  = require('controller');
const escapeRegex = require('escape-string-regexp');

// require models
const User    = model('user');
const Block   = model('block');
const Invoice = model('invoice');
const Payment = model('payment');

// require helpers
const blockHelper = helper('cms/block');

/**
 * build user admin controller
 *
 * @acl   admin.invoice.view
 * @fail  /
 * @mount /admin/shop/invoice
 */
class AdminInvoiceController extends Controller {
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
    blockHelper.block('dashboard.cms.invoices', {
      acl         : ['admin.shop'],
      for         : ['admin'],
      title       : 'Invoices Grid',
      description : 'Shows grid of recent invoices',
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
        name  : 'Invoices',
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
   * @param {Request}  req
   * @param {Response} res
   *
   * @icon    fa fa-file-invoice
   * @menu    {ADMIN} Invoices
   * @title   Invoice Administration
   * @route   {get} /
   * @layout  admin
   * @parent  /admin/shop
   */
  async indexAction(req, res) {
    // render grid
    res.render('invoice/admin', {
      grid : await (await this._grid(req)).render(req),
    });
  }

  /**
   * add/edit action
   *
   * @param {Request}  req
   * @param {Response} res
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
   * @param {Request}  req
   * @param {Response} res
   *
   * @route   {get} /:id/view
   * @layout  admin
   */
  async viewAction(req, res) {
    // set website variable
    let create  = true;
    let invoice = new Invoice();

    // check for website model
    if (req.params.id) {
      // load by id
      create = false;
      invoice = await Invoice.findById(req.params.id);
    }

    // invoice company placement
    req.placement('invoice.company');

    // get payment grid
    const paymentController = await this.eden.controller('payment/controllers/admin');

    // get payment grid
    const paymentGrid = await paymentController._grid(req, invoice, true);

    // render page
    res.render('invoice/admin/view', {
      grid     : await paymentGrid.render(req, invoice),
      title    : `View ${invoice.get('_id').toString()}`,
      orders   : await Promise.all((await invoice.get('orders')).map((order) => order.sanitise())),
      invoice  : await invoice.sanitise(),
      payments : true,
    });
  }

  /**
   * update action
   *
   * @param {Request}  req
   * @param {Response} res
   *
   * @route  {get} /:id/print
   * @layout print
   */
  async printAction(req, res) {
    // set website variable
    let create  = true;
    let invoice = new Invoice();

    // check for website model
    if (req.params.id) {
      // load by id
      create = false;
      invoice = await Invoice.findById(req.params.id);
    }

    // invoice company placement
    req.placement('invoice.company');

    // get payment grid
    const paymentController = await this.eden.controller('payment/controllers/admin');

    // get payment grid
    const paymentGrid = await paymentController._grid(req, invoice, true);

    // render page
    res.render('invoice/admin/view', {
      grid     : await paymentGrid.render(req, invoice),
      title    : `View ${invoice.get('_id').toString()}`,
      orders   : await Promise.all((await invoice.get('orders')).map((order) => order.sanitise())),
      invoice  : await invoice.sanitise(),
      payments : !!req.query.payments,
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
    let create  = true;
    let invoice = new Invoice();

    // check for website model
    if (req.params.id) {
      // load by id
      create = false;
      invoice = await Invoice.findById(req.params.id);
    }

    // invoice company placement
    req.placement('invoice.company');

    // get payment grid
    const paymentController = await this.eden.controller('payment/controllers/admin');

    // get payment grid
    const paymentGrid = await paymentController._grid(req, invoice);

    // render page
    res.render('invoice/admin/update', {
      grid    : await paymentGrid.render(req, invoice),
      title   : create ? 'Create New' : `Update ${invoice.get('_id').toString()}`,
      orders  : await Promise.all((await invoice.get('orders')).map((order) => order.sanitise())),
      invoice : await invoice.sanitise(),
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
    let create  = true;
    let invoice = new Invoice();

    // check for website model
    if (req.params.id) {
      // load by id
      create = false;
      invoice = await Invoice.findById(req.params.id);
    }

    // get order
    const orders = await invoice.get('orders');

    // check body
    if (req.body.lines) {
      // set lines
      orders.forEach((order) => {
        // set lines
        order.set('lines', req.body.lines.filter(line => line.order === order.get('_id').toString()));
      });
    }

    // check discount
    if (typeof req.body.discount !== 'undefined') {
      // set discount
      invoice.set('discount', req.body.discount);
    }

    // check discount
    if (typeof req.body.note !== 'undefined') {
      // set discount
      invoice.set('note', req.body.note);
    }

    // update totals
    invoice.set('total', ([].concat(...(orders.map(order => order.get('lines'))))).reduce((accum, line) => {
      // return accum
      return line.total + accum;
    }, 0) - (invoice.get('discount') || 0));

    // save invoice
    await invoice.save(req.user);

    // save order
    await Promise.all(orders.map(order => order.save(req.user)));

    // render page
    res.json({
      result  : await Promise.all(orders.map(order => order.sanitise())),
      success : true,
    });
  }

  /**
   * add/edit action
   *
   * @param {Request}  req
   * @param {Response} res
   *
   * @route   {post} /:id/payment/create
   * @layout  admin
   */
  async paymentCreateAction(req, res) {
    // set website variable
    let create  = true;
    let invoice = new Invoice();
    let payment = null;

    // check for website model
    if (req.params.id) {
      // load by id
      create = false;
      invoice = await Invoice.findById(req.params.id);
    }

    // save payment
    payment = new Payment({
      invoice,
      user     : req.user,
      rate     : 1,
      admin    : req.user,
      amount   : parseFloat(req.body.amount),
      details  : req.body.details,
      currency : req.body.currency,
    });

    // create manual payment
    if (req.body.type === 'manual') {
      // set fields
      payment.set('method', {
        type : req.body.method
      });
      payment.set('complete', true);

      // save payment
      await payment.save(req.user);
    } else {
      // save payment
      await payment.save(req.user);

      // set fields
      payment.set('method', req.body.action.value);

      // pay
      await this.eden.hook('payment.pay', payment);

      // unset data
      payment.unset('method.data');

      // save payment
      await payment.save(req.user);
    }

    // render page
    res.json({
      result  : await payment.sanitise(),
      invoice : await invoice.sanitise(),
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
    let invoice = false;

    // check for website model
    if (req.params.id) {
      // load user
      invoice = await Invoice.findById(req.params.id);
    }

    // render page
    res.render('invoice/admin/remove', {
      title   : `Remove ${invoice.get('_id').toString()}`,
      invoice : await invoice.sanitise(),
    });
  }

  /**
   * delete action
   *
   * @param {Request}  req
   * @param {Response} res
   *
   * @route   {post} /:id/remove
   * @title   Invoice Administration
   * @layout  admin
   */
  async removeSubmitAction(req, res) {
    // set website variable
    let invoice = false;

    // check for website model
    if (req.params.id) {
      // load user
      invoice = await Invoice.findById(req.params.id);
    }

    // alert Removed
    req.alert('success', `Successfully removed ${invoice.get('_id').toString()}`);

    // delete website
    await invoice.remove(req.user);

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

  /**
   * user grid action
   *
   * @param {Request}  req
   * @param {Response} res
   *
   * @route {get}  /:id/grid
   * @route {post} /:id/grid
   */
  async paymentGridAction(req, res) {
    // set website variable
    let invoice = false;

    // check for website model
    if (req.params.id) {
      // load user
      invoice = await Invoice.findById(req.params.id);
    }

    // get payment grid
    const paymentController = await this.eden.controller('payment/controllers/admin');

    // get payment grid
    const paymentGrid = await paymentController._grid(req, invoice, true);

    // return post grid request
    return paymentGrid.post(req, res);
  }

  /**
   * renders grid
   *
   * @return {grid}
   */
  _grid(req) {
    // create new grid
    const invoiceGrid = new Grid();

    // set route
    invoiceGrid.route('/admin/shop/invoice/grid');

    // set grid model
    invoiceGrid.model(Invoice);

    // add grid columns
    invoiceGrid.column('_id', {
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
    }).column('orders', {
      title  : 'Orders',
      format : async (col, row) => {
        return col && col.length ? col.map((item) => {
          // return item
          return `<a href="/admin/shop/order/${item.get('_id').toString()}/update">${item.get('_id').toString()}</a>`;
        }).join(', ') : '<i>N/A</i>';
      },
    }).column('total', {
      title  : 'Total',
      format : async (col, row) => {
        return col ? `$${col.toFixed(2)} ${row.get('currency')}` : '<i>N/A</i>';
      },
    }).column('status', {
      sort   : true,
      title  : 'Status',
      format : async (col, row) => {
        return col ? `<span class="btn btn-sm">${col}</span>` : '<i>N/A</i>';
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
            `<a href="/admin/shop/invoice/${row.get('_id').toString()}/view" class="btn btn-info"><i class="fa fa-eye"></i></a>`,
            `<a href="/admin/shop/invoice/${row.get('_id').toString()}/print" class="btn btn-info" target="_blank"><i class="fa fa-print"></i></a>`,
            `<a href="/admin/shop/invoice/${row.get('_id').toString()}/update" class="btn btn-primary"><i class="fa fa-pencil"></i></a>`,
            `<a href="/admin/shop/invoice/${row.get('_id').toString()}/remove" class="btn btn-danger"><i class="fa fa-times"></i></a>`,
            '</div>',
          ].join('');
        },
      });

    // add grid filters
    invoiceGrid.filter('username', {
      title : 'Username',
      type  : 'text',
      query : async (param) => {
        // check param
        if (!param || !param.length) return;

        // get users
        const users = await User.match('username', new RegExp(escapeRegex(param.toString().toLowerCase()), 'i')).find();

        // user id in
        invoiceGrid.in('user.id', users.map(user => user.get('_id').toString()));
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
        invoiceGrid.in('user.id', users.map(user => user.get('_id').toString()));
      },
    }).filter('error', {
      title : 'Error',
      type  : 'text',
      query : async (param) => {
        // check param
        if (!param || !param.length) return;

        // user id in
        invoiceGrid.or({
          error : new RegExp(escapeRegex(param.toString().toLowerCase()), 'i'),
        }, {
          'error.text' : new RegExp(escapeRegex(param.toString().toLowerCase()), 'i'),
        });
      },
    });

    // set default sort order
    invoiceGrid.sort('created_at', -1);

    // return grid
    return invoiceGrid;
  }

  /**
   * create PDF
   *
   * @param  {String}  url
   *
   * @return {Promise}
   */
  _toPDF(url) {
    // return promise
    return new Promise(async (resolve, reject) => {
      // create lock
      const unlock = await this.eden.lock('invoice.pdf');

      // run try/catch
      try {
        // require puppeteer
        if (!this.__browser) {
          // create browser
          this.__browser = await puppeteer.launch({
            args : ['--no-sandbox', '--disable-setuid-sandbox'],
          });
        }

        // check page
        if (!this.__page) {
          // set page
          this.__page = await this.__browser.newPage();

          // set to print
          await this.__page.emulateMedia('print');
        }

        // go to url
        await this.__page.goto(url, {
          waitUntil : 'networkidle0',
        });

        // create callback
        await this.__page.pdf({
          format : 'Letter',
        }).then(resolve, (err) => {
          // reject error
          if (err) reject(err);
        });
      } catch (e) {}

      // unlock
      unlock();
    });
  }
}

/**
 * export admin controller
 *
 * @type {AdminInvoiceController}
 */
exports = module.exports = AdminInvoiceController;
