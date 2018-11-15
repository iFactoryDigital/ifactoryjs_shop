
// bind dependencies
const config     = require('config');
const Controller = require('controller');

// require models
const Block   = model('block');
const Product = model('product');

// get helpers
const BlockHelper   = helper('cms/block');
const ProductHelper = helper('product');

/**
 * build product controller
 *
 * @mount /product
 */
class ProductController extends Controller {
  /**
   * construct user productController controller
   */
  constructor () {
    // run super
    super();

    // bind build methods
    this.build = this.build.bind(this);

    // bind methods
    this.viewAction = this.viewAction.bind(this);

    // bind private methods
    this._order        = this._order.bind(this);
    this._pricing      = this._pricing.bind(this);
    this._availability = this._availability.bind(this);

    // build product helper
    this.build();
  }

  /**
   * order individual item
   */
  async build() {
    // await hooks
    this.eden.pre('product.order', this._order);

    // price hooks
    this.eden.pre('line.price', this._variationPrice);

    // await simple product
    this.eden.pre('product.simple.pricing',      this._pricing);
    this.eden.pre('product.simple.availability', this._availability);

    // await variable pricing
    this.eden.pre('product.variable.pricing',      this._pricing);
    this.eden.pre('product.variable.availability', this._availability);

    // get categories
    (await Product.find({
      'published' : true
    })).map(async (product) => {
      // add to eden
      this.eden.sitemap.add({
        'url' : '/product/' + product.get('slug'),
        'img' : await Promise.all((await product.get('images') || []).map(async (image) => {
          // return image
          return {
            'url'     : await image.url('md-sq'),
            'title'   : product.get('title.en-us'),
            'caption' : image.get('name'),
            'license' : 'https://creativecommons.org/licenses/by/4.0/'
          };
        })),
        'lastmod'    : product.get('updated_at'),
        'priority'   : 0.8,
        'changefreq' : 'daily'
      });
    });

    // register simple block
    BlockHelper.block('frotend.products', {
      'for'         : ['frontend'],
      'title'       : 'Products List',
      'description' : 'Lets list product cards in a block'
    }, async (req, block) => {
      // get notes block from db
      let blockModel = await Block.findOne({
        'uuid' : block.uuid
      }) || new Block({
        'uuid' : block.uuid,
        'type' : block.type
      });

      // get products
      let products = await Product.where({
        'promoted' : true
      }).find();

      // return
      return {
        'tag'      : 'products',
        'col'      : blockModel.get('col') || null,
        'row'      : blockModel.get('row') || null,
        'class'    : blockModel.get('class') || null,
        'title'    : blockModel.get('title') || '',
        'products' : await Promise.all(products.map((product) => product.sanitise()))
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
      blockModel.set('col',   req.body.data.col);
      blockModel.set('row',   req.body.data.row);
      blockModel.set('class', req.body.data.class);
      blockModel.set('title', req.body.data.title);

      // save block
      await blockModel.save();
    });
  }

  /**
   * index action
   *
   * @param req
   * @param res
   *
   * @route {get} /:slug
   */
  async viewAction (req, res, next) {
    // get product
    let product = await Product.findOne({
      'slug' : req.params.slug
    });

    // check product
    if (!product || product.get('active') === false) return next();

    // get image
    let image = (await product.get('images') || []).length ? (await product.get('images'))[0] : null;

    // sanitise product
    let sanitised = await product.sanitise();

    // og data
    req.og('type',      'product');
    req.og('site_name', config.get('title'));

    // do meta
    if (image) req.image(await image.url('md-sq'));
    req.title(product.get('title.' + req.language));
    req.description(product.get('short.' + req.language));

    // add meta
    req.twitter('card',    'summary_large_image');
    req.twitter('site',    '@wevapeShop');
    req.twitter('title',   product.get('title.' + req.language));
    req.twitter('creator', '@wevapeShop');

    // set og tags
    req.meta('product:condition',      'new');
    req.meta('product:availability',   (parseInt(product.get('availability.quantity')) > 0 ? 'instock' : 'oos'));
    req.meta('product:price:amount',   parseFloat(sanitised.price).toFixed(2));
    req.meta('product:modified_time',  product.get('updated_at').toISOString());
    req.meta('product:published_time', product.get('created_at').toISOString());
    req.meta('product:price:currency', 'USD');

    // add structured data
    res.locals.page.head = (res.locals.page.head || '') + [
      '<script type="application/ld+json">',
        JSON.stringify({
          '@context' : 'http://schema.org/',
          '@type'    : 'Product',

          'name'        : product.get('title.' + req.language),
          'image'       : image ? await image.url('md-sq') : null,
          'description' : product.get('short.' + req.language),

          'offers'      : {
            '@type'         : 'Offer',
            'price'         : parseFloat(sanitised.price).toFixed(2),
            'priceCurrency' : 'USD',
          }
        }),
      '</script>'
    ].join('');

    // render product page
    res.render('product', {
      'title'   : product.get('title.' + req.language),
      'query'   : req.query || {},
      'layout'  : 'product',
      'product' : sanitised
    });
  }

  /**
   * order product function
   *
   * @param  {Object} data
   */
  async _order (data) {
    // set qty
    let qty     = data.qty;
    let opts    = data.opts;
    let product = data.product;

    // check price
    await this.eden.hook('product.' + product.get('type') + '.pricing',      data);
    await this.eden.hook('product.' + product.get('type') + '.availability', data);
  }

  /**
   * hook product information
   *
   * @param  {Object}  data
   *
   * @return {Promise}
   */
  async _pricing (data) {
    // return on error
    if (data.error) return;

    // set price
    data.price = parseFloat(data.product.get('pricing.price'));
  }

  /**
   * hook product information
   *
   * @param  {Object}  data
   *
   * @return {Promise}
   */
  async _availability (data) {
    // return on error
    if (data.error) return;

    // check available
    if (data.qty > data.product.get('availability.quantity')) data.error = {
      'id'   : 'availability.notavailable',
      'text' : 'Not enough quantity available'
    };
  }

  /**
   * alter variation price
   *
   * @param  {Object} opts
   *
   * @return {*}
   */
  async _variationPrice (opts) {
    // check product type
    if (opts.item.product.get('type') !== 'variable') return;

    // set price
    let price = parseFloat(opts.item.product.get('pricing.price'));

    // get variations
    let variations = await opts.item.product.get('variations');

    // loop for variations
    for (let type in variations) {
      // check found option
      let found = variations[type].options.find((option) => opts.item.opts.includes(option.sku));

      // check found
      if (!found) {
        // throw error
        throw new Error('Variation missing options');
      }

      // add to price
      price += parseFloat(found.price);
    }

    // set price
    opts.base  = price;
    opts.price = price * opts.item.qty;
  }
}

/**
 * export Product Controller
 *
 * @type {ProductController}
 */
exports = module.exports = ProductController;
