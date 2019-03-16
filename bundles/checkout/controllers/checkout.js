
// bind dependencies
const Controller = require('controller');

// require models
const Block   = model('block');
const Order   = model('order');
const Product = model('product');

// require helpers
const orderHelper = helper('order');
const blockHelper = helper('cms/block');

/**
 * build checkout controller
 *
 * @mount /checkout
 */
class CheckoutController extends Controller {
  /**
   * construct user checkout controller
   */
  constructor() {
    // run super
    super();

    // bind private methods
    this._checkout = this._checkout.bind(this);

    // checkout hooks
    this.eden.pre('checkout.init', this._checkout);

    // order hooks
    this.eden.pre('order.init', this._order);

    // Set types
    const types = ['payment', 'summary'];

    // loop block types
    types.forEach((type) => {
      // get uppercase
      const upper = type.charAt(0).toUpperCase() + type.slice(1);

      // register simple block
      blockHelper.block(`checkout.${type}`, {
        for         : ['frontend'],
        title       : `Checkout ${upper} Block`,
        description : `Checkout ${upper} Block`,
      }, async (req, block) => {
        // get notes block from db
        const blockModel = await Block.findOne({
          uuid : block.uuid,
        }) || new Block({
          uuid : block.uuid,
          type : block.type,
        });

        // set locals
        req.checkout = req.checkout || {};

        // get order
        const order = req.checkout.order || await this._getOrder(req);

        // set order
        req.checkout.order = order;

        // return
        return {
          tag   : `checkout-${type}`,
          class : blockModel.get('class') || null,
          block : blockModel.get('block') || null,
          order,
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
        blockModel.set('block', req.body.data.block);

        // save block
        await blockModel.save(req.user);
      });
    });
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
  async indexAction(req, res) {
    // get order
    const sanitisedOrder = await this._getOrder(req);

    // render grid
    res.render('checkout', {
      order  : sanitisedOrder,
      layout : 'product',
    });
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
   * @route {get} /:id
   */
  async continueAction(req, res, next) {
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
      cookies   : req.cookie || req.cookies,
      session   : req.sessionID,
      continued : new Date(),
    });

    // create order
    await this.eden.hook('checkout.create', order);

    // get products
    order.set('products', (await Promise.all((order.get('lines') || []).map(async (line) => {
      // return found product
      const product = await Product.findById(line.product);

      // check products
      if (!product) return null;

      // sanitise
      return product;
    }))).filter(product => product));

    // create order
    await this.eden.hook('checkout.products', order);

    // create order
    await this.eden.hook('checkout.init', order);

    // save order
    await order.save(req.user);

    // create order
    await this.eden.hook('checkout.render', order);

    // sanitise order
    const sanitisedOrder = await order.sanitise();

    // create order
    await this.eden.hook('checkout.render', order, sanitisedOrder);

    // render grid
    res.render('checkout', {
      order : sanitisedOrder,
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
  async completeAction(req, res) {
    // let order
    let order = null;

    // run try/catch
    try {
      // get current order
      order = await Order.findById(req.params.id);
    } catch (e) {}

    // unset error
    order.unset('error');

    // set order meta
    order.set('meta', {
      cookies   : req.cookie || req.cookies,
      session   : req.sessionID,
      continued : new Date(),
    });

    // check user
    if (!await order.get('user')) order.set('user', req.user);

    // set lines
    order.set('lines', req.body.lines);

    // get products
    order.set('products', (await Promise.all((order.get('lines') || []).map(async (line) => {
      // return found product
      const product = await Product.findById(line.product);

      // check products
      if (!product) return null;

      // sanitise
      return product;
    }))).filter(product => product));

    // create order
    await this.eden.hook('checkout.products', order);

    // create order
    await orderHelper.complete(order, req.body);

    // save order
    await order.save(req.user);

    // run hook
    await this.eden.hook('checkout.complete', order);

    // do thank you page
    res.json(await order.sanitise());
  }

  /**
   * checkout order
   *
   * @param  {order} Order
   */
  async _order(order) {

  }

  /**
   * checkout order
   *
   * @param  {Object} order
   */
  async _checkout(order) {

  }

  /**
   * get order
   *
   * @param  {Request}  req
   *
   * @return {Promise}
   */
  async _getOrder(req) {
    // get cart lines
    const cart = await this.eden.call('cart', req.sessionID, req.user);

    // lock cart
    await cart.lock();

    // run try/catch
    try {
      // create order
      const order = await Order.findOne({
        status    : null,
        'cart.id' : (cart.get('_id') || '').toString(),
      }) || new Order({
        cart,
        user : req.user,
        meta : {
          started : new Date(),
          cookies : req.cookie || req.cookies,
          session : req.sessionID,
        },
        actions : {},
      });

      // set cart lines
      order.set('lines', await orderHelper.lines(order, cart.get('lines')));

      // save order
      await order.save(req.user);

      // create order
      await this.eden.hook('checkout.create', order);

      // get products
      order.set('products', (await Promise.all((cart.get('lines') || []).map(async (line) => {
        // return found product
        return await Product.findById(line.product);
      }))).filter(product => product));

      // create order
      await this.eden.hook('checkout.products', order);

      // create order
      await this.eden.hook('checkout.init', order);

      // save order
      await order.save(req.user);

      // create order
      await this.eden.hook('checkout.render', order);

      // sanitise order
      const sanitisedOrder = await order.sanitise();

      // create order
      await this.eden.hook('checkout.render', order, sanitisedOrder);

      // unlock cart
      cart.unlock();

      // return sanitised order
      return sanitisedOrder;
    } catch (e) {
      // unlock cart
      cart.unlock();

      // throw error
      throw e;
    }
  }
}

/**
 * export cart controller
 *
 * @type {CheckoutController}
 */
exports = module.exports = CheckoutController;
