
// bind dependencies
const config     = require('config');
const Controller = require('controller');

// require models
const Product  = model('product');
const Category = model('category');

// require helpers
const categoryHelper = helper('category');

/**
 * build category controller
 *
 * @mount /
 */
class CategoryController extends Controller {
  /**
   * construct category controller
   */
  constructor () {
    // run super
    super();

    // bind methods
    this.build       = this.build.bind(this);
    this.indexAction = this.indexAction.bind(this);

    // run build method
    this.build();
  }

  /**
   * build category controller
   */
  async build () {
    // on render
    this.eden.pre('view.compile', async (render) => {
      // set categories
      render.categories = categoryHelper.sanitised;
    });

    // get categories
    (await Category.find({
      'active' : true
    })).map((category) => {
      // add to eden
      this.eden.sitemap.add({
        'url'        : '/' + category.get('slug'),
        'priority'   : 1,
        'changefreq' : 'daily'
      });
    });
  }

  /**
   * index action
   *
   * @param req
   * @param res
   *
   * @title  Categories
   * @route  {get} /categories
   */
  async indexAction (req, res) {
    // render grid
    res.render('categories');
  }

  /**
   * index action
   *
   * @param req
   * @param res
   * @param {Function} next
   *
   * @route  {get} /:cat
   * @route  {get} /:sub/:cat
   * @route  {get} /:sub/:sub/:cat
   * @route  {get} /:sub/:sub/:sub/:cat
   */
  async slugAction (req, res, next) {
    // get category
    let category = await Category.findOne({
      'slug' : req.params.cat
    });

    // check category
    if (!category) return next();

    // get parent
    let trail   = [category];
    let parent  = await category.get('parent');
    let nextCat = await category.get('parent');

    // while
    while (nextCat) {
      // set parent
      parent = nextCat;

      // push parent
      trail.push(parent);

      // set next
      nextCat = await parent.get('parent');
    }

    // reverse trail
    trail.reverse();

    // await trail sanitised
    trail = await Promise.all(trail.map(cat => cat.sanitise(true)));

    // get parents
    let cats = [category.get('_id').toString()];

    // push cats
    cats.push(...(await Category.find({
      'parents' : category.get('_id').toString()
    })).map((cat) => cat.get('_id').toString()));

    // set sort
    let sort      = 'priority';
    let page      = 1;
    let limit     = 24;
    let direction = -1;

    // check sort
    if ((req.query.sort || '').toLowerCase() === 'highest') {
      sort = 'pricing.price';
    } else if ((req.query.sort || '').toLowerCase() === 'lowest') {
      sort = 'pricing.price';
      direction = 1;
    }

    // check page
    if (req.query.page) {
      // set page
      page = parseInt(req.query.page) || 0;
    }

    // add content
    req.placement(category.get('slug') + '.banner');

    // get image
    let image = (await category.get('images') || [])[0];

    // set description
    req.title(category.get('title.' + req.language));
    req.description(category.get('short.' + req.language));

    // set image
    if (image) req.image(image.url('md-sq'));

    // set twitter
    req.twitter('card', 'summary_large_image');

    // render index page
    res.render('category', {
      'title'  : category.get('title.' + req.language),
      'trail'  : trail,
      'banner' : {
        'view'      : 'content',
        'placement' : category.get('slug') + '.banner'
      },
      'total' : await Product.where({
        'publish' : true
      }).in('categories.id', cats).count(),
      'parent'   : parent ? await parent.sanitise() : null,
      'category' : await category.sanitise(),
      'products' : await Promise.all((await Product.where({
        'publish' : true
      }).in('categories.id', cats).sort(sort, direction).skip(limit * (page - 1)).limit(limit).find()).map((product) => product.sanitise()))
    });
  }

  /**
   * load more action
   *
   * @param  {String}   id
   * @param  {Integer}  loaded
   * @param  {String}   sort
   *
   * @call   category.load
   * @return {Promise}
   */
  async loadMoreAction (id, loaded, sortBy) {
    // load category
    let category = await Category.findById(id);

    // get parents
    let cats = [category.get('_id').toString()];

    // push cats
    cats.push(...(await Category.find({
      'parents' : category.get('_id').toString()
    })).map((cat) => cat.get('_id').toString()));

    // set sort
    let sort      = 'priority';
    let limit     = 24;
    let direction = -1;

    // check sort
    if ((sortBy || '').toLowerCase() === 'highest') {
      sort = 'pricing.price';
    } else if ((sortBy || '').toLowerCase() === 'lowest') {
      sort = 'pricing.price';
      direction = 1;
    }

    // return
    return await Promise.all((await Product.where({
      'publish' : true
    }).in('categories.id', cats).sort(sort, direction).skip(loaded).limit(limit).find()).map((product) => product.sanitise()));
  }
}

/**
 * export Category controller
 *
 * @type {CategoryController}
 */
exports = module.exports = CategoryController;
