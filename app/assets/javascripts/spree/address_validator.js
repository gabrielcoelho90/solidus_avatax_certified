var AddressValidator;

(function() {
  var lineHash = {
    address1: 'line1',
    address2: 'line2',
    city: 'city',
    zipcode: 'postalCode',
    country: 'country',
    state: 'region'
  };

  function pathFor(path) {
    if (typeof Solidus !== 'undefined' && Solidus.pathFor) return Solidus.pathFor(path);
    if (typeof Spree !== 'undefined' && Spree.pathFor) return Spree.pathFor(path);
    return '/' + path;
  }

  AddressValidator = class AddressValidator {
    validate() {
      var address = this.formatAddress();
      var params = new URLSearchParams();
      params.append('state', 'address');
      Object.entries(address).forEach(function(entry) {
        params.append('address[' + entry[0] + ']', entry[1] || '');
      });

      fetch(pathFor('checkout/validate_address') + '?' + params, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (data.responseCode === 'error') {
          this.showFlash(data);
          return;
        }
        var validatedAddress = data.validatedAddresses[0];
        var wrapper = this.addressWrapper();
        ['address1', 'address2', 'city', 'zipcode'].forEach(function(field) {
          var input = document.querySelector(wrapper + ' input[id*="' + field + '"]');
          if (input) input.value = validatedAddress[lineHash[field]] || '';
        });
        this.showFlash(data);
      }.bind(this));
    }

    formatAddress() {
      var address = {};
      var wrapper = this.addressWrapper();
      document.querySelectorAll(wrapper + ' input').forEach(function(input) {
        var id = input.id;
        var line = lineHash[id.split('_').pop()];
        if (line) address[line] = input.value;
      });
      document.querySelectorAll(wrapper + ' select').forEach(function(select) {
        var id = select.id;
        var line = lineHash[id.slice(0, -3).split('_').pop()];
        if (line) address[line] = select.value;
      });
      return address;
    }

    addressWrapper() {
      if (document.getElementById('business-address')) return '#business-address';
      var useBilling = document.getElementById('order_use_billing');
      if (useBilling && useBilling.checked) return '#billing';
      return '#shipping';
    }

    showFlash(data) {
      if (data.responseCode === 'error') {
        window.show_flash && window.show_flash('error', 'Address Validation Error: ' + data.errorMessages.join(', '));
      } else {
        window.show_flash && window.show_flash('success', 'Address Validation Successful');
      }
    }
  };

  document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.address_validator').forEach(function(el) {
      el.addEventListener('click', function(e) {
        e.preventDefault();
        new AddressValidator().validate();
      });
    });
  });
})();
