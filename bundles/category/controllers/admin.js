
// bind dependencies
const Grid       = require('grid');
const slug       = require('slug');
const alert      = require('alert');
const config     = require('config');
const crypto     = require('crypto');
const Controller = require('controller');

// require models
const Image    = model('image');
const Category = model('category');

// require helpers
const categoryHelper = helper('category');

// add models
const Widget = model('widget');

// bind helpers
const DashboardHelper = helper('dashboard');

/**
 * build user admin controller
 *
 * @acl   admin.category.view
 * @fail  /
 * @mount /admin/category
 */
class AdminCategoryController extends Controller {
  /**
   * construct user admin controller
   */
  constructor () {
    // run super
    super();

    // bind build methods
    this.build = this.build.bind(this);

    // bind methods
    this.gridAction         = this.gridAction.bind(this);
    this.indexAction        = this.indexAction.bind(this);
    this.createAction       = this.createAction.bind(this);
    this.updateAction       = this.updateAction.bind(this);
    this.removeAction       = this.removeAction.bind(this);
    this.createSubmitAction = this.createSubmitAction.bind(this);
    this.updateSubmitAction = this.updateSubmitAction.bind(this);
    this.removeSubmitAction = this.removeSubmitAction.bind(this);

    // bind private methods
    this._grid = this._grid.bind(this);

    // build admin controller
    this.build();

    // register simple widget
    DashboardHelper.widget('dashboard.cms.categories', {
      'acl'         : ['admin.shop'],
      'title'       : 'Categories Grid',
      'description' : 'Shows grid of recent categories'
    }, async (req, widget) => {
      // get notes widget from db
      let widgetModel = await Widget.findOne({
        'uuid' : widget.uuid
      }) || new Widget({
        'uuid' : widget.uuid,
        'type' : widget.type
      });

      // create new req
      let fauxReq = {
        'query' : widgetModel.get('state') || {}
      };

      // return
      return {
        'tag'   : 'grid',
        'name'  : 'Categories',
        'grid'  : await this._grid(req).render(fauxReq),
        'title' : widgetModel.get('title') || ''
      };
    }, async (req, widget) => {
      // get notes widget from db
      let widgetModel = await Widget.findOne({
        'uuid' : widget.uuid
      }) || new Widget({
        'uuid' : widget.uuid,
        'type' : widget.type
      });

      // set data
      widgetModel.set('state', req.body.data.state);
      widgetModel.set('title', req.body.data.title);

      // save widget
      await widgetModel.save();
    });
  }

  /**
   * builds admin category
   */
  build () {
    // build slug function
    let slugify = async (category) => {
      // get title
      let title = category.get('title.' + (config.get('i18n.fallbackLng')));

      // slugify
      let slugifiedURL = slug(title, {
        'lower' : true
      });

      // check slug
      let i = 0;

      // loop until slug available
      while (true) {
        // set slug
        let check = await Category.findOne({
          'slug' : (i ? slugifiedURL + '-' + i : slugifiedURL)
        });

        // check id
        if (check && (!category.get('_id') || category.get('_id').toString() !== check.get('_id').toString())) {
          // add to i
          i++;
        } else {
          // set new slug
          slugifiedURL = (i ? slugifiedURL + '-' + i : slugifiedURL);

          // break if not found
          break;
        }
      }

      // set slug
      category.set('slug', slugifiedURL);

      // set url
      let url     = [category.get('slug')];
      let parent  = await category.get('parent');
      let parents = [];

      // set url
      while (parent) {
        // push to parents
        parents.push(parent.get('_id').toString());

        // set url
        url.push(parent.get('slug'));

        // set parent
        parent = await parent.get('parent');
      }

      // set url
      url.reverse();
      url = url.join('/');

      // set url
      category.set('url',     url);
      category.set('parents', parents);

      // return category
      return category;
    };

    // on render
    this.eden.pre('category.update', slugify);
    this.eden.pre('category.create', slugify);

    // pre category create/update
    this.eden.post('category.create', categoryHelper.list);
    this.eden.post('category.update', categoryHelper.list);
  }

  /**
   * index action
   *
   * @param req
   * @param res
   *
   * @icon    fa fa-filter
   * @menu    {ADMIN} Categories
   * @title   Category Administration
   * @route   {get} /
   * @parent  /admin/shop
   * @layout  admin
   */
  async indexAction (req, res) {
    // render grid
    res.render('category/admin', {
      'grid' : await this._grid(req).render()
    });
  }

  /**
   * add/edit action
   *
   * @param req
   * @param res
   *
   * @route    {get} /create
   * @layout   admin
   * @priority 12
   */
  createAction (req, res) {
    // return update action
    return this.updateAction(req, res);
  }

  /**
   * update action
   *
   * @param req
   * @param res
   *
   * @route   {get} /:id/update
   * @layout  admin
   */
  async updateAction (req, res) {
    // set website variable
    let create   = true;
    let category = new Category();

    // check for website model
    if (req.params.id) {
      // load by id
      create   = false;
      category = await Category.findById(req.params.id);
    }

    // render page
    res.render('category/admin/update', {
      'title'    : create ? 'Create category' : 'Update ' + category.get('_id').toString(),
      'category' : await category.sanitise()
    });
  }

