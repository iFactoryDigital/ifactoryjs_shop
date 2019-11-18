/* eslint-disable no-empty */

// bind dependencies
const Grid        = require('grid');
const config      = require('config');
const Controller  = require('controller');
const escapeRegex = require('escape-string-regexp');

// require models
const User    = model('user');
const File    = model('file');
const Block   = model('block');
const Order   = model('order');
const Invoice = model('invoice');
const Payment = model('payment');

// require helpers
const emailHelper = helper('email');
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
    this.build = this.build.bind(this);
    this.gridAction = this.gridAction.bind(this);
    this.indexAction = this.indexAction.bind(this);
    this.createAction = this.createAction.bind(this);
    this.updateAction = this.updateAction.bind(this);
    this.removeAction = this.removeAction.bind(this);
    this.createSubmitAction = this.createSubmitAction.bind(this);
    this.updateSubmitAction = this.updateSubmitAction.bind(this);
    this.removeSubmitAction = this.removeSubmitAction.bind(this);
    this.pdfAction = this.pdfAction.bind(this);

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
   * build invoice admin controller
   *
   * @return {Promise}
   */
  async build() {
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
    let invoice = new Invoice();

    // check for website model
    if (req.params.id) {
      // load by id
      invoice = await Invoice.findById(req.params.id);
    }

    // invoice company placement
    req.placement('invoice.company');

    // get payment grid
    const paymentController = await this.eden.controller('payment/controllers/admin');

    // get payment grid
    // eslint-disable-next-line no-underscore-dangle
    const paymentGrid = await paymentController._grid(req, invoice, true);

    const invoices = await Invoice.where({ 'customer.id' : invoice.get('customer.id') }).ne('status', 'unset').sort('created_at', -1).find();

    // render page
    res.render('invoice/admin/view', {
      grid     : await paymentGrid.render(req, invoice),
      title    : `View ${invoice.get('_id').toString()}`,
      orders   : await Promise.all((await invoice.get('orders')).map(order => order.sanitise())),
      invoice  : await invoice.sanitise(),
      payments : true,
      invoices : await Promise.all(await invoices.map(invoice => invoice.sanitise())),
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
    let invoice = new Invoice();

    // check for website model
    if (req.params.id) {
      // load by id
      invoice = await Invoice.findById(req.params.id);
    }

    // invoice company placement
    req.placement('invoice.company');

    // get payment grid
    const paymentController = await this.eden.controller('payment/controllers/admin');

    // get payment grid
    // eslint-disable-next-line no-underscore-dangle
    const paymentGrid = await paymentController._grid(req, invoice, true);

    const invoices = await Invoice.where({ 'customer.id' : invoice.get('customer.id') }).ne('status', 'unset').sort('created_at', -1).find();

    // render page
    res.render('invoice/admin/view', {
      grid     : await paymentGrid.render(req, invoice),
      title    : `View ${invoice.get('_id').toString()}`,
      orders   : await Promise.all((await invoice.get('orders')).map(order => order.sanitise())),
      invoice  : await invoice.sanitise(),
      payments : !!req.query.payments,
      invoices : await Promise.all(await invoices.map(invoice => invoice.sanitise())),
      print    : true,
    });
  }

  async _createPdf(invoice, file, user) {
    // set file
    file.set('ext', 'pdf');

    // from file
    await file.fromURL(`http://localhost:${config.get('port')}/shop/invoice/${invoice.get('_id').toString()}/pdf?user=${user.get('_id').toString()}&skip=NC5jCAheHPjkZwj2fjpYwIBrjOgGCerj`);

    // set name
    file.set('name', `invoice-${invoice.get('_id').toString()}.pdf`);

    // save file
    await file.save();

    return file;
  }

  /**
   * update action
   *
   * @param {Request}  req
   * @param {Response} res
   *
   * @route {POST} /:id/pdf
   */
  async pdfAction(req, res) {
    // set website variable
    let invoice = new Invoice();

    // check for website model
    if (req.params.id) {
      // load by id
      invoice = await Invoice.findById(req.params.id);
    }

    // alert
    req.alert('info', 'Generating invoice PDF');

    const file = new File();

    await this._createPdf(invoice, file, req.user);

    // alert
    req.alert('info', 'Generated invoice PDF');

    // get file
    res.json({
      result  : await file.sanitise(),
      success : true,
    });
  }

  /**
   * update action
   *
   * @param {Request}  req
   * @param {Response} res
   *
   * @route {POST} /:id/email
   */
  async emailAction(req, res) {
    // set website variable
    let invoice = new Invoice();

    // check for website model
    if (req.params.id) {
      // load by id
      invoice = await Invoice.findById(req.params.id);
    }

    // alert
    req.alert('info', 'Generating invoice PDF');

    const file = new File();

    await this._createPdf(invoice, file, req.user);

    // alert
    req.alert('info', 'Generated invoice PDF');

    // get file
    res.json({
      result  : await file.sanitise(),
      success : true,
    });

    // alert
    req.alert('success', 'Successfully queued email send');

    // send email
    await emailHelper.send(req.body.email.split(',').map(item => item.trim()), 'invoice', {
      subject     : 'Email Invoice',
      body        : req.body.body,
      invoice     : await invoice.sanitise(),
      attachments : [file],
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
    // eslint-disable-next-line no-underscore-dangle
    const paymentGrid = await paymentController._grid(req, invoice);

    const invoices = await Invoice.where({ 'customer.id' : invoice.get('customer.id') }).nin('status', ['unset', 'draft']).sort('created_at', -1).find();

    // render page
    res.render('invoice/admin/update', {
      grid     : await paymentGrid.render(req, invoice),
      title    : create ? 'Create New' : `Update ${invoice.get('_id').toString()}`,
      orders   : await Promise.all((await invoice.get('orders')).map(order => order.sanitise())),
      invoice  : await invoice.sanitise(),
      invoices : await Promise.all(await invoices.map(invoice => invoice.sanitise())),
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
    let invoice = new Invoice({
      currency : config.get('shop.currency') || 'USD',
    });

    // check for website model
    if (req.params.id) {
      // load by id
      invoice = await Invoice.findById(req.params.id);
    }

    // get order
    const orders = await Promise.all(req.body.lines.reduce((accum, line) => {
      // push order
      if (!accum.includes(line.order)) accum.push(line.order);

      // return accumulated
      return accum;
    }, []).map(id => Order.findById(id)));

    // set orders
    invoice.set('orders', orders);

    // set user
    if (!await invoice.get('user')) invoice.set('user', await orders[0].get('user'));

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
    invoice.set('lines', req.body.lines);
    invoice.set('total', ([].concat(...(orders.map(order => order.get('lines'))))).reduce((accum, line) => {
      // return accum
      return line.total + accum;
    }, 0) - (invoice.get('discount') || 0));

    // save invoice
    await invoice.save(req.user);

    // save order
    await Promise.all(orders.map((order) => {
      // set invoice
      order.set('invoice', invoice);

      // return save
      return order.save(req.user);
    }));

    // add hook for reassign orders
    if (orders.length > 0) await this.eden.hook('invoice.reassign.orders', invoice.get('_id'), orders);

    // render page
    res.json({
      orders  : await Promise.all(orders.map(order => order.sanitise())),
      invoice : await invoice.sanitise(),
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
    let invoice = new Invoice();
    let payment = null;

    // check for website model
    if (req.params.id && req.params.id !== 'create') {
      // load by id
      invoice = await Invoice.findById(req.params.id);
    } else if (req.params.id === 'create') {
      // get order
      // eslint-disable-next-line max-len
      const orders = await Promise.all((Array.isArray(req.body.orders) ? req.body.orders : [req.body.orders]).map((id) => {
        // return orders
        return Order.findById(id);
      }));

      // set order
      invoice.set('orders', orders);

      // save invoice
      await invoice.save();

      // set orders
      orders.forEach((order) => {
        // check order
        if (!order) return;

        // save order
        order.set('invoice', invoice);
        order.save();
      });
    }

    // get orders
    const orders = await invoice.get('orders') || [];

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
        type : req.body.method,
      });
      payment.set('state', 'approval');

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

    // orders
    await Promise.all(orders.map(order => order.save(req.user)));

    // render page
    res.json({
      result  : {
        orders  : await Promise.all(orders.map(order => order.sanitise())),
        payment : await payment.sanitise(),
        invoice : await invoice.sanitise(),
      },
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
    // eslint-disable-next-line no-underscore-dangle
    const paymentGrid = await paymentController._grid(req, invoice, true);

    // return post grid request
    return paymentGrid.post(req, res);
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
  async _grid(req) {
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
      format : async (col) => {
        return col && col.length ? col.map((item) => {
          // return item
          return `<a href="/admin/shop/order/${item.get('_id').toString()}/update">${item.get('orderno') ? item.get('orderno') : item.get('_id')}</a>`;
        }).join(', ') : '<i>N/A</i>';
      },
    }).column('total', {
      title  : 'Total',
      format : async (col, row) => {
        return col ? `$${col.toFixed(2)} ${row.get('currency')}` : '<i>N/A</i>';
      },
    })
      .column('status', {
        sort   : true,
        title  : 'Status',
        format : async (col) => {
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
        tag      : 'invoice-actions',
        type     : false,
        width    : '1%',
        title    : 'Actions',
        priority : 1,
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

    // add hook
    await this.eden.hook('shop.invoice.grid', {
      req,

      grid : invoiceGrid,
    });

    // set default sort order
    invoiceGrid.sort('created_at', -1);

    // return grid
    return invoiceGrid;
  }
}

/**
 * export admin controller
 *
 * @type {AdminInvoiceController}
 */
module.exports = AdminInvoiceController;
