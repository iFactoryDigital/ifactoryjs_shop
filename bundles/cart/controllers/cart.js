
// bind dependencies
const socket     = require('socket');
const Controller = require('controller');

// require models
const Cart    = model('cart');
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
  constructor() {
    // run super
    super();

    // bind methods
    this.build = this.build.bind(this);

    // bind private methods
    this._middleware = this._middleware.bind(this);

    // build
    this.build();
  }

  /**
   * builds cart controller
   */
  build() {
    // use settings middleware
    this.eden.router.use(this._middleware);

    // on render
    this.eden.pre('view.compile', (render) => {
      // move menus
      if (render.state.cart) render.cart = render.state.cart;

      // delete from state
      delete render.state.cart;
    });

    // add cart endpoint
    this.eden.endpoint('cart', async (session, user) => {
      // return found or new cart
      const cart = await Cart.or({
        sessionID : session,
      },
      {
        'user.id' : user && user.get('_id') ? user.get('_id').toString() : 'false',
      }).findOne() || new Cart({
        user,
        sessionID : session,
      });

      // save cart
      await cart.save();

      // return cart
      return cart;
    });

    // add cart endpoint
    this.eden.post('order.complete', async (order) => {
      // get cart lines
      let cart = await order.get('cart');
      const user = await order.get('user');

      // remove cart
      if (cart) await cart.remove();

      // create new cart
      cart = new Cart({
        user      : await order.get('user'),
        sessionID : order.get('meta.session'),
      });

      // save cart
      await cart.save();

      // emit to user/socket
      socket[user ? 'user' : 'session'](user || order.get('meta.session'), 'cart', await cart.sanitise());
    });

    // register simple block
    BlockHelper.block('cart.dropdown', {
      for         : ['frontend'],
      title       : 'Cart Dropdown',
      description : 'Cart Dropdown block',
    }, async (req, block) => {
      // return
      return {
        tag      : 'cart-dropdown',
        class    : block.class || null,
        dropdown : block.dropdown || null,
      };
    }, async (req, block) => {});
  }

  /**
   * cart action
   *
   * @param req
   * @param res
   *
   * @route {POST} /update
   */
  async updateCartAction(req, res) {
    // set session
    const sessionID = req.sessionID;

    // load cart
    const cart = await this.eden.call('cart', sessionID, req.user);

    // get items
    const products = [];

    // set lines
    const lines = [];

    // loop lines
    for (const line of (req.body.lines || [])) {
      // get product
      const product = await Product.findById(line.product);

      // set extra data
      req.line = line;
      req.lines = lines;

      // run try/catch
      try {
        // check can add
        if (await ProductHelper.order(product, line, req) === false) {
          // return null
          continue;
        }
      } catch (e) {
        // continue on error
        continue;
      }

      // push line
      lines.push(line);

      // check push product
      if (!products.find(p => p.get('_id').toString() !== product.get('_id').toString())) {
        // push product
        products.push(product);
      }
    }

    // set products
    cart.set('lines', lines);
    cart.set('products', products);

    // save cart
    await cart.save();

    // get sanitised
    const sanitised = await cart.sanitise();

    // set id
    sanitised.id = req.body.id;

    // emit to user/socket
    socket.session(sessionID, 'cart', sanitised);

    // alert success
    req.alert('success', 'Successfully updated cart');

    // return JSON
    res.json({
      success : true,
    });
  }

  /**
   * Adds user to locals
   *
   * @param {Request} req
   * @param {Response} res
   * @param {Function} next
   */
  async _middleware(req, res, next) {
    // load cart
    const cart = await this.eden.call('cart', req.sessionID, req.user);

    // add to user
    res.locals.cart = await cart.sanitise();

    // Run next
    next();
  }
}

/**
 * export Cart controller
 *
 * @type {CartController}
 */
exports = module.exports = CartController;
