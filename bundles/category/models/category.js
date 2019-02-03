
// import local dependencies
const Model = require('model');

/**
 * create address class
 */
class Category extends Model {
  /**
   * construct item model
   *
   * @param attrs
   * @param options
   */
  constructor() {
    // run super
    super(...arguments);

    // bind methods
    this.sanitise = this.sanitise.bind(this);
  }

  /**
   * sanitises bot
   *
   * @param {Boolean} small
   *
   * @return {Object}
   */
  async sanitise(small) {
    // set children
    const parent    = await this.get('parent');
    const children  = null;
    const sanitised = {
      id     : this.get('_id') ? this.get('_id').toString() : null,
      url    : this.get('url') || this.get('slug'),
      slug   : this.get('slug') || '',
      short  : this.get('short') || {},
      title  : this.get('title') || {},
      parent : parent ? parent.get('_id').toString() : false,
      images : await Promise.all((await this.get('images') || []).map((image) => {
        // return sanitised images
        return image.sanitise();
      })),
      promoted : !!this.get('promoted'),
    };

    // check if small
    if (!small) {
      // let children
      const children = this.get('_id') ? await Category.find({
        'parent.id' : this.get('_id').toString(),
      }) : [];

      // set children
      sanitised.active = this.get('active') || false;
      sanitised.children = children && children.length ? await Promise.all(children.map((child) => {
        // return sanitised child category
        return child.sanitise(small);
      })) : [];
      sanitised.description = this.get('description') || {};
    }

    // return sanitised
    return sanitised;
  }
}

/**
 * export category class
 *
 * @type {Category}
 */
exports = module.exports = Category;
