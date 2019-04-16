
// bind dependencies
const Controller = require('controller');

// require models
const Product  = model('product');
const Category = model('category');

// require helpers
const blockHelper    = helper('cms/block');
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
  constructor() {
    // run super
    super();

    // bind methods
    this.build = this.build.bind(this);
    this.indexAction = this.indexAction.bind(this);

    // run build method
    this.build();
  }

  /**
   * build category controller
   */
  async build() {
    // get categories
    (await Category.find({
      active : true,
    })).map((category) => {
      // add to eden
      this.eden.sitemap.add({
        url        : `/${category.get('slug')}`,
        priority   : 1,
        changefreq : 'daily',
      });
    });

    // register simple block
    blockHelper.block('frotend.categories', {
      for         : ['frontend'],
      title       : 'Categories List',
      description : 'Shows a list of published product categories',
    }, async (req, block) => {
      // get products
      const query = await Category.where({
        active : true,
      });

      // set data
      const data = {
        query,
        req
      };

      // hook
      await this.eden.hook('frontend.categories.query', data);

      // return
      return {
        tag        : 'categories',
        current    : req.category ? req.category.get('_id').toString() : null,
        categories : await Promise.all((await data.query.find()).map(product => product.sanitise())),
      };
    }, async (req, block) => { });
  }


  // ////////////////////////////////////////////////////////////////////////////
  //
  // HOOKS
  //
  // ////////////////////////////////////////////////////////////////////////////

  /**
   * on view render
   *
   * @param  {Object} render
   *
   * @pre    view.compile
   * @return {*}
   */
  viewHook(render) {
    // not required by json
    if (render.isJSON) return;

    // set categories
    render.categories = categoryHelper.sanitised;
  }


  // ////////////////////////////////////////////////////////////////////////////
  //
  // ACTIONS
  //
  // ////////////////////////////////////////////////////////////////////////////

  /**
   * index action
   *
   * @param req
   * @param res
   *
   * @title  Categories
   * @route  {get} /categories
   */
  async indexAction(req, res) {
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
  async slugAction(req, res, next) {
    // get category
    const category = await Category.findOne({
      slug : req.params.cat,
    });

    // check category
    if (!category) return next();

    // get parent
    let trail   = [category];
    let parent  = await category.get('parent');
        parent  = Array.isArray(parent) ? parent[0] : parent;
    let nextCat = parent;

    // while
    while (nextCat) {
      // set parent
      parent = nextCat;

      // push parent
      trail.push(parent);

      // set next
      nextCat = await parent.get('parent');
      nextCat = Array.isArray(nextCat) ? nextCat[0] : nextCat;
    }

    // reverse trail
    trail.reverse();

    // await trail sanitised
    trail = await Promise.all(trail.map(cat => cat.sanitise(true)));

    // category page
    req.placement('category.page');

    // render index page
    res.render('category', {
      trail,

      title    : category.get(`title.${req.language}`),
      category : await category.sanitise(),
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
  async loadMoreAction(id, loaded, sortBy) {
    // load category
    const category = await Category.findById(id);

    // get parents
    const cats = [category.get('_id').toString()];

    // push cats
    cats.push(...(await Category.find({
      parents : category.get('_id').toString(),
    })).map(cat => cat.get('_id').toString()));

    // set sort
    let sort      = 'priority';
    const limit     = 24;
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
      publish : true,
    }).in('categories.id', cats).sort(sort, direction).skip(loaded)
      .limit(limit)
      .find()).map(product => product.sanitise()));
  }
}

/**
 * export Category controller
 *
 * @type {CategoryController}
 */
exports = module.exports = CategoryController;
