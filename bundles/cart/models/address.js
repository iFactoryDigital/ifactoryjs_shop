
// import local dependencies
const Model = require('model');

/**
 * create address class
 */
class Address extends Model {
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
      id        : this.get('_id') ? this.get('_id').toString() : null,
      name      : this.get('name'),
      formatted : this.get('formatted'),
    };

    // hook
    await this.eden.hook('address.sanitise', {
      sanitised,

      address : this,
    });

    // return sanitised
    return sanitised;
  }
}

/**
 * export Address class
 *
 * @type {Address}
 */
module.exports = Address;
