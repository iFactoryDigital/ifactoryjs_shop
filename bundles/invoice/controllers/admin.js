/* eslint-disable no-empty */

// bind dependencies
const Grid        = require('grid');
const Controller  = require('controller');
const escapeRegex = require('escape-string-regexp');
const moment      = require('moment');

// require models
const User    = model('user');
const File    = model('file');
const Block   = model('block');
const Order   = model('order');
const Invoice = model('invoice');
const Payment = model('payment');

// require helpers
const emailHelper   = helper('email');
const blockHelper   = helper('cms/block');
const paymentHelper = helper('payment');

// bind local dependencies
const config = require('config');

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
   * @route {post} /:id/unpaid
   */
  async getUnpaidInvoicesAction(req, res) {
    console.log('getUnpaidInvoicesAction');
    const payment = await Payment.findById(req.params.id);
    const customer = (payment || {}).get('customer.id');
    const invoices = await Invoice.where({'customer.id' : customer }).in('newinvoice', [null, false]).find();
    let invoiceids  = [];
    let invoiceinfo = [];
    (await Promise.all(await invoices.map(invoice => {
      invoiceinfo.push({id: invoice.get('_id'), invoiceno: invoice.get('invoiceno'), total: invoice.get('total'), pay: 0});
      invoiceids.push(invoice.get('_id'));
    }))).filter(t=>t);
    const payments = await Payment.where({'donotexist': null}).in('invoices.invoice', invoiceids).find();

    (await Promise.all(await payments.map(async payment => {
      const invoices = await payment.get('invoices');
      invoices.map(i => {
        invoiceinfo.map((ii, index) => {
          if (ii.id === i.invoice) {
            ii.pay = ii.pay + i.amount;
            invoiceinfo[index] = ii;
          }
        })
      });
    }))).filter(t=>t);
    console.log('before');
    console.log(invoiceinfo);
    invoiceids = [];
    invoiceinfo.map((i, index) => {
      if (i.total <= i.pay) {
        invoiceinfo.splice(index, 1);
      }
    });
    console.log('after');
    console.log(invoiceinfo);
    //const invoicesanitise = (await Promise.all(await invoices.map(invoice => invoice.sanitise()))).filter(i => i.total > 0 && i.total > i.totalpayments);
    const unallocated = payment.get('amount') - ((await payment.get('invoices') || []).map(i => i.amount));

    // return json
    res.json({
      unallocated : unallocated < 0 ? 0 : unallocated,
      unpaid      : invoiceinfo,
      success     : true,
    });
  }

  /**
   * index action
   *
   * @param {Request}  req
   * @param {Response} res
   *
   * @route {post} /:id/:payment/removetransaction
   */
  async removeTransactionAction(req, res) {
    const payment = await Payment.findById(req.params.payment);
    const invoices  = [];
    let invoiceno = '';
    let orderno   = '';
    let amount    = 0;
    (await payment.get('invoices')) ? (await payment.get('invoices')).map(i => {
      if (i.invoice === req.params.id) {
        invoiceno = i.invoiceno;
        orderno   = i.orderno ? i.orderno : 'N/A';
        amount    = i.amount;
      } else {
        invoices.push(i);
      }
    }) : '';

    payment.set('invoices', invoices);
    payment.save(req.user);

    await this.eden.hook('audit.record', req, { model: payment, modelold: null, updates: null, update : 'Remove', message : `Remove Transaction: ${ orderno } (${ invoiceno }) amount: ${ amount }`, no : 'paymentno', client : config.get('client'), excloude : [] });

    // return json
    res.json({
      success     : true,
    });
  }

  /**
   * index action
   *
   * @param {Request}  req
   * @param {Response} res
   *
   * @route {post} /:payment/allocate
   */
  async allocateInvoiceAction(req, res) {
    console.log('allocateInvoiceAction');
    let message = '';
    const payment = await Payment.findById(req.params.payment);
    const invoices = (await payment.get('invoices')) ? (await payment.get('invoices')) : [];

    await Promise.all(req.body.allcate.map(async i => {
      const invoice = await Invoice.findById(i.id);
      console.log(invoice.get('_id'));
      const order   = await (await invoice.get('orders'))[0];
      message += `Assigned Payment to ${ order.get('orderno') } (${ invoice.get('invoiceno') }) : $${ parseFloat(i.amount) } AUD, `;

      if (invoices && Array.isArray(invoices) && invoices.length > 0 && invoices.includes(order.get('_id'))) {
        invoices = invoices.map(invoice => {
          invoice.amount = invoice.amount + parseFloat(i.amount);
          return invoice
        });
      } else {
        invoices.push({invoice: invoice.get('_id'), invoiceno: invoice.get('invoiceno'), order: order.get('_id'), orderno: order.get('orderno'), amount: parseFloat(i.amount)});
      }
    }));

    if (invoices && Array.isArray(invoices) && invoices.length > 0) {
      payment.set('invoices', invoices);
      await payment.save(req.user);
    }

    await this.eden.hook('audit.record', req, { model: payment, modelold: null, updates: null, update : true, message : message, no : 'paymentno', client : config.get('client'), excloude : [] });

    // return json
    res.json({
      success     : true,
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

    const origininvoice = req.params.id ? await Invoice.findById(req.params.id) : '';
    const updates = req.params.id ? invoice.__updates : '';

    // save invoice
    await invoice.save(req.user);

    await this.eden.hook('audit.record', req, { model: invoice, modelold: origininvoice, updates, update : req.params.id ? true : false, message: '', no : 'invoiceno', client : config.get('client'), excloude : [] });

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
    console.log('paymentCreateAction');
    // set website variable
    const amount = parseFloat(req.body.amount);
    let invoice = new Invoice();
    let payment = null;
    let total   = 0;
    let orderno = '';

    // check for website model
    if (req.params.id && req.params.id !== 'create') {
      // load by id
      let ordertotal = 0;
      invoice = await Invoice.findById(req.params.id);
      await Promise.all((await invoice.get('orders')).map(async o => {
        const order = await o;
        orderno     = o.get('orderno');
        ordertotal += order.get('total');
      }));
      const payments = await Payment.where({ 'invoices.invoice' : req.params.id }).nin('state', ['canceled', 'refund', 'remove']).find();
      await Promise.all(await payments.map(async p => {
        const payment = await p;
        payment.get('invoices').map(i => {
          if (i.invoice === invoice.get('_id')) total += i.amount;
        });
      }));
      ordertotal - total <= 0 ? total = 0 : ordertotal - total - amount >= 0 ? total = amount : total = ordertotal - total;
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
        total   += order.get('total');
        orderno = order.get('orderno');
        // save order
        order.set('invoice', invoice);
        order.save(req.user);
      });
      invoice.set('total', total);

      total <= parseFloat(req.body.amount) ? total : total = parseFloat(req.body.amount);
      // save invoice
      await invoice.save();
    }
    // get orders
    const orders = await invoice.get('orders') || [];

    // save payment
    payment = new Payment({
      invoice,
      customer : invoice.get('customer'),
      user     : req.user,
      rate     : 1,
      admin    : req.user,
      amount,
      details  : req.body.details,
      currency : req.body.currency,
      invoices : [{
          invoice     : invoice.get('_id'),
          invoiceno   : invoice.get('invoiceno') ? invoice.get('invoiceno') : '',
          order       : (await orders[0]).get('_id'),
          orderno     : (await orders[0]).get('orderno') ? (await orders[0]).get('orderno') : (await orders[0]).get('_id'),
          amount      : total,
          invoicedate : invoice.get('created_at'),
          orderdate   : (await orders[0]).get('created_at'),
          date        : new Date()
      }]
    });

    await this.eden.hook('payment.addinfo', payment, req);

    // save payment
    await payment.save(req.user);

    // create manual payment
    if (req.body.type === 'manual') {
      // set fields
      payment.set('method', {
        type : req.body.method,
      });
      payment.set('state', 'approval');
    } else {
      // set fields
      payment.set('method', req.body.action.value);

      // pay
      await this.eden.hook('payment.pay', payment);

      // unset data
      payment.unset('method.data');

      payment.set('state', payment.get('complete') ? 'paid' : payment.get('error') ? 'error' : 'approval');

      if (payment.get('state') === 'paid') {
        payment.set('verify', true);
        payment.set('verifydate', moment(new Date()).format('YYYY-MM-DD'));
        payment.set('verifynote', 'Paid by Credit Card');
      }
    }

    // save payment
    await payment.save(req.user);

    await this.eden.hook('audit.record', req, { model: payment, modelold: null, updates: null, update : false, message : `Create Payment #${ payment.get('paymentno') }: ${ (payment.get('method') || {}).type } ${ amount } Assigned Payment to ${ orderno } (${ invoice.get('invoiceno') })`, no : 'paymentno', client : config.get('client'), excloude : [] });

    // orders
    await Promise.all(orders.map(order => order.save(req.user)));
    //await invoice.save();

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

    let total = 0;
    let order = [];
    await Promise.all((await invoice.get('orders')).map(o => {
      total += o.get('total');
      oders.put(o.get('orderno'));
    }));

    // alert Removed
    req.alert('success', `Successfully removed ${invoice.get('_id').toString()}`);

    await this.eden.hook('audit.record', req, { model: invoice, modelold: null, updates: null, update : 'Remove', message : `[Remove] Invoice: ${ invoice.get('invoiceno') } ( ${ oders.join(', ') } ) amount: ${ invoice.get('total') }`, no : 'invoiceno', client : config.get('client'), excloude : [] });

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
    }).column('invoiceno', {
      sort   : true,
      title  : 'INV #',
      format : async (col, row) => {
        // return item
        return row.get('invoiceno') ? row.get('invoiceno') : row.get('_id');
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
      sort   : true,
      format : async (col, row) => {
        return col ? `$${col.toFixed(2)} ${row.get('currency') ? row.get('currency') : config.get('shop.currency')}` : '<i>N/A</i>';
      },
    }).column('state', {
      sort   : true,
      title  : 'Status',
      format : async (col, row) => {
        return row.get('state') ? `<span class="btn btn-sm">${row.get('state')}</span>` : '<i>N/A</i>';
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
