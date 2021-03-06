
// bind dependencies
const Grid       = require('grid');
const config     = require('config');
const Controller = require('controller');

// require models
const Product  = model('product');
const Category = model('category');

// get helpers
const blockHelper   = helper('cms/block');
const productHelper = helper('product');

/**
 * build product controller
 *
 * @mount /product
 */
class ProductController extends Controller {
  /**
   * construct user productController controller
   */
  constructor() {
    // run super
    super();

    // bind build methods
    this.build = this.build.bind(this);

    // bind methods
    this.viewAction = this.viewAction.bind(this);

    // build product helper
    this.building = this.build();
  }


  // ////////////////////////////////////////////////////////////////////////////
  //
  // BUILD METHODS
  //
  // ////////////////////////////////////////////////////////////////////////////

  /**
   * order individual item
   */
  async build() {
    // get categories
    (await Product.find({
      published : true,
    })).map(async (product) => {
      // add to eden
      this.eden.sitemap.add({
        url : `/product/${product.get('slug')}`,
        img : await Promise.all((await product.get('images') || []).map(async (image) => {
          // return image
          return {
            url     : await image.url('md-sq'),
            title   : product.get('title.en-us'),
            caption : image.get('name'),
            license : 'https://creativecommons.org/licenses/by/4.0/',
          };
        })),
        lastmod    : product.get('updated_at'),
        priority   : 0.8,
        changefreq : 'daily',
      });
    });

    // register simple block
    blockHelper.block('frotend.products', {
      for         : ['frontend'],
      title       : 'Products List',
      description : 'Lets list product cards in a block',
    }, async (req) => {
      // get products
      const query = await Product.where({
        promoted : true,
      });

      // set data
      const data = {
        query,
        req,
      };

      // hook
      await this.eden.hook('frontend.products.query', data);

      // return
      return {
        tag      : 'products',
        products : await Promise.all((await data.query.find()).map(product => product.sanitise())),
      };
    }, async () => { });

    // register simple block
    blockHelper.block('frotend.product', {
      for         : ['frontend'],
      title       : 'Product Card',
      description : 'Shows a single product card',
    }, async (req, block) => {
      // get products
      const product = block.product ? await Product.findById(block.product) : null;

      // return
      return {
        tag     : 'product',
        product : product ? await product.sanitise() : null,
      };
    }, async () => { });


    // Register product types
    productHelper.register('simple', {
      options  : ['availability'],
      sections : ['simple-pricing', 'display'],
    }, async (product) => {
      // return price
      return {
        amount    : parseFloat(product.get('pricing.price')),
        currency  : config.get('shop.currency') || 'USD',
        available : product.get('availability.quantity') > 0,
      };
    }, async () => {

    }, async () => {

    });

    // Register variable product
    productHelper.register('variable', {
      options  : ['availability'],
      sections : ['variable-pricing', 'variations', 'display'],
    }, async (product, opts) => {
      // set opts
      if (!opts) opts = [];

      // remove object
      opts = Object.values(opts);

      // set price
      let price = parseFloat(product.get('pricing.price'));

      // get variations
      const variations = await product.get('variations');

      // loop for variations
      Object.keys(variations).forEach((type) => {
        // check found option
        const found = (variations[type].options || []).find((option) => {
          // return includes
          return (opts || []).includes(option.sku);
        }) || (variations[type].options || [])[0];

        // add to price
        if (found) price += parseFloat(found.price);
      });

      // return price
      return {
        base      : parseFloat(product.get('pricing.price')),
        amount    : parseFloat(price),
        currency  : config.get('shop.currency') || 'USD',
        available : product.get('availability.quantity') > 0,
      };
    }, async () => {

    }, async () => {

    });
  }


  // ////////////////////////////////////////////////////////////////////////////
  //
  // HOOK METHODS
  //
  // ////////////////////////////////////////////////////////////////////////////

  /**
   * order product function
   *
   * @pre   product.order
   * @param {Object} data
   */
  async orderHook(data) {
    // set qty
    const { product } = data;

    // check price
    await this.eden.hook(`product.${product.get('type')}.pricing`, data);
    await this.eden.hook(`product.${product.get('type')}.availability`, data);
  }

