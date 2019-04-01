
// bind dependencies
const Controller = require('controller');

// get block model
const Acl       = model('acl');
const User      = model('user');
const Order     = model('order');
const Block     = model('block');
const Payment   = model('payment');
const Dashboard = model('dashboard');

// require helpers
const blockHelper = helper('cms/block');

/**
 * build Block controller
 *
 * @acl      admin.shop
 * @fail     next
 * @mount    /admin/shop
 * @priority 50
 */
class ShopAdminController extends Controller {
  /**
   * construct Block controller
   */
  constructor() {
    // run super
    super();

    // bind methods
    this.blocks = this.blocks.bind(this);

    // register blocks
    this.blocks();
  }

  /**
   * admin Shop index
   *
   * @param  {Request}   req
   * @param  {Response}  res
   * @param  {Function}  next
   *
   * @menu   {ADMIN} Shop
   * @icon   fa fa-shopping-cart
   * @route  {GET} /
   * @layout admin
   */
  async indexAction(req, res) {
    // get dashboards
    const dashboards = await Dashboard.where({
      type : 'admin.shop',
    }).or({
      'user.id' : req.user.get('_id').toString(),
    }, {
      public : true,
    }).find();

    // Render admin page
    res.render('admin', {
      name       : 'Admin Shop',
      type       : 'admin.shop',
      blocks     : blockHelper.renderBlocks('admin'),
      jumbotron  : 'Manage Shop',
      dashboards : await Promise.all(dashboards.map(async (dashboard, i) => dashboard.sanitise(i === 0 ? req : null))),
    });
  }

  /**
   * creates blocks
   */
  blocks() {
    /**
     * STAT WIDGETS
     */

    // register simple block
    blockHelper.block('dashboard.shop.income', {
      acl         : ['admin.shop'],
      for         : ['admin'],
      title       : 'Shop Income Stats',
      description : 'Shop income stat block',
    }, async (req, block) => {
      // get data
      const data = await this._getIncomeStat();

      // set other info
      data.tag = 'stat';
      data.href = '/admin/shop/payment';
      data.titles = {
        today : 'Income Today',
        total : 'Total Income',
      };

      // return
      return data;
    }, async (req, block) => { });

    // register simple block
    blockHelper.block('dashboard.shop.expense', {
      acl         : ['admin.shop'],
      for         : ['admin'],
      title       : 'Shop Expense Stats',
      description : 'Shop expenses stat block',
    }, async (req, block) => {
      // get data
      const data = await this._getExpenseStat();

      // set other info
      data.tag = 'stat';
      data.href = '/admin/shop';
      data.titles = {
        today : 'Expenses Today',
        total : 'Total Expenses',
      };

      // return
      return data;
    }, async (req, block) => { });

    // register simple block
    blockHelper.block('dashboard.shop.orders', {
      acl         : ['admin.shop'],
      for         : ['admin'],
      title       : 'Shop Order Stats',
      description : 'Shop orders stat block',
    }, async (req, block) => {
      // get data
      const data = await this._getOrdersStat();

      // set other info
      data.tag = 'stat';
      data.href = '/admin/shop/order';
      data.titles = {
        today : 'Orders Today',
        total : 'Total Orders',
      };

      // return
      return data;
    }, async (req, block) => { });
  }

  /**
   * income statistics
   *
   * @return {Object}
   */
  async _getIncomeStat() {
    // let date
    const start = new Date();
    start.setHours(24, 0, 0, 0);
    start.setDate(start.getDate() - 14);

    // set last
    const last = new Date();
    last.setHours(24, 0, 0, 0);

    // create Date
    let current = new Date(start);

    // set totals
    const totals = [];
    const values = [];

    // loop for deposits
    while (current <= last) {
      // set next
      const next = new Date(current);
      next.setDate(next.getDate() + 1);

      // return amount sum
      const total = await Payment.where({
        complete : true
      }).gte('created_at', current).lte('created_at', next).gte('amount', 0).sum('amount');

      // add to totals
      totals.push(total);
      values.push(total);

      // add to date
      current = next;
    }

    // set midnight
    const midnight = new Date();
    midnight.setHours(0, 0, 0, 0);

    // return totals and values
    return {
      total   : `$${(await Payment.gte('amount', 0).sum('amount')).toFixed(2)}`,
      today   : `$${(await Payment.gte('amount', 0).gte('created_at', new Date(new Date().setHours(0, 0, 0, 0))).sum('amount')).toFixed(2)}`,
      weekly  : `$${(await Payment.gte('amount', 0).gte('created_at', new Date(midnight.getTime() - (7 * 24 * 60 * 60 * 1000))).sum('amount')).toFixed(2)}`,
      monthly : `$${(await Payment.gte('amount', 0).gte('created_at', new Date(midnight.getTime() - (30 * 24 * 60 * 60 * 1000))).sum('amount')).toFixed(2)}`,

      totals,
      values,
    };
  }

