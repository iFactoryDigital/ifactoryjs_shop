
// import local dependencies
const Model  = require('model');
const config = require('config');

// require helpers
const formHelper = helper('form');

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
    // return object
    const sanitised = {
      id         : this.get('_id') ? this.get('_id').toString() : null,
      created_at : this.get('created_at'),
      updated_at : this.get('updated_at'),
    };

    // get form
    const form = await formHelper.get('shop.category');

    // add other fields
    await Promise.all((form.get('_id') ? form.get('fields') : config.get('shop.category.fields').slice(0)).map(async (field, i) => {
      // set field name
      const fieldName = field.name || field.uuid;

      // set sanitised
      sanitised[fieldName] = await this.get(fieldName);
      sanitised[fieldName] = sanitised[fieldName] && sanitised[fieldName].sanitise ? await sanitised[fieldName].sanitise() : sanitised[fieldName];
      sanitised[fieldName] = Array.isArray(sanitised[fieldName]) ? await Promise.all(sanitised[fieldName].map((val) => {
        // return sanitised value
        if (val.sanitise) return val.sanitise();
      })) : sanitised[fieldName];
    }));

    // check if small
    if (!small) {
      // let children
      const children = this.get('_id') ? await Category.find({
        'parent.id' : this.get('_id').toString(),
      }) : [];

      // set children
      sanitised.children = children && children.length ? await Promise.all(children.map((child) => {
        // return sanitised child category
        return child.sanitise(small);
      })) : [];
    }

    // await hook
    await this.eden.hook('category.sanitise', {
      sanitised,
      category : this,
    });

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
