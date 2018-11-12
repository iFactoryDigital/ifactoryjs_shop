
// bind dependencies
const grid        = require('grid');
const slug        = require('slug');
const alert       = require('alert');
const crypto      = require('crypto');
const Controller  = require('controller');
const escapeRegex = require('escape-string-regexp');

// require models
const Image    = model('image');
const Product  = model('product');
const Category = model('category');

// bind local dependencies
const config = require('config');

// get helpers
const productHelper = helper('product');

/**
 * build user admin controller
 *
 * @acl   admin.product.view
 * @fail  /
 * @mount /admin/product
 */
class AdminProductController extends Controller {
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

    // build
    this.build();
  }

  /**
   * builds admin category
   */
  build () {
    // build slug function
    let slugify = async (product) => {
      // get title
      let title = product.get('title.' + (config.get('i18n.fallbackLng')));

      // slugify
      let slugifiedTitle = slug(title, {
        'lower' : true
      });

      // check slug
      let i = 0;

      // loop until slug available
      while (true) {
        // set slug
        let check = await Product.findOne({
          'slug' : (i ? slugifiedTitle + '-' + i : slugifiedTitle)
        });

        // check id
        if (check && product.get('_id') && product.get('_id').toString() !== check.get('_id').toString()) {
          // add to i
          i++;
        } else {
          // set new slug
          slugifiedTitle = (i ? slugifiedTitle + '-' + i : slugifiedTitle);

          // break if not found
          break;
        }
      }

      // set slug
      product.set('slug', slugifiedTitle);
    };

    // on render
    this.eden.pre('product.update', slugify);
    this.eden.pre('product.create', slugify);

    // on simple product sanitise
    this.eden.pre('product.sanitise', (data) => {
      // check product type
      if (data.product.get('type') !== 'simple' && data.product.get('type') !== 'variable') return;

      // set price
      data.sanitised.price      = parseFloat(data.product.get('pricing.price')) || 0.00;
      data.sanitised.available  = (parseInt(data.product.get('availability.quantity')) || 0) > 0;
      data.sanitised.variations = data.product.get('variations') || [];
    });

    // pre pricing submit
    this.eden.pre('product.pricing', (data) => {
      // check type
      if (data.type !== 'simple' && data.type !== 'variable') return;

      // set pricing
      data.pricing.price = parseFloat(data.pricing.price);
    });

    // pre pricing submit
    this.eden.pre ('product.submit', (req, product) => {
      // check type
      if (product.get ('type') !== 'variable') return;

      // set pricing
      product.set('variations', req.body.variation || []);
    });

    // pre pricing submit
    this.eden.pre('product.availability', (data) => {
      // check type
      if (data.type !== 'simple') return;

      // set pricing
      data.availability.quantity = parseInt(data.availability.quantity);
    });

    // register product types
    productHelper.register('simple');
    productHelper.register('variable');
  }

  /**
   * index action
   *
   * @param req
   * @param res
   *
   * @icon    fa fa-gift
   * @menu    {ADMIN} Products
   * @title   Product Administration
   * @route   {get} /
   * @layout  admin
   * @parent  /admin/shop
   */
  async indexAction (req, res) {
    // render grid
    res.render('product/admin', {
      'grid' : await this._grid(req).render(req)
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
    let create  = true;
    let product = new Product();

    // check for website model
    if (req.params.id) {
      // load by id
      create  = false;
      product = await Product.findById(req.params.id);
    }

    // render page
    res.render('product/admin/update', {
      'title'   : create ? 'Create Product' : 'Update ' + product.get('sku'),
      'types'   : productHelper.types,
      'product' : await product.sanitise()
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
    let create  = true;
    let product = new Product({
      'creator' : req.user
    });

    // check for website model
    if (req.params.id) {
      // load by id
      create  = false;
      product = await Product.findById(req.params.id);
    }

    // load images
    let images = req.body.images ? (await Promise.all((Array.isArray(req.body.images) ? req.body.images : [req.body.images]).map((id) => {
      // load image
      return Image.findById(id);
    }))).filter((image) => {
      // return image
      return image;
    }) : false;

    // load categories
    let categories = req.body.categories ? (await Promise.all(req.body.categories.split(',').map((id) => {
      // load image
      return id.length === 24 ? Category.findById(id) : null;
    }))).filter((category) => {
      // return image
      return category;
    }) : false;

    // load pricing
    let pricing = req.body.pricing;

    // set pricing
    await this.eden.hook('product.pricing', req.body.type || product.get('type'), pricing);

    // load availability
    let availability = req.body.availability;

    // set availability
    await this.eden.hook('product.availability', req.body.type || product.get('type'), availability);

    // load availability
    let shipping = req.body.shipping;

    // set availability
    await this.eden.hook('product.shipping', req.body.type || product.get('type'), shipping);

    // update product
    product.set('sku',          req.body.sku);
    product.set('type',         req.body.type);
    product.set('title',        req.body.title);
    product.set('short',        req.body.short);
    product.set('images',       images || product.get('images'));
    product.set('updator',      req.user);
    product.set('pricing',      pricing);
    product.set('shipping',     shipping);
    product.set('priority',     parseInt(req.body.priority) || 0);
    product.set('promoted',     req.body.promoted === 'true');
    product.set('published',    req.body.published === 'true');
    product.set('categories',   categories || product.get('categories'));
    product.set('description',  req.body.description);
    product.set('availability', availability);

    // run hook
    await this.eden.hook('product.submit', req, product, () => {});

    // run hook
    await this.eden.hook('product.compile', product, () => {
      // return save product
      return product.save();
    });

    // send alert
    req.alert('success', 'Successfully ' + (create ? 'Created' : 'Updated') + ' product!');

    // render page
    res.render('product/admin/update', {
      'title'   : create ? 'Create Product' : 'Update ' + product.get('sku'),
      'types'   : productHelper.types,
      'product' : await product.sanitise()
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
    let product = false;

    // check for website model
    if (req.params.id) {
      // load user
      product = await Product.findById(req.params.id);
    }

    // render page
    res.render('product/admin/remove', {
      'title'   : 'Remove ' + product.get('sku'),
      'product' : await product.sanitise()
    });
  }

  /**
   * delete action
   *
   * @param req
   * @param res
   *
   * @route   {post} /:id/remove
   * @title   product Administration
   * @layout  admin
   */
  async removeSubmitAction (req, res) {
    // set website variable
    let product = false;

    // check for website model
    if (req.params.id) {
      // load user
      product = await Product.findById(req.params.id);
    }

    // delete website
    await product.remove();

    // alert Removed
    req.alert('success', 'Successfully removed product');

    // render index
    return this.indexAction(req, res);
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
    let productGrid = new grid();

    // set route
    productGrid.route('/admin/product/grid');

    // set grid model
    productGrid.model(Product);

    // add grid columns
    productGrid.column('sku', {
      'sort'   : true,
      'title'  : 'SKU',
      'format' : async (col, row) => {
        return col || '<i>N/A</i>';
      }
    }).column('price', {
      'sort' : (query, dir) => {
        return query.sort('pricing.price', dir);
      },
      'title'  : 'Price',
      'format' : async (col, row) => {
        return '$' + parseFloat(row.get('pricing.price') || col || 0).toFixed(2) + ' USD';
      }
    }).column('title', {
      'sort'   : true,
      'title'  : 'Title',
      'format' : async (col, row) => {
        return (col || {})[req.language] || '<i>N/A</i>';
      }
    }).column('categories', {
      'title'  : 'Categories',
      'format' : async (col, row) => {
        return col && col.length ? col.map((category) => '<a href="?filter[category]=' + category.get('title.' + req.language) + '" class="btn btn-sm btn-primary mr-2">' + category.get('title.' + req.language) + '</a>').join('') : '<i>N/A</i>';
      }
    }).column('quantity', {
      'title'  : 'Quantity',
      'format' : async (col, row) => {
        return row.get('availability') ? row.get('availability.quantity').toString() : '<i>N/A</i>';
      }
    }).column('sold', {
      'title'  : 'Sold',
      'format' : async (col, row) => {
        return col ? col.toString() : '<i>N/A</i>';
      }
    }).column('published', {
      'sort'   : true,
      'title'  : 'Published',
      'format' : async (col, row) => {
        return col ? '<span class="btn btn-sm btn-success">Yes</span>' : '<span class="btn btn-sm btn-danger">No</span>';
      }
    }).column('promoted', {
      'sort'   : true,
      'title'  : 'Promoted',
      'format' : async (col, row) => {
        return col ? '<span class="btn btn-sm btn-success">Yes</span>' : '<span class="btn btn-sm btn-danger">No</span>';
      }
    }).column('creator', {
      'sort'   : true,
      'title'  : 'Creator',
      'format' : async (col, row) => {
        return col ? col.get('username') : '<i>N/A</i>';
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
      'width'  : '1%',
      'title'  : 'Actions',
      'format' : async (col, row) => {
        return [
          '<div class="btn-group btn-group-sm" role="group">',
            '<a href="/admin/product/' + row.get('_id').toString() + '/update" class="btn btn-primary"><i class="fa fa-pencil"></i></a>',
            '<a href="/admin/product/' + row.get('_id').toString() + '/remove" class="btn btn-danger"><i class="fa fa-times"></i></a>',
          '</div>'
        ].join('');
      }
    });

    // add grid filters
    productGrid.filter('sku', {
      'title' : 'SKU',
      'type'  : 'text',
      'query' : async (param) => {
        // another where
        productGrid.match('sku', new RegExp(escapeRegex(param.toString().toLowerCase()), 'i'));
      }
    }).filter('title', {
      'title' : 'Title',
      'type'  : 'text',
      'query' : async (param) => {
        // another where
        productGrid.match('title.en-us', new RegExp(escapeRegex(param.toString().toLowerCase()), 'i'));
      }
    }).filter('description', {
      'title' : 'Description',
      'type'  : 'text',
      'query' : async (param) => {
        // another where
        productGrid.match('description.en-us', new RegExp(escapeRegex(param.toString().toLowerCase()), 'i'));
      }
    }).filter('category', {
      'title' : 'Category',
      'type'  : 'text',
      'query' : async (param) => {
        // get categories
        let categories = await Category.match('title.en-us', new RegExp(escapeRegex(param.toString().toLowerCase()), 'i'));

        // another where
        productGrid.in('categories.id', categories.map((category) => category.get('_id').toString()));
      }
    }).filter('published', {
      'type'    : 'select',
      'title'   : 'Published',
      'options' : [
        {
          'name'  : 'Any',
          'value' : 'any'
        },
        {
          'name'  : 'Yes',
          'value' : 'yes'
        },
        {
          'name'  : 'No',
          'value' : 'no'
        }
      ],
      'query' : async (param) => {
        // check param
        if (param === 'any') return;

        // another where
        productGrid.where({
          'published' : param === 'yes'
        });
      }
    }).filter('promoted', {
      'type'    : 'select',
      'title'   : 'Promoted',
      'options' : [
        {
          'name'  : 'Any',
          'value' : 'any'
        },
        {
          'name'  : 'Yes',
          'value' : 'yes'
        },
        {
          'name'  : 'No',
          'value' : 'no'
        }
      ],
      'query' : async (param) => {
        // check param
        if (param === 'any') return;

        // another where
        productGrid.where({
          'promoted' : param === 'yes'
        });
      }
    });

    // set default sort order
    productGrid.sort('created_at', 1);

    // return grid
    return productGrid;
  }
}

/**
 * export admin controller
 *
 * @type {AdminProductController}
 */
exports = module.exports = AdminProductController;