  /**
   * create submit action
   *
   * @param req
   * @param res
   *
   * @route   {post} /create
   * @layout  admin
   */
  createSubmitAction (req, res) {
    // return update action
    return this.updateSubmitAction(req, res);
  }

  /**
   * add/edit action
   *
   * @param req
   * @param res
   *
   * @route   {post} /:id/update
   * @layout  admin
   */
  async updateSubmitAction (req, res) {
    // set website variable
    let create   = true;
    let category = new Category();

    // check for website model
    if (req.params.id) {
      // load by id
      create   = false;
      category = await Category.findById(req.params.id);
    }

    // load images
    let images = req.body.images ? (await Promise.all((Array.isArray(req.body.images) ? req.body.images : [req.body.images]).map((id) => {
      // load image
      return Image.findById(id);
    }))).filter((image) => {
      // return image
      return image;
    }) : false;

    // get parent
    let parent = null;

    // check parent
    if (req.body.parent && req.body.parent !== (category.get('_id') || '').toString() && req.body.parent.length === 24) {
      // set parent
      parent = await category.findById(req.body.parent);
    }

    // update category
    category.set('meta',        req.body.meta);
    category.set('title',       req.body.title);
    category.set('short',       req.body.short);
    category.set('parent',      parent || null);
    category.set('images',      images || await category.get('images'));
    category.set('active',      req.body.active === 'true');
    category.set('promoted',    req.body.promoted === 'true');
    category.set('description', req.body.description);

    // save category
    await category.save();

    // send alert
    req.alert('success', 'Successfully ' + (create ? 'Created' : 'Updated') + ' category!');

    // render page
    res.render('category/admin/update', {
      'title'    : create ? 'Create category' : 'Update ' + category.get('_id').toString(),
      'category' : await category.sanitise()
    });
  }

  /**
   * delete action
   *
   * @param req
   * @param res
   *
   * @route   {get} /:id/remove
   * @layout  admin
   */
  async removeAction (req, res) {
    // set website variable
    let category = false;

    // check for website model
    if (req.params.id) {
      // load user
      category = await Category.findById(req.params.id);
    }

    // render page
    res.render('category/admin/remove', {
      'title'    : 'Remove ' + category.get('_id').toString(),
      'category' : await category.sanitise()
    });
  }

  /**
   * delete action
   *
   * @param req
   * @param res
   *
   * @route   {post} /:id/remove
   * @title   Category Administration
   * @layout  admin
   */
  async removeSubmitAction (req, res) {
    // set website variable
    let category = false;

    // check for website model
    if (req.params.id) {
      // load user
      category = await Category.findById(req.params.id);
    }

    // delete website
    await category.remove();

    // alert Removed
    req.alert('success', 'Successfully removed category');

    // render index
    res.redirect('/admin/category');
  }

  /**
   * user grid action
   *
   * @param req
   * @param res
   *
   * @route {post} /grid
   */
  gridAction (req, res) {
    // return post grid request
    return this._grid(req).post(req, res);
  }

  /**
   * renders grid
   *
   * @return {grid}
   */
  _grid (req) {
    // create new grid
    let categoryGrid = new Grid();

    // set route
    categoryGrid.route('/admin/category/grid');

    // set grid model
    categoryGrid.model(Category);

    // add grid columns
    categoryGrid.column('_id', {
      'title'  : 'ID',
      'format' : async (col) => {
        return col ? col.toString() : 'N/A';
      }
    }).column('title', {
      'sort'   : true,
      'title'  : 'Title',
      'format' : async (col, row) => {
        return (col || {})[req.language] || 'N/A';
      }
    }).column('updated_at', {
      'sort'   : true,
      'title'  : 'Updated',
      'format' : async (col) => {
        return col.toLocaleDateString('en-GB', {
          'day'   : 'numeric',
          'month' : 'short',
          'year'  : 'numeric'
        });
      }
    }).column('created_at', {
      'sort'   : true,
      'title'  : 'Created',
      'format' : async (col) => {
        return col.toLocaleDateString('en-GB', {
          'day'   : 'numeric',
          'month' : 'short',
          'year'  : 'numeric'
        });
      }
    }).column('actions', {
      'type'   : false,
      'title'  : 'Actions',
      'format' : async (col, row) => {
        return [
          '<div class="btn-group btn-group-sm" role="group">',
            '<a href="/admin/category/' + row.get('_id').toString() + '/update" class="btn btn-primary"><i class="fa fa-pencil"></i></a>',
            '<a href="/admin/category/' + row.get('_id').toString() + '/remove" class="btn btn-danger"><i class="fa fa-times"></i></a>',
          '</div>'
        ].join('');
      }
    });

    // add grid filters
    categoryGrid.filter('title', {
      'title' : 'Title',
      'type'  : 'text',
      'query' : async (param) => {
        // another where
        categoryGrid.match('title.' + req.language, new RegExp(param.toString().toLowerCase(), 'i'));
      }
    });

    // set default sort order
    categoryGrid.sort('created_at', 1);

    // return grid
    return categoryGrid;
  }
}

/**
 * export admin controller
 *
 * @type {admin}
 */
exports = module.exports = AdminCategoryController;
