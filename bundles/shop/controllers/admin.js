
// bind dependencies
const Controller = require('controller');

// require helpers
const DashboardHelper = helper('dashboard');

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
  constructor () {
    // run super
    super();
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
  async indexAction (req, res) {
    // Render admin page
    res.render('admin', {
      'name'      : 'Admin Shop',
      'type'      : 'admin.shop',
      'jumbotron' : 'Shop Dashboard',
      'dashboard' : await DashboardHelper.render('admin.shop', req.user)
    });
  }
}

/**
 * export ShopAdminController controller
 *
 * @type {ShopAdminController}
 */
exports = module.exports = ShopAdminController;
