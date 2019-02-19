// create config object
const config = {};

// set shop config
config.shop = {
  category : {
    fields : [
      {
        name  : 'title',
        i18n  : true,
        type  : 'text',
        grid  : true,
        label : 'Title',
      },
      {
        name     : 'images',
        type     : 'image',
        label    : 'Images',
        multiple : true,
      },
      {
        name  : 'slug',
        type  : 'text',
        grid  : true,
        label : 'Slug',
      },
      {
        name  : 'active',
        type  : 'boolean',
        label : 'Active',
      },
      {
        name  : 'promoted',
        type  : 'boolean',
        label : 'Promoted',
      },
      {
        type  : 'shop.category',
        name  : 'parent',
        label : 'Parent',
      },
      {
        name  : 'short',
        i18n  : true,
        type  : 'textarea',
        label : 'Short Description',
      },
      {
        name  : 'description',
        i18n  : true,
        type  : 'textarea',
        label : 'Long Description',
      },
    ],
  },
};

// export config
module.exports = config;