  /**
   * sanitise hook
   *
   * @pre   product.sanitise
   * @param {Object} data
   */
  async sanitiseHook({ sanitised, product }) {
    // check variable
    if (product.get('type') !== 'variable') return;

    // get variations
    sanitised.variations = product.get('variations');
  }


  // ////////////////////////////////////////////////////////////////////////////
  //
  // ACTION METHODS
  //
  // ////////////////////////////////////////////////////////////////////////////

  /**
   * index action
   *
   * @param req
   * @param res
   *
   * @route {get} /:slug
   */
  async viewAction(req, res, next) {
    // get product
    const product = await Product.findOne({
      slug : req.params.slug,
    });

    // check product
    if (!product || product.get('active') === false) return next();

    // get image
    const image = (await product.get('images') || []).length ? (await product.get('images'))[0] : null;

    // sanitise product
    const sanitised = await product.sanitise();

    // og data
    req.og('type', 'product');
    req.og('site_name', config.get('title'));

    // do meta
    if (image) req.image(await image.url('md-sq'));
    req.title(product.get(`title.${req.language}`) || '');
    req.description(product.get(`short.${req.language}`) || '');

    // add meta
    req.twitter('card', 'summary_large_image');
    req.twitter('site', '@wevapeShop');
    req.twitter('title', product.get(`title.${req.language}`));
    req.twitter('creator', '@wevapeShop');

    // set og tags
    req.meta('product:condition', 'new');
    req.meta('product:availability', (parseInt(product.get('availability.quantity'), 10) > 0 ? 'instock' : 'oos'));
    req.meta('product:price:amount', parseFloat(sanitised.price).toFixed(2));
    req.meta('product:modified_time', product.get('updated_at').toISOString());
    req.meta('product:published_time', product.get('created_at').toISOString());
    req.meta('product:price:currency', config.get('shop.currency') || 'USD');

    // add structured data
    res.locals.page.head = (res.locals.page.head || '') + [
      '<script type="application/ld+json">',
      JSON.stringify({
        '@context' : 'http://schema.org/',
        '@type'    : 'Product',

        name        : product.get(`title.${req.language}`),
        image       : image ? await image.url('md-sq') : null,
        description : product.get(`short.${req.language}`),

        offers : {
          '@type'         : 'Offer',
          price         : parseFloat(sanitised.price).toFixed(2),
          priceCurrency : config.get('shop.currency') || 'USD',
        },
      }),
      '</script>',
    ].join('');

    // render product page
    return res.render('product', {
      title   : product.get(`title.${req.language}`),
      query   : req.query || {},
      layout  : 'product',
      product : sanitised,
    });
  }

  /**
   * User grid action
   *
   * @param {Request}  req
   * @param {Response} res
   *
   * @route {post} /grid
   */
  async gridAction(req, res) {
    // check category
    if (req.query.category || req.query.cat) {
      // set category
      req.category = await Category.findById(req.query.category || req.query.cat);
    }

    // Return post grid request
    return (await this._grid(req)).post(req, res);
  }


  // ////////////////////////////////////////////////////////////////////////////
  //
  // PRIVATE METHODS
  //
  // ////////////////////////////////////////////////////////////////////////////

  /**
   * Renders grid
   *
   * @return {grid}
   */
  async _grid(req) {
    // Create new grid
    const productGrid = new Grid();

    // Set route
    productGrid.route('/product/grid');

    // check category
    if (req.category) {
      // route
      productGrid.route(`/product/grid?cat=${req.category.get('_id')}`);
    }

    // Set grid model
    productGrid.bar(false);
    productGrid.row('product-row');
    productGrid.model(Product);
    productGrid.models(true);

    // check published
    productGrid.where({
      published : true,
    });

    // category
    if (req.category) {
      // check category
      productGrid.where({
        'categories.id' : req.category.get('_id').toString(),
      });
    }

    // Set default sort order
    productGrid.sort('created_at', -1);

    // Return grid
    return productGrid;
  }
}

/**
 * export Product Controller
 *
 * @type {ProductController}
 */
module.exports = ProductController;
