
// bind dependencies
const Grid        = require('grid');
const slug        = require('slug');
const config      = require('config');
const Controller  = require('controller');
const escapeRegex = require('escape-string-regexp');

// require models
const Block    = model('block');
const Category = model('category');

// bind helpers
const formHelper     = helper('form');
const modelHelper    = helper('model');
const blockHelper    = helper('cms/block');
const fieldHelper    = helper('form/field');
const categoryHelper = helper('category');

/**
 * build user admin controller
 *
 * @acl   admin.category.view
 * @fail  /
 * @mount /admin/shop/category
 */
class AdminCategoryController extends Controller {
  /**
   * construct user admin controller
   */
  constructor() {
    // run super
    super();

    // bind build methods
    this.build = this.build.bind(this);

    // bind methods
    this.gridAction = this.gridAction.bind(this);
    this.indexAction = this.indexAction.bind(this);
    this.createAction = this.createAction.bind(this);
    this.updateAction = this.updateAction.bind(this);
    this.removeAction = this.removeAction.bind(this);
    this.createSubmitAction = this.createSubmitAction.bind(this);
    this.updateSubmitAction = this.updateSubmitAction.bind(this);
    this.removeSubmitAction = this.removeSubmitAction.bind(this);

    // bind private methods
    this._grid = this._grid.bind(this);

    // build admin controller
    this.building = this.build();
  }

