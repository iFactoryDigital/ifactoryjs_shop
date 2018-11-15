
// bind dependencies
const config     = require('config');
const crypto     = require('crypto');
const Controller = require('controller');

// require helpers
const orderHelper = helper('order');

// require models
const User    = model('user');
const Order   = model('order');
const Product = model('product');

/**
 * build checkout controller
 *
 * @mount /checkout
 */
class CheckoutController extends Controller {
  /**
   * construct user checkout controller
   */
  constructor () {
    // run super
    super();

    // bind private methods
    this._checkout = this._checkout.bind(this);

    // checkout hooks
    this.eden.pre('checkout.init', this._checkout);

    // order hooks
    this.eden.pre('order.init',  this._order);
    this.eden.pre('order.guest', this._guest);
  }

  /**
   * index action
   *
   * @param req
   * @param res
   *
   * @acl   true
   * @fail  /login?redirect=/checkout
   * @title Cart
   * @route {get} /
   */
  async indexAction (req, res) {
    // get cart lines
    let cart = await this.eden.call('cart', req.sessionID, req.user);

    // create order
    let order = await Order.findOne({
      'cart.id' : cart.get('_id').toString()
    }) || new Order({
      'cart' : cart,
      'user' : req.user,
      'meta' : {
        'started' : new Date(),
        'cookies' : req.cookie || req.cookies,
        'session' : req.sessionID
      },
      'lines'   : cart.get('lines') || [],
      'actions' : {}
    });

    // create order
    await this.eden.hook('checkout.create', order);

    // get products
    order.set('products', (await Promise.all((cart.get('lines') || []).map(async (line) => {
      // return found product
      return await Product.findById(line.product);
    }))).filter((product) => product));

    // create order
    await this.eden.hook('checkout.products', order);

    // create order
    await this.eden.hook('checkout.init', order);

    // save order
    await order.save();

    // create order
    await this.eden.hook('checkout.render', order);

    // sanitise order
    let sanitisedOrder = await order.sanitise();

    // create order
    await this.eden.hook('checkout.render', order, sanitisedOrder);

    // render grid
    res.render('checkout', {
      'order'  : sanitisedOrder,
      'layout' : 'product'
    });
  }

  /**
   * index action
   *
   * @param req
   * @param res
   *
   * @acl    true
   * @fail   /login?redirect=/checkout
   * @title  Cart
   * @route  {get} /:id
   * @layout no-user
   */
  async continueAction (req, res, next) {
    // let order
    let order = null;

    // run try/catch
    try {
      // get current order
      order = await Order.findById(req.params.id);
    } catch (e) {}

    // check order
    if (!order) return next();

    // set order meta
    order.set('meta', {
      'cookies'   : req.cookie || req.cookies,
      'session'   : req.sessionID,
      'continued' : new Date()
    });

    // create order
    await this.eden.hook('checkout.create', order);

    // get products
    order.set('products', (await Promise.all((cart.get('lines') || []).map(async (line) => {
      // return found product
      let product = await Product.findById(line.product);

      // check products
      if (!product) return null;

      // sanitise
      return await product.sanitise();
    }))).filter((product) => product));

    // create order
    await this.eden.hook('checkout.products', order);

    // create order
    await this.eden.hook('checkout.init', order);

    // save order
    await order.save();

    // create order
    await this.eden.hook('checkout.render', order);

    // sanitise order
    let sanitisedOrder = await order.sanitise();

    // create order
    await this.eden.hook('checkout.render', order, sanitisedOrder);

    // render grid
    res.render('checkout', {
      'order' : sanitisedOrder
    });
  }

  /**
   * order call action
   *
   * @param  {Array}  lines
   * @param  {Object} opts
   *
   * @route  {POST} /:id/complete
   * @return {Promise}
   */
  async completeAction (req, res) {
    // let order
    let order = null;

    // run try/catch
    try {
      // get current order
      order = await Order.findById(req.params.id);
    } catch (e) {}

    // create order
    await orderHelper.complete(order, req.body);

    // set order meta
    order.set('meta', {
      'cookies'   : req.cookie || req.cookies,
      'session'   : req.sessionID,
      'continued' : new Date()
    });

    // save order
    await order.save();

    // run hook
    await this.eden.hook('checkout.complete', order);

    // do thank you page
    res.json(await order.sanitise());
  }

  /**
   * on address
   *
   * @param  {order}  Order
   * @param  {Object} action
   *
   * @return {Promise}
   */
  async _guest (order, action) {
    // check error
    if (order.get('error') || await order.get('user')) return;

    // check address
    if (!action.value || (typeof action.value === 'object' && (!action.value.email || !action.value.email.length))) return order.set('error', 'Order is missing address');

    // set email
    order.set('email', action.value.email);

    // check other details
    if (action.value.create) {
      // find user by email
      let check = await User.findOne({
        'email' : new RegExp(action.value.email.toString().toLowerCase(), 'i')
      });

      // set check
      if (check) return order.set('error', 'The email "' + order.get('email') + '" already exists, please login first');

      // create new user
      let user = new User({
        'email'     : action.value.email,
        'marketing' : action.value.marketing
      });

      // set password
      let hash = crypto.createHmac('sha256', config.get('secret'))
          .update(action.value.password)
          .digest('hex');

      // create user
      user.set('hash', hash);

      // save user
      await user.save();

      // set to order
      order.set('user', user);
    }
  }

  /**
   * checkout order
   *
   * @param  {order} Order
   */
  async _order (order) {
    // check order
    let actions = order.get('actions');

    // check user
    if (await order.get('user')) return;

    // get action
    let action = Object.values(actions).find((action) => {
      // return address
      return action.type === 'guest';
    });

    // check found
    if (!action) return order.set('error', 'Order is missing guest details');
  }

  /**
   * checkout order
   *
   * @param  {Object} order
   */
  async _checkout (order) {
    // check order
    if (!order.get('user.id')) {
      // check actions
      order.set('actions.guest', {
        'type'     : 'guest',
        'data'     : {},
        'priority' : 0
      });
    }
  }
}

/**
 * export cart controller
 *
 * @type {CheckoutController}
 */
exports = module.exports = CheckoutController;
