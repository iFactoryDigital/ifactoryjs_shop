
// Bind dependencies
const Grid        = require('grid');
const slug        = require('slug');
const alert       = require('alert');
const crypto      = require('crypto');
const Controller  = require('controller');
const escapeRegex = require('escape-string-regexp');

// Require models
const Image    = model('image');
const Block   = model('block');
const Product  = model('product');
const Category = model('category');

// Bind local dependencies
const config = require('config');

// Get helpers
const BlockHelper   = helper('cms/block');
const ProductHelper = helper('product');

/**
 * Build user admin controller
 *
 * @acl   admin.product.view
 * @fail  /
 * @mount /admin/product
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

    // Register simple block
    BlockHelper.block('dashboard.cms.products', {
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
   * Builds admin category
   */
  build() {
    // Build slug function
    const slugify = async (product) => {
      // Get title
      const title = Object.values(product.get('title'))[0];

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
    this.eden.pre('product.pricing', (data) => {
      // Check type
      if (data.type !== 'simple' && data.type !== 'variable') return;

      // Set pricing
      data.pricing.price = parseFloat(data.pricing.price);
    });

    // Pre pricing submit
    this.eden.pre('product.submit', (req, product) => {
      // Check type
      if (product.get('type') !== 'variable') return;

      // Set pricing
      product.set('variations', req.body.variation || []);
    });

    // Pre pricing submit
    this.eden.pre('product.availability', (data) => {
      // Check type
      if (data.type !== 'simple') return;

      // Set pricing
      data.availability.quantity = parseInt(data.availability.quantity, 10);
    });

    // Register product types
    ProductHelper.product('simple', {

    }, async (product, opts) => {
      // return price
      return {
        amount    : parseFloat(product.get('pricing.price')),
        currency  : config.get('shop.currency') || 'USD',
        available : product.get('availability.quantity') > 0,
      };
    }, async (product, line, req) => {

    }, async (product, line, order) => {

    });

    // Register variable product
    ProductHelper.product('variable', {

    }, async (product, opts) => {
      // set price
      let price = parseFloat(product.get('pricing.price'));

      // get variations
      const variations = await product.get('variations');

      // loop for variations
      for (const type in variations) {
        // check found option
        const found = variations[type].options.find(option => opts.includes(option.sku));

        // check found
        if (!found) {
          // throw error
          throw new Error('Variation missing options');
        }

        // add to price
        price += parseFloat(found.price);
      }

      // return price
      return {
        amount    : parseFloat(price),
        currency  : config.get('shop.currency') || 'USD',
        available : product.get('availability.quantity') > 0,
      };
    }, async (product, line, req) => {

    }, async (product, line, order) => {

    });
  }

  /**
   * Index action
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
  async indexAction(req, res) {
    // Render grid
    res.render('product/admin', {
      grid : await this._grid(req).render(req),
    });
  }

  /**
   * Add/edit action
   *
   * @param req
   * @param res
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
   * @param req
   * @param res
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

    // Render page
    res.render('product/admin/update', {
      title   : create ? 'Create Product' : `Update ${product.get('sku')}`,
      types   : ProductHelper.products().map(p => p.type),
      product : await product.sanitise(),
    });
  }

  /**
   * Create submit action
   *
   * @param req
   * @param res
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
   * @param req
   * @param res
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

    // Load images
    const images = req.body.images ? (await Promise.all((Array.isArray(req.body.images) ? req.body.images : [req.body.images]).map((id) => {
      // Load image
      return Image.findById(id);
    }))).filter((image) => {
      // Return image
      return image;
    }) : false;

    // Load categories
    const categories = req.body.categories ? (await Promise.all(req.body.categories.split(',').map((id) => {
      // Load image
      return id.length === 24 ? Category.findById(id) : null;
    }))).filter((category) => {
      // Return image
      return category;
    }) : false;

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
    product.set('title', req.body.title);
    product.set('short', req.body.short);
    product.set('images', images || product.get('images'));
    product.set('updator', req.user);
    product.set('pricing', pricing);
    product.set('shipping', shipping);
    product.set('priority', parseInt(req.body.priority) || 0);
    product.set('promoted', req.body.promoted === 'true');
    product.set('published', req.body.published === 'true');
    product.set('categories', categories || product.get('categories'));
    product.set('description', req.body.description);
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
    res.render('product/admin/update', {
      title   : create ? 'Create Product' : `Update ${product.get('sku')}`,
      types   : ProductHelper.types,
      product : await product.sanitise(),
    });
  }

  /**
   * Delete action
   *
   * @param req
   * @param res
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
   * @param req
   * @param res
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
   * @param req
   * @param res
   *
   * @route {post} /grid
   */
  gridAction(req, res) {
    // Return post grid request
    return this._grid(req).post(req, res);
  }

  /**
   * Renders grid
   *
   * @return {grid}
   */
  _grid(req) {
    // Create new grid
    const productGrid = new Grid(req);

    // Set route
    productGrid.route('/admin/product/grid');

    // Set grid model
    productGrid.model(Product);


    // Add grid columns
    productGrid.column('sku', {
      sort   : true,
      title  : 'SKU',
      format : async (col, row) => {
        return col || '<i>N/A</i>';
      },
    })
      .column('images', {
        sort   : false,
        title  : 'Image',
        format : async (col, row) => {
          // return calculated price
          return col && col.length ? `<a href="/admin/product/${row.get('_id').toString()}/update"><img src="${await col[0].url('sm-sq')}" class="img-fluid" style="width:80px;" /></a>` : '';
        },
      })
      .column('price', {
        sort : (query, dir) => {
          return query.sort('pricing.price', dir);
        },
        title  : 'Price',
        format : async (col, row) => {
          // return calculated price
          return `$${(await ProductHelper.price(row)).amount.toFixed(2)} ${config.get('shop.currency') || 'USD'}`;
        },
      })
      .column('title', {
        sort   : true,
        title  : 'Title',
        format : async (col, row) => {
          return (col || {})[req.language] || '<i>N/A</i>';
        },
      })
      .column('categories', {
        title  : 'Categories',
        format : async (col, row) => {
          return col && col.length ? col.map((category) => {
            return `<a href="?filter[category]=${category.get(`title.${req.language}`)}" class="btn btn-sm btn-primary mr-2">${category.get(`title.${req.language}`)}</a>`;
          }).join('') : '<i>N/A</i>';
        },
      })
      .column('quantity', {
        title  : 'Quantity',
        format : async (col, row) => {
          return row.get('availability') ? row.get('availability.quantity').toString() : '<i>N/A</i>';
        },
      })
      .column('sold', {
        title  : 'Sold',
        format : async (col, row) => {
          return col ? col.toString() : '<i>N/A</i>';
        },
      })
      .column('published', {
        sort   : true,
        title  : 'Published',
        format : async (col, row) => {
          return col ? '<span class="btn btn-sm btn-success">Yes</span>' : '<span class="btn btn-sm btn-danger">No</span>';
        },
      })
      .column('promoted', {
        sort   : true,
        title  : 'Promoted',
        format : async (col, row) => {
          return col ? '<span class="btn btn-sm btn-success">Yes</span>' : '<span class="btn btn-sm btn-danger">No</span>';
        },
      })
      .column('creator', {
        sort   : true,
        title  : 'Creator',
        format : async (col, row) => {
          return col ? col.get('username') : '<i>N/A</i>';
        },
      })
      .column('updated_at', {
        sort   : true,
        title  : 'Updated',
        format : async (col) => {
          return col.toLocaleDateString('en-GB', {
            day   : 'numeric',
            month : 'short',
            year  : 'numeric',
          });
        },
      })
      .column('created_at', {
        sort   : true,
        title  : 'Created',
        format : async (col) => {
          return col.toLocaleDateString('en-GB', {
            day   : 'numeric',
            month : 'short',
            year  : 'numeric',
          });
        },
      })
      .column('actions', {
        width  : '1%',
        title  : 'Actions',
        format : async (col, row) => {
          return [
            '<div class="btn-group btn-group-sm" role="group">',
            `<a href="/admin/product/${row.get('_id').toString()}/update" class="btn btn-primary"><i class="fa fa-pencil"></i></a>`,
            `<a href="/admin/product/${row.get('_id').toString()}/remove" class="btn btn-danger"><i class="fa fa-times"></i></a>`,
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
      .filter('title', {
        title : 'Title',
        type  : 'text',
        query : async (param) => {
          // Another where
          productGrid.match('title.en-us', new RegExp(escapeRegex(param.toString().toLowerCase()), 'i'));
        },
      })
      .filter('description', {
        title : 'Description',
        type  : 'text',
        query : async (param) => {
          // Another where
          productGrid.match('description.en-us', new RegExp(escapeRegex(param.toString().toLowerCase()), 'i'));
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

    // Set default sort order
    productGrid.sort('created_at', 1);

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
