<money>
  <span>
    <span contenteditable={ opts.editable } onblur={ opts.onChange }>{ format() }</span> { opts.showCurrency ? opts.currency || this.settings.currency  || this.eden.get('shop.currency') : '' }
  </span>

  <script>
    // do mixin
    this.mixin('settings');

    /**
     * formats currency
     *
     * @return {String}
     */
    format () {
      // get currency
      let currency = require('currency-formatter');

      // get value
      let value = opts.convert !== false ? (parseFloat(opts.amount) * this.eden.get('shop.rates')[opts.currency || this.settings.currency || this.eden.get('shop.currency')]) : opts.amount;

      // check value
      if (this.settings.currency === 'JPY') {
        // round to nearest 10
        value = Math.ceil(value / 10) * 10;
      }

      // return formatted currency
      const formatted = currency.format(value, {
        'code' : opts.currency || this.settings.currency || this.eden.get('shop.currency')
      });

      // return short value
      if (opts.small) return formatted.split('.')[0];

      // return formatted
      return formatted;
    }
  </script>
</money>
