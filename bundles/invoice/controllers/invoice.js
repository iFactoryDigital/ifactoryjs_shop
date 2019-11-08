/* eslint-disable no-empty */

// bind dependencies
const config     = require('config');
const Controller = require('controller');

// require models
const Invoice = model('invoice');

/**
 * build user admin controller
 *
 * @mount /shop/invoice
 */
class InvoiceController extends Controller {
  /**
   * construct user admin controller
   */
  constructor() {
    // run super
    super();

    // bind methods
    this.pdfAction = this.pdfAction.bind(this);
    this.printAction = this.printAction.bind(this);
  }


  // ////////////////////////////////////////////////////////////////////////////
  //
  // ACTION METHODS
  //
  // ////////////////////////////////////////////////////////////////////////////

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
    });
  }

  /**
   * index action
   *
   * @param {Request}  req
   * @param {Response} res
   *
   * @route {get} /:id/pdf
   */
  async pdfAction(req, res, next) {
    // set website variable
    let invoice = new Invoice();

    // check for website model
    if (req.params.id) {
      // load by id
      invoice = await Invoice.findById(req.params.id);
    }

    try {
      require.resolve('puppeteer');
    } catch (e) {
      next();
      return;
    }

    // set headers
    res.setHeader('Content-type', 'application/pdf');
    res.setHeader('Content-disposition', `inline; filename="invoice-${invoice.get('_id').toString()}.pdf"`);

    // load pdf
    res.send(await this._toPDF(`http://localhost:${config.get('port')}/shop/invoice/${invoice.get('_id').toString()}/print?user=${req.query.user || req.user.get('_id').toString()}&skip=NC5jCAheHPjkZwj2fjpYwIBrjOgGCerj`));
  }


  // ////////////////////////////////////////////////////////////////////////////
  //
  // PRIVATE METHODS
  //
  // ////////////////////////////////////////////////////////////////////////////

  /**
   * create PDF
   *
   * @param  {String}  url
   *
   * @return {Promise}
   */
  _toPDF(url) {
    // eslint-disable-next-line global-require
    const puppeteer = require('puppeteer');

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
 * @type {InvoiceController}
 */
module.exports = InvoiceController;
