
// require dependencies
const Helper = require('helper');

// require models
const Category = model('category');

/**
 * build category helper
 */
class CategoryHelper extends Helper {
  /**
   * construct category helper
   */
  constructor() {
    // run super
    super();

    // bind variables
    this.sanitised = [];
    this.categories = [];

    // bind methods
    this.list = this.list.bind(this);
    this.build = this.build.bind(this);

    // run build method
    this.build();
  }

  /**
   * builds category helper
   */
  build() {
    // build categories
    this.list();
  }

  /**
   * builds categories array
   */
  async list() {
    // get all categories with no parent
    this.categories = await Category.where({
      parent : null,
      active : true,
    }).find();

    // sanitise categories
    this.sanitised = await Promise.all(this.categories.map((category) => {
      // return sanitised
      return category.sanitise();
    }));
  }
}

/**
 * export new categoryHelper class
 *
 * @return {categoryHelper}
 */
module.exports = new CategoryHelper();