  /**
   * deposit logic
   *
   * @return {Object}
   */
  async _getExpenseStat() {
    // let date
    const start = new Date();
    start.setHours(24, 0, 0, 0);
    start.setDate(start.getDate() - 14);

    // set last
    const last = new Date();
    last.setHours(24, 0, 0, 0);

    // create Date
    let current = new Date(start);

    // set totals
    const totals = [];
    const values = [];

    // loop for deposits
    while (current <= last) {
      // set next
      const next = new Date(current);
      next.setDate(next.getDate() + 1);

      // return amount sum
      const total = await Order.gte('created_at', current).lte('created_at', next).nin('status', [null, 'pending']).gt('expense.total', 0).sum('expense.total');

      // add to totals
      totals.push(total);
      values.push(total);

      // add to date
      current = next;
    }

    // set midnight
    const midnight = new Date();
    midnight.setHours(0, 0, 0, 0);

    // return totals and values
    return {
      total   : `$${(await Order.nin('status', [null, 'pending']).gt('expense.total', 0).sum('expense.total')).toFixed(2)}`,
      today   : `$${(await Order.nin('status', [null, 'pending']).gt('expense.total', 0).gte('created_at', new Date(new Date().setHours(0, 0, 0, 0))).sum('expense.total')).toFixed(2)}`,
      weekly  : `$${(await Order.nin('status', [null, 'pending']).gt('expense.total', 0).gte('created_at', new Date(midnight.getTime() - (7 * 24 * 60 * 60 * 1000))).sum('expense.total')).toFixed(2)}`,
      monthly : `$${(await Order.nin('status', [null, 'pending']).gt('expense.total', 0).gte('created_at', new Date(midnight.getTime() - (30 * 24 * 60 * 60 * 1000))).sum('expense.total')).toFixed(2)}`,

      totals,
      values,
    };
  }

  /**
   * deposit logic
   *
   * @return {Object}
   */
  async _getOrdersStat() {
    // let date
    const start = new Date();
    start.setHours(24, 0, 0, 0);
    start.setDate(start.getDate() - 14);

    // set last
    const last = new Date();
    last.setHours(24, 0, 0, 0);

    // create Date
    let current = new Date(start);

    // set totals
    const totals = [];
    const values = [];

    // loop for deposits
    while (current <= last) {
      // set next
      const next = new Date(current);
      next.setDate(next.getDate() + 1);

      // return amount sum
      const total = await Order.gte('created_at', current).lte('created_at', next).nin('status', [null, 'pending']).count();

      // add to totals
      totals.push(total);
      values.push(total);

      // add to date
      current = next;
    }

    // set midnight
    const midnight = new Date();
    midnight.setHours(0, 0, 0, 0);

    // return totals and values
    return {
      total   : (await Order.nin('status', [null, 'pending']).count()).toLocaleString(),
      today   : (await Order.nin('status', [null, 'pending']).gte('created_at', new Date(new Date().setHours(0, 0, 0, 0))).count()).toLocaleString(),
      weekly  : (await Order.nin('status', [null, 'pending']).gte('created_at', new Date(midnight.getTime() - (7 * 24 * 60 * 60 * 1000))).count()).toLocaleString(),
      monthly : (await Order.nin('status', [null, 'pending']).gte('created_at', new Date(midnight.getTime() - (30 * 24 * 60 * 60 * 1000))).count()).toLocaleString(),

      totals,
      values,
    };
  }
}

/**
 * export ShopAdminController controller
 *
 * @type {ShopAdminController}
 */
exports = module.exports = ShopAdminController;
