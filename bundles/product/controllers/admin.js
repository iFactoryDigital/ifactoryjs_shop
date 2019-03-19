
// Bind dependencies
const Grid        = require('grid');
const slug        = require('slug');
const Controller  = require('controller');
const escapeRegex = require('escape-string-regexp');

// Require models
const Sold     = model('sold');
const Image    = model('image');
const Block    = model('block');
const Product  = model('product');
const Category = model('category');

// Bind local dependencies
const config = require('config');

// Get helpers
const formHelper    = helper('form');
const blockHelper   = helper('cms/block');
const productHelper = helper('product');

/**
 * Build user admin controller
 *
 * @acl   admin.product.view
 * @fail  /
 * @mount /admin/shop/product
 */
class AdminProductController extends Controller {
  /**
   * Construct user admin controller
   */
  constructor() {
    // Run super
    super();

    // Bind build methods
    this.build = this.build.bind(this);

    // Bind methods
    this.gridAction = this.gridAction.bind(this);
    this.indexAction = this.indexAction.bind(this);
    this.createAction = this.createAction.bind(this);
    this.updateAction = this.updateAction.bind(this);
    this.removeAction = this.removeAction.bind(this);
    this.createSubmitAction = this.createSubmitAction.bind(this);
    this.updateSubmitAction = this.updateSubmitAction.bind(this);
    this.removeSubmitAction = this.removeSubmitAction.bind(this);

    // Bind private methods
    this._grid = this._grid.bind(this);

    // Build
    this.build();
  }

  /**
   * Builds admin category
   */
  build() {
    // Build slug function
    const slugify = async (product) => {
      // Get title
      const title = Object.values(product.get('title') || {})[0];

      // Slugify
      let slugifiedTitle = slug(title || '', {
        lower : true,
      });

      // Check slug
      let i = 0;

      // Loop until slug available
      while (true) {
        // Set slug
        const check = await Product.findOne({
          slug : (i ? `${slugifiedTitle}-${i}` : slugifiedTitle),
        });

        // Check id
        if (check && product.get('_id') && product.get('_id').toString() !== check.get('_id').toString()) {
          // Add to i
          i++;
        } else {
          // Set new slug
          slugifiedTitle = (i ? `${slugifiedTitle}-${i}` : slugifiedTitle);

          // Break if not found
          break;
        }
      }

      // Set slug
      product.set('slug', slugifiedTitle);
    };

    // On render
    this.eden.pre('product.update', slugify);
    this.eden.pre('product.create', slugify);

    // Pre pricing submit
    this.eden.pre('product.submit', (req, product) => {
      // Check type
      if (product.get('type') !== 'variable') return;

      // Set pricing
      product.set('variations', req.body.variation || []);
    });

    // Register simple block
    blockHelper.block('dashboard.cms.products', {
      acl         : ['admin.shop'],
      for         : ['admin'],
      title       : 'Products Grid',
      description : 'Shows grid of recent products',
    }, async (req, block) => {
      // Get notes block from db
      const blockModel = await Block.findOne({
        uuid : block.uuid,
      }) || new Block({
        uuid : block.uuid,
        type : block.type,
      });

      // Create new req
      const fauxReq = {
        user  : req.user,
        query : blockModel.get('state') || {},
      };

      // Return
      return {
        tag   : 'grid',
        name  : 'Products',
        grid  : await this._grid(req).render(fauxReq),
        class : blockModel.get('class') || null,
        title : blockModel.get('title') || '',
      };
    }, async (req, block) => {
      // Get notes block from db
      const blockModel = await Block.findOne({
        uuid : block.uuid,
      }) || new Block({
        uuid : block.uuid,
        type : block.type,
      });

      // Set data
      blockModel.set('class', req.body.data.class);
      blockModel.set('state', req.body.data.state);
      blockModel.set('title', req.body.data.title);

      // Save block
      await blockModel.save(req.user);
    });
  }

