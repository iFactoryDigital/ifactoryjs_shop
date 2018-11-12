
// bind dependencies
const Controller = require('controller');

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
   * @menu  {ADMIN} Shop
   * @icon  fa fa-shopping-cart
   * @route {GET} /
   */
  async indexAction (req, res) {

  }
}

/**
 * export ShopAdminController controller
 *
 * @type {ShopAdminController}
 */
exports = module.exports = ShopAdminController;
