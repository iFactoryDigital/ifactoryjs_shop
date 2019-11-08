<invoice-actions>
  <div class="btn-group btn-group-sm" role="group">
    <a href="/admin/shop/invoice/{opts.row._id}/view" class="btn btn-info"><i class="fa fa-eye"></i></a>
    <a href="/admin/shop/invoice/{opts.row._id}/print" class="btn btn-info" target="_blank"><i class="fa fa-print"></i></a>
    <a class="btn btn-info" target="_blank" onclick={ onPdf }><i class="fa fa-file"></i></a>
    <a href="/admin/shop/invoice/{opts.row._id}/update" class="btn btn-primary"><i class="fa fa-pencil-alt"></i></a>
    <a href="/admin/shop/invoice/{opts.row._id}/remove" class="btn btn-danger"><i class="fa fa-times"></i></a>
  </div>

  <script>
  // do mixin
  this.mixin('config');
  this.mixin('loading');

  /**
   * on select product
   *
   * @param  {Event} e
   */
  async onPdf(e) {
    // prevent default
    e.preventDefault();
    e.stopPropagation();

    // loading product
    this.loading('pdf', true);
    // get product
    const result = (await eden.router.post(`/admin/shop/invoice/${opts.row._id}/pdf`, {

    }));

    if (result.success) {
      const url = `//${this.config.domain}${result.result.url}`;

      var a = document.createElement('a');
      a.setAttribute('href', url);
      a.setAttribute('download', `${opts.row._id}.pdf`);

      var aj = jQuery(a);
      aj.appendTo('body');
      aj[0].click();
      aj.remove();
    }

    // loading product
    this.loading('pdf', false);
  }
  </script>
</invoice-actions>
