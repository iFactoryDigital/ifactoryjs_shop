
// bind dependencies
const alert      = require('alert');
const config     = require('config');
const socket     = require('socket');
const Controller = require('controller');

// require models
const Cart    = model('cart');
const Block   = model('block');
const Product = model('product');

// require helpers
const BlockHelper   = helper('cms/block');
const ProductHelper = helper('product');

/**
 * build cart controller
 *
 * @mount /cart
 */
class CartController extends Controller {
  /**
   * construct user cart controller
   */
  constructor () {
    // run super
    super();

    // bind methods
    this.build = this.build.bind(this);

    // bind private methods
    this._checkout   = this._checkout.bind(this);
    this._middleware = this._middleware.bind(this);

    // build
    this.build();
  }

  /**
   * builds cart controller
   */
  build () {
    // use settings middleware
    this.eden.router.use(this._middleware);

    // on render
    this.eden.pre('view.compile', (render) => {
      // move menus
      if (render.state.cart) render.cart = render.state.cart;

      // delete from state
      delete render.state.cart;
    });

    // pre order create
    this.eden.pre('checkout.complete', this._checkout);

    // add cart endpoint
    this.eden.endpoint('cart', async (session, user) => {
      // return found or new cart
      let cart = await Cart.or({
        'sessionID' : session
      },
      {
        'user.id' : user && user.get('_id') ? user.get('_id').toString() : 'false'
      }).findOne() || new Cart({
        'user'      : user,
        'sessionID' : session
      });

      // save cart
      await cart.save();

      // return cart
      return cart;
    });

    // register simple block
    BlockHelper.block('cart.dropdown', {
      'for'         : ['frontend'],
      'title'       : 'Cart Dropdown',
      'description' : 'Cart Dropdown block'
    }, async (req, block) => {
      // get notes block from db
      let blockModel = await Block.findOne({
        'uuid' : block.uuid
      }) || new Block({
        'uuid' : block.uuid,
        'type' : block.type
      });

      // return
      return {
        'tag'      : 'cart-dropdown',
        'class'    : blockModel.get('class') || null,
        'dropdown' : blockModel.get('dropdown') || null
      };
    }, async (req, block) => {
      // get notes block from db
      let blockModel = await Block.findOne({
        'uuid' : block.uuid
      }) || new Block({
        'uuid' : block.uuid,
        'type' : block.type
      });

      // set data
      blockModel.set('class',    req.body.data.class);
      blockModel.set('dropdown', req.body.data.dropdown);

      // save block
      await blockModel.save();
    });
  }

  /**
   * cart action
   *
   * @param req
   * @param res
   *
   * @route {POST} /update
   */
  async updateCartAction (req, res) {
    // set session
    let sessionID = req.sessionID;

    // load cart
    let cart = await this.eden.call('cart', sessionID, req.user);

    // get items
    let products = [];

    // set lines
    let lines = [];

    // loop lines
    for (let line of (req.body.lines || [])) {
      // get product
      let product = await Product.findById(line.product);

      // set extra data
      req.line  = line;
      req.lines = lines;

      // run try/catch
      try {
        // check can add
        if (await ProductHelper.order(product, line, req) === false) {
          // return null
          continue;
        }
      } catch (e) {
        console.log(e);
        // continue on error
        continue;
      }

      // push line
      lines.push(line);

      // check push product
      if (!products.find((p) => p.get('_id').toString() !== product.get('_id').toString())) {
        // push product
        products.push(product);
      }
    }

    // set products
    cart.set('lines',    lines);
    cart.set('products', products);

    // save cart
    await cart.save();

    // get sanitised
    let sanitised = await cart.sanitise();

    // set id
    sanitised.id = req.body.id;

    // emit to user/socket
    socket.session(sessionID, 'cart', sanitised);

    // alert success
    req.alert('success', 'Successfully updated cart');

    // return JSON
    res.json({
      'success' : true
    });
  }

  /**
   * Adds user to locals
   *
   * @param {Request} req
   * @param {Response} res
   * @param {Function} next
   */
  async _middleware (req, res, next) {
    // load cart
    let cart = await this.eden.call('cart', req.sessionID, req.user);

    // add to user
    res.locals.cart = await cart.sanitise();

    // Run next
    next();
  }

  /**
   * checkout middleware
   *
   * @param  {order}  Order
   *
   * @return {Promise}
   */
  async _checkout (order) {
    // check error
    if (order.get('error')) return;

    // set session
    let session = order.get('sessionID') || '';

    // get user
    let user = await order.get('user');

    // delete carts
    await Promise.all((await Cart.or({
      'sessionID' : session
    }, {
      'user.id' : user ? user.get('_id').toString() : null
    }).find()).map((cart) => cart.remove()));

    // load cart
    let cart = await this.eden.call('cart', session, user);

    // save cart
    await cart.save();

    // emit to user/socket
    socket.user(user, 'cart', await cart.sanitise());
  }
}

/**
 * export Cart controller
 *
 * @type {CartController}
 */
exports = module.exports = CartController;