  /**
   * builds category admin controller
   */
  build() {
    //
    // PRIVATE FUNCTIONS
    //

    // build slug function
    const slugify = async (category) => {
      // get title
      const title = category.get(`title.${config.get('i18n.fallbackLng')}`);

      // slugify
      let slugifiedURL = slug(title, {
        lower : true,
      });

      // check slug
      let i = 0;

      // loop until slug available
      while (true) {
        // set slug
        const check = await Category.findOne({
          slug : (i ? `${slugifiedURL}-${i}` : slugifiedURL),
        });

        // check id
        if (check && (!category.get('_id') || category.get('_id').toString() !== check.get('_id').toString())) {
          // add to i
          i += 1;
        } else {
          // set new slug
          slugifiedURL = (i ? `${slugifiedURL}-${i}` : slugifiedURL);

          // break if not found
          break;
        }
      }

      // set slug
      category.set('slug', slugifiedURL);

      // set url
      let url    = [category.get('slug')];
      let parent = await category.get('parent');
      const parents = [];

      // set url
      while (parent && parent.get) {
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
      category.set('url', url);
      category.set('parents', parents);

      // return category
      return category;
    };

    //
    // HOOKS
    //

    // on render
    this.eden.pre('category.update', slugify);
    this.eden.pre('category.create', slugify);

    // pre category create/update
    this.eden.post('category.create', categoryHelper.list);
    this.eden.post('category.update', categoryHelper.list);

    //
    // REGISTER BLOCKS
    //

    // register simple block
    blockHelper.block('shop.category.categories', {
      acl         : ['admin.category'],
      for         : ['admin'],
      title       : 'Category Grid',
      description : 'Shop category grid',
    }, async (req, block) => {
      // get notes block from db
      const blockModel = await Block.findOne({
        uuid : block.uuid,
      }) || new Block({
        uuid : block.uuid,
        type : block.type,
      });

      // create new req
      const fauxReq = {
        user  : req.user,
        query : blockModel.get('state') || {},
      };

      // return
      return {
        tag   : 'grid',
        name  : 'Categories',
        grid  : await (await this._grid(req)).render(fauxReq),
        class : blockModel.get('class') || null,
        title : blockModel.get('title') || '',
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
      blockModel.set('state', req.body.data.state);
      blockModel.set('title', req.body.data.title);

      // save block
      await blockModel.save(req.user);
    });

    //
    // REGISTER FIELDS
    //

    // register simple field
    fieldHelper.field('shop.category', {
      for         : ['frontend', 'admin'],
      title       : 'Category',
      description : 'Category field',
    }, async (req, field, value) => {
      // set tag
      field.tag = 'category';
      field.value = value ? (Array.isArray(value) ? await Promise.all(value.map(item => item.sanitise())) : await value.sanitise()) : null;
      // return
      return field;
    }, async (req, field) => {
      // save field
    }, async (req, field, value, old) => {
      // set value
      try {
        // set value
        value = JSON.parse(value);
      } catch (e) {}

      // check value
      if (!Array.isArray(value)) value = [value];

      // return value map
      return await Promise.all((value || []).filter(val => val).map(async (val, i) => {
        // run try catch
        try {
          // buffer category
          const category = await Category.findById(val);

          // check category
          if (category) return category;

          // return null
          return null;
        } catch (e) {
          // return old
          return old[i];
        }
      }));
    });
  }

  /**
   * socket listen action
   *
   * @param  {String} id
   * @param  {Object} opts
   *
   * @call   model.listen.category
   * @return {Async}
   */
  async listenAction(id, uuid, opts) {
    // / return if no id
    if (!id) return;

    // join room
    opts.socket.join(`category.${id}`);

    // add to room
    return await modelHelper.listen(opts.sessionID, await Category.findById(id), uuid, true);
  }

  /**
   * socket listen action
   *
   * @param  {String} id
   * @param  {Object} opts
   *
   * @call   model.deafen.category
   * @return {Async}
   */
  async deafenAction(id, uuid, opts) {
    // / return if no id
    if (!id) return;

    // join room
    opts.socket.leave(`category.${id}`);

    // add to room
    return await modelHelper.deafen(opts.sessionID, await Category.findById(id), uuid, true);
  }

  /**
   * index action
   *
   * @param {Request}  req
   * @param {Response} res
   *
   * @icon    fa fa-filter
   * @menu    {ADMIN} Categories
   * @title   Category Administration
   * @route   {get} /
   * @parent  /admin/shop
   * @layout  admin
   */
  async indexAction(req, res) {
    // render grid
    res.render('category/admin', {
      grid : await (await this._grid(req)).render(req),
    });
  }

  /**
   * index action
   *
   * @param {Request}  req
   * @param {Response} res
   *
   * @acl   admin
   * @fail  next
   * @route {GET} /query
   */
  async queryAction(req, res) {
    // find children
    let categories = await Category;

    // set query
    if (req.query.q) {
      categories = categories.where({
        name : new RegExp(escapeRegex(req.query.q || ''), 'i'),
      });
    }

    // add roles
    categories = await categories.skip(((parseInt(req.query.page, 10) || 1) - 1) * 20).limit(20).sort('name', 1)
      .find();

    // get children
    res.json((await Promise.all(categories.map(category => category.sanitise()))).map((sanitised) => {
      // return object
      return {
        text  : sanitised.name,
        data  : sanitised,
        value : sanitised.id,
      };
    }));
  }

  /**
   * add/edit action
   *
   * @param {Request}  req
   * @param {Response} res
   *
   * @route    {get} /create
   * @layout   admin
   * @priority 12
   */
  createAction(req, res) {
    // return update action
    return this.updateAction(req, res);
  }

  /**
   * update action
   *
   * @param {Request}  req
   * @param {Response} res
   *
   * @route   {get} /:id/update
   * @layout  admin
   */
  async updateAction(req, res) {
    // set website variable
    let create   = true;
    let category = new Category();

    // check for website model
    if (req.params.id) {
      // load by id
      create = false;
      category = await Category.findById(req.params.id);
    }

    // get form
    const form = await formHelper.get('shop.category');

    // digest into form
    const sanitised = await formHelper.render(req, form, await Promise.all(form.get('fields').map(async (field) => {
      // return fields map
      return {
        uuid  : field.uuid,
        value : await category.get(field.name || field.uuid),
      };
    })));

    // get form
    if (!form.get('_id')) res.form('shop.category');

    // Render page
    res.render('category/admin/update', {
      item   : await category.sanitise(),
      form   : sanitised,
      title  : create ? 'Create category' : `Update ${category.get('_id').toString()}`,
      fields : config.get('shop.category.fields'),
    });
  }

  /**
   * create submit action
   *
   * @param {Request}  req
   * @param {Response} res
   *
   * @route   {post} /create
   * @layout  admin
   */
  createSubmitAction(req, res) {
    // return update action
    return this.updateSubmitAction(req, res);
  }

  /**
   * add/edit action
   *
   * @param {Request}  req
   * @param {Response} res
   * @param {Function} next
   *
   * @route   {post} /:id/update
   * @layout  admin
   */
  async updateSubmitAction(req, res, next) {
    // set website variable
    let create   = true;
    let category = new Category();

    // check for website model
    if (req.params.id) {
      // load by id
      create = false;
      category = await Category.findById(req.params.id);
    }

    // get form
    const form = await formHelper.get('shop.category');

    // digest into form
    const fields = await formHelper.submit(req, form, await Promise.all(form.get('fields').map(async (field) => {
      // return fields map
      return {
        uuid  : field.uuid,
        value : await category.get(field.name || field.uuid),
      };
    })));

    // loop fields
    for (const field of fields) {
      // set value
      category.set(field.name || field.uuid, field.value);
    }

    // Save category
    await category.save(req.user);

    // set id
    req.params.id = category.get('_id').toString();

    // return update action
    return this.updateAction(req, res, next);
  }

  /**
   * delete action
   *
   * @param {Request}  req
   * @param {Response} res
   *
   * @route   {get} /:id/remove
   * @layout  admin
   */
  async removeAction(req, res) {
    // set website variable
    let category = false;

    // check for website model
    if (req.params.id) {
      // load user
      category = await Category.findById(req.params.id);
    }

    // render page
    res.render('category/admin/remove', {
      title    : `Remove ${category.get('_id').toString()}`,
      category : await category.sanitise(),
    });
  }

  /**
   * delete action
   *
   * @param {Request}  req
   * @param {Response} res
   *
   * @route   {post} /:id/remove
   * @title   Category Administration
   * @layout  admin
   */
  async removeSubmitAction(req, res) {
    // set website variable
    let category = false;

    // check for website model
    if (req.params.id) {
      // load user
      category = await Category.findById(req.params.id);
    }

    // delete website
    await category.remove(req.user);

    // alert Removed
    req.alert('success', 'Successfully removed category');

    // render index
    res.redirect('/admin/shop/category');
  }

  /**
   * user grid action
   *
   * @param {Request}  req
   * @param {Response} res
   *
   * @route {get}  /grid
   * @route {post} /grid
   */
  async gridAction(req, res) {
    // return post grid request
    return (await this._grid(req)).post(req, res);
  }

  /**
   * renders grid
   *
   * @return {grid}
   */
  async _grid(req) {
    // Create new grid
    const categoryGrid = new Grid();

    // Set route
    categoryGrid.route('/admin/shop/category/grid');

    // get form
    const form = await formHelper.get('shop.category');

    // Set grid model
    categoryGrid.id('shop.category');
    categoryGrid.model(Category);
    categoryGrid.models(true);

    // Add grid columns
    categoryGrid.column('_id', {
      sort     : true,
      title    : 'Id',
      priority : 100,
    });

    // branch fields
    await Promise.all((form.get('_id') ? form.get('fields') : config.get('shop.category.fields').slice(0)).map(async (field, i) => {
      // set found
      const found = config.get('shop.category.fields').find(f => f.name === field.name);

      // add config field
      await formHelper.column(req, form, categoryGrid, field, {
        hidden   : !(found && found.grid),
        priority : 100 - i,
      });
    }));

    // add extra columns
    categoryGrid.column('updated_at', {
      tag      : 'grid-date',
      sort     : true,
      title    : 'Updated',
      priority : 4,
    }).column('created_at', {
      tag      : 'grid-date',
      sort     : true,
      title    : 'Created',
      priority : 3,
    }).column('actions', {
      tag      : 'category-actions',
      type     : false,
      width    : '1%',
      title    : 'Actions',
      priority : 1,
    });

    // branch filters
    config.get('shop.category.fields').slice(0).filter(field => field.grid).forEach((field) => {
      // add config field
      categoryGrid.filter(field.name, {
        type  : 'text',
        title : field.label,
        query : (param) => {
          // Another where
          categoryGrid.match(field.name, new RegExp(escapeRegex(param.toString().toLowerCase()), 'i'));
        },
      });
    });

    // Set default sort order
    categoryGrid.sort('created_at', 1);

    // Return grid
    return categoryGrid;
  }
}

/**
 * export admin controller
 *
 * @type {admin}
 */
exports = module.exports = AdminCategoryController;
