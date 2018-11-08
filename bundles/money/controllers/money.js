
// Require dependencies
const config     = require('config');
const socket     = require('socket');
const currency   = require('currency-converter');
const Controller = require('controller');

// require helpers
const settings = helper('settings');

/**
 * Create money controller
 */
class MoneyController extends Controller {
  /**
   * construct user controller
   */
  constructor () {
    // Run super
    super();

    // set variables
    this.rates    = this.eden.get('rates') || {};
    this.currency = new currency({
      'CLIENTKEY' : config.get('openexchanges.key')
    });

    // bind private methods
    this._rates   = this._rates.bind(this);
    this._invoice = this._invoice.bind(this);

    // bind methods
    this.build = this.build.bind(this);

    // Run
    this.building = this.build();
  }

  /**
   * build money controller
   *
   * @param {router} router
   */
  async build () {
    // on render
    this.eden.pre('view.compile', async (render) => {
      // await building
      await this.building;

      // set categories
      render.rates = this.rates;
    });

    // pre invoice
    this.eden.pre('invoice.init', this._invoice);

    // get rates
    this.building = await this._rates();

    // set interval
    setInterval(this._rates, 30 * 60 * 1000);
  }

  /**
   * gets rates
   */
  async _rates () {
    // log exchange rates
    this.rates.USD = 1;
    this.rates.AUD = await this.currency.rates('USD', 'AUD');
    this.rates.CNY = await this.currency.rates('USD', 'CNY');
    this.rates.EUR = await this.currency.rates('USD', 'EUR');
    this.rates.NZD = await this.currency.rates('USD', 'NZD');
    this.rates.JPY = await this.currency.rates('USD', 'JPY');

    // set rates
    this.eden.set('rates', this.rates);

    // emit to socket
    socket.emit('rates', this.rates);
  }

  /**
   * set invoice currency
   *
   * @return {Promise}
   */
  async _invoice (invoice) {
    // get rates
    let rates = await this.eden.get('rates') || this.rates;

    // get rate
    let currency = await settings.get(await invoice.get('user'), 'currency') || 'USD';

    // set currency
    invoice.set('rate',     rates[currency] || 1);
    invoice.set('total',    invoice.get('total') * invoice.get('rate'));
    invoice.set('currency', (Object.keys(this.rates).includes(currency)) ? currency : 'USD');

    // round currencies
    if (currency === 'JPY') {
      // round to nearest 10
      invoice.set('total', Math.ceil(invoice.get('total') / 10) * 10);
    } else {
      // round to nearest 10
      invoice.set('total', Math.ceil(invoice.get('total') * 10) / 10);
    }
  }
}

/**
 * eport money controller
 *
 * @type {MoneyController}
 */
module.exports = MoneyController;
