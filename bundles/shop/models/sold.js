
// import local dependencies
const Model = require('model');

/**
 * create address class
 */
class Sold extends Model {
  /**
   * construct item model
   *
   * @param attrs
   * @param options
   */
  constructor(...args) {
    // run super
    super(...args);

    // bind methods
    this.sanitise = this.sanitise.bind(this);
  }

  /**
   * sanitises bot
   *
   * @return {Object}
   */
  async sanitise() {
    // return sanitised bot
    const sanitised = {
      id : this.get('_id') ? this.get('_id').toString() : null,
    };

    // hook
    await this.eden.hook('sold.sanitise', {
      sanitised,

      sold : this,
    });

    // return sanitised
    return sanitised;
  }
}

/**
 * export Sold class
 *
 * @type {Sold}
 */
module.exports = Sold;