  /**
   * Index action
   *
   * @param {Request}  req
   * @param {Response} res
   *
   * @icon    fa fa-gift
   * @menu    {ADMIN} Products
   * @title   Product Administration
   * @route   {get} /
   * @layout  admin
   * @parent  /admin/shop
   */
  async indexAction(req, res) {
    // Render grid
    res.render('product/admin', {
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
    let products = Product;

    // set query
    if (req.query.q) {
      products = products.where({
        [`title.${req.language}`] : new RegExp(escapeRegex(req.query.q || ''), 'i'),
      });
    }

    // add roles
    products = await products.skip(((parseInt(req.query.page, 10) || 1) - 1) * 20).limit(20).sort('name', 1)
      .find();

    // get children
    res.json((await Promise.all(products.map(product => product.sanitise()))).map((sanitised) => {
      // return object
      return {
        text  : sanitised.title[req.language],
        data  : sanitised,
        value : sanitised.id,
      };
    }));
  }

  /**
   * Update action
   *
   * @param {Request}  req
   * @param {Response} res
   *
   * @route {get} /:id/get
   */
  async getAction(req, res) {
    // Set website variable
    let create  = true;
    let product = new Product();

    // Check for website model
    if (req.params.id) {
      // Load by id
      create = false;
      product = await Product.findById(req.params.id);
    }

    // return json
    return res.json({
      result  : await product.sanitise(),
      success : true,
    });
  }

  /**
   * Add/edit action
   *
   * @param {Request}  req
   * @param {Response} res
   *
   * @route    {get} /create
   * @layout   admin
   * @priority 12
   */
  createAction(req, res) {
    // Return update action
    return this.updateAction(req, res);
  }

  /**
   * Update action
   *
   * @param {Request}  req
   * @param {Response} res
   *
   * @route   {get} /:id/update
   * @layout  admin
   */
  async updateAction(req, res) {
    // Set website variable
    let create  = true;
    let product = new Product();

    // Check for website model
    if (req.params.id) {
      // Load by id
      create = false;
      product = await Product.findById(req.params.id);
    }

    // get form
    const form = await formHelper.get('shop.product');

    // digest into form
    const sanitisedForm = await formHelper.render(req, form, await Promise.all(form.get('fields').map(async (field) => {
      // return fields map
      return {
        uuid  : field.uuid,
        value : await product.get(field.name || field.uuid),
      };
    })));

    // Render page
    res.render('product/admin/update', {
      form  : sanitisedForm,
      title : create ? 'Create Product' : `Update ${product.get('sku')}`,
      types : await Promise.all(productHelper.products().map(async (p) => {
        // sanitised
        const sanitised = {
          type : p.type,
          opts : p.opts,
        };

        // await hook
        await this.eden.hook('product.admin.sanitise', sanitised);

        // return sanitised product
        return sanitised;
      })),
      fields  : config.get('shop.product.fields'),
      product : await product.sanitise(),
    });
  }

  /**
   * Create submit action
   *
   * @param {Request}  req
   * @param {Response} res
   *
   * @route   {post} /create
   * @layout  admin
   */
  createSubmitAction(req, res) {
    // Return update action
    return this.updateSubmitAction(req, res);
  }

  /**
   * Add/edit action
   *
   * @param {Request}  req
   * @param {Response} res
   *
   * @route   {post} /:id/update
   * @layout  admin
   */
  async updateSubmitAction(req, res) {
    // Set website variable
    let create  = true;
    let product = new Product({
      creator : req.user,
    });

    // Check for website model
    if (req.params.id) {
      // Load by id
      create = false;
      product = await Product.findById(req.params.id);
    }

    // get form
    const form = await formHelper.get('shop.product');

    // digest into form
    const fields = await formHelper.submit(req, form, await Promise.all(form.get('fields').map(async (field) => {
      // return fields map
      return {
        uuid  : field.uuid,
        value : await product.get(field.name || field.uuid),
      };
    })));

    // loop fields
    for (const field of fields) {
      // set value
      product.set(field.name || field.uuid, field.value);
    }

    // Load pricing
    const pricing = req.body.pricing;

    // Set pricing
    await this.eden.hook('product.pricing', req.body.type || product.get('type'), pricing);

    // Load availability
    const availability = req.body.availability;

    // Set availability
    await this.eden.hook('product.availability', req.body.type || product.get('type'), availability);

    // Load availability
    const shipping = req.body.shipping;

    // Set availability
    await this.eden.hook('product.shipping', req.body.type || product.get('type'), shipping);

    // Update product
    product.set('sku', req.body.sku);
    product.set('type', req.body.type);
    product.set('updator', req.user);
    product.set('pricing', pricing);
    product.set('shipping', shipping);
    product.set('promoted', req.body.promoted === 'true');
    product.set('published', req.body.published === 'true');
    product.set('availability', availability);

    // Run hook
    await this.eden.hook('product.submit', req, product, () => {});

    // Run hook
    await this.eden.hook('product.compile', product, () => {
      // Return save product
      return product.save(req.user);
    });

    // Send alert
    req.alert('success', `Successfully ${create ? 'Created' : 'Updated'} product!`);

    // Render page
    req.params.id = product.get('_id').toString();

    // return update action
    return this.updateAction(req, res);
  }

  /**
   * Delete action
   *
   * @param {Request}  req
   * @param {Response} res
   *
   * @route   {get} /:id/remove
   * @layout  admin
   */
  async removeAction(req, res) {
    // Set website variable
    let product = false;

    // Check for website model
    if (req.params.id) {
      // Load user
      product = await Product.findById(req.params.id);
    }

    // Render page
    res.render('product/admin/remove', {
      title   : `Remove ${product.get('sku')}`,
      product : await product.sanitise(),
    });
  }

  /**
   * Delete action
   *
   * @param {Request}  req
   * @param {Response} res
   *
   * @route   {post} /:id/remove
   * @title   product Administration
   * @layout  admin
   */
  async removeSubmitAction(req, res) {
    // Set website variable
    let product = false;

    // Check for website model
    if (req.params.id) {
      // Load user
      product = await Product.findById(req.params.id);
    }

    // Delete website
    await product.remove(req.user);

    // Alert Removed
    req.alert('success', 'Successfully removed product');

    // Render index
    return this.indexAction(req, res);
  }

  /**
   * User grid action
   *
   * @param {Request}  req
   * @param {Response} res
   *
   * @route {get}  /grid
   * @route {post} /grid
   */
  async gridAction(req, res) {
    // Return post grid request
    return (await this._grid(req)).post(req, res);
  }

  /**
   * Renders grid
   *
   * @return {grid}
   */
  async _grid(req) {
    // Create new grid
    const productGrid = new Grid();

    // Set route
    productGrid.route('/admin/shop/product/grid');

    // Set grid model
    productGrid.model(Product);

    // get form
    const form = await formHelper.get('shop.product');

    // Add grid columns
    productGrid.column('sku', {
      sort   : true,
      title  : 'SKU',
      format : async (col, row) => {
        return col || '<i>N/A</i>';
      },
    }).column('price', {
      sort : (query, dir) => {
        return query.sort('pricing.price', dir);
      },
      title  : 'Price',
      format : async (col, row) => {
        // return calculated price
        return `$${(await productHelper.price(row)).amount.toFixed(2)} ${config.get('shop.currency') || 'USD'}`;
      },
    });

    // branch fields
    await Promise.all((form.get('_id') ? form.get('fields') : config.get('shop.product.fields').slice(0)).map(async (field, i) => {
      // set found
      const found = config.get('shop.product.fields').find(f => f.name === field.name);

      // add config field
      await formHelper.column(req, form, productGrid, field, {
        hidden   : !(found && found.grid),
        priority : 100 - i,
      });
    }));

    productGrid.column('categories', {
      title  : 'Categories',
      format : async (col) => {
        return col && col.length ? col.map((category) => {
          return `<a href="?filter[category]=${category.get(`title.${req.language}`)}" class="btn btn-sm btn-primary mr-2">${category.get(`title.${req.language}`)}</a>`;
        }).join('') : '<i>N/A</i>';
      },
    }).column('sold', {
      title  : 'Sold',
      format : async (col, row) => {
        // return sold amount
        return (await Sold.where({
          'product.id' : row.get('_id').toString(),
        }).sum('qty')).toLocaleString();
      },
    })
      .column('published', {
        sort   : true,
        title  : 'Published',
        format : async (col) => {
          return col ? '<span class="btn btn-sm btn-success">Yes</span>' : '<span class="btn btn-sm btn-danger">No</span>';
        },
      })
      .column('promoted', {
        sort   : true,
        title  : 'Promoted',
        format : async (col) => {
          return col ? '<span class="btn btn-sm btn-success">Yes</span>' : '<span class="btn btn-sm btn-danger">No</span>';
        },
      })
      .column('creator', {
        sort   : true,
        title  : 'Creator',
        format : async (col) => {
          return col ? col.get('username') : '<i>N/A</i>';
        },
      })
      .column('updated_at', {
        tag   : 'grid-date',
        sort  : true,
        title : 'Updated'
      })
      .column('created_at', {
        tag   : 'grid-date',
        sort  : true,
        title : 'Created',
      })
      .column('actions', {
        width  : '1%',
        title  : 'Actions',
        export : false,
        format : async (col, row) => {
          return [
            '<div class="btn-group btn-group-sm" role="group">',
            `<a href="/admin/shop/product/${row.get('_id').toString()}/update" class="btn btn-primary"><i class="fa fa-pencil"></i></a>`,
            `<a href="/admin/shop/product/${row.get('_id').toString()}/remove" class="btn btn-danger"><i class="fa fa-times"></i></a>`,
            '</div>',
          ].join('');
        },
      });

    // Add grid filters
    productGrid.filter('sku', {
      title : 'SKU',
      type  : 'text',
      query : async (param) => {
        // Another where
        productGrid.match('sku', new RegExp(escapeRegex(param.toString().toLowerCase()), 'i'));
      },
    })
      .filter('category', {
        title : 'Category',
        type  : 'text',
        query : async (param) => {
          // Get categories
          const categories = await Category.match('title.en-us', new RegExp(escapeRegex(param.toString().toLowerCase()), 'i'));

          // Another where
          productGrid.in('categories.id', categories.map((category) => {
            return category.get('_id').toString();
          }));
        },
      })
      .filter('published', {
        type    : 'select',
        title   : 'Published',
        options : [
          {
            name  : 'Any',
            value : 'any',
          },
          {
            name  : 'Yes',
            value : 'yes',
          },
          {
            name  : 'No',
            value : 'no',
          },
        ],
        query : async (param) => {
        // Check param
          if (param === 'any') return;

          // Another where
          productGrid.where({
            published : param === 'yes',
          });
        },
      })
      .filter('promoted', {
        type    : 'select',
        title   : 'Promoted',
        options : [
          {
            name  : 'Any',
            value : 'any',
          },
          {
            name  : 'Yes',
            value : 'yes',
          },
          {
            name  : 'No',
            value : 'no',
          },
        ],
        query : async (param) => {
        // Check param
          if (param === 'any') return;

          // Another where
          productGrid.where({
            promoted : param === 'yes',
          });
        },
      });

    // branch filters
    config.get('shop.product.fields').slice(0).filter(field => field.grid).forEach((field) => {
      // add config field
      productGrid.filter(field.name, {
        type  : 'text',
        title : field.label,
        query : (param) => {
          // Another where
          productGrid.match(field.name, new RegExp(escapeRegex(param.toString().toLowerCase()), 'i'));
        },
      });
    });

    // Set default sort order
    productGrid.sort('created_at', -1);

    // Return grid
    return productGrid;
  }
}

/**
 * Export admin controller
 *
 * @type {AdminProductController}
 */
exports = module.exports = AdminProductController;
