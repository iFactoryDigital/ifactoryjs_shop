
// Require dependencies
const config     = require('config');
const socket     = require('socket');
const Currency   = require('currency-converter');
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
  constructor() {
    // Run super
    super();

    // set variables
    this.rates = this.eden.get('rates') || {};
    this.currency = new Currency({
      CLIENTKEY : config.get('openexchanges.key'),
    });

    // bind private methods
    this._rates = this._rates.bind(this);
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
  async build() {
    // on render
    this.eden.pre('view.compile', async (render) => {
      // not in json
      if (render.isJSON) return;

      // await building
      await this.building;

      // set categories
      render.shop = {
        rates    : this.rates,
        currency : config.get('shop.currency') || 'USD',
      };
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
  async _rates() {
    // set rates
    const rates = config.get('shop.currencies') || [config.get('shop.currency') || 'USD'];

    // set default
    for (const rate of rates) {
      // set rate
      this.rates[rate] = await this.currency.rates(config.get('shop.currency') || 'USD', rate);
    }

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
  async _invoice(invoice) {
    // get rates
    const rates = await this.eden.get('rates') || this.rates;

    // get rate
    const currency = await settings.get(await invoice.get('user'), 'currency') || config.get('shop.currency') || 'USD';

    // set currency
    invoice.set('rate', rates[currency] || 1);
    invoice.set('total', invoice.get('total') * invoice.get('rate'));
    invoice.set('currency', (Object.keys(this.rates).includes(currency)) ? currency : config.get('shop.currency') || 'USD');

    // round currencies
    if (currency === 'JPY') {
      // round to nearest 10
      invoice.set('total', Math.ceil(invoice.get('total') / 10) * 10);
    }
  }
}

/**
 * eport money controller
 *
 * @type {MoneyController}
 */
module.exports = MoneyController;
