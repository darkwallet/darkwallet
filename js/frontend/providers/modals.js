'use strict';

define(['./module', 'util/btc', 'darkwallet', 'dwutil/currencyformat'], function (providers, BtcUtils, DarkWallet, CurrencyFormat) {

providers.factory('modals', ['$window', 'notify', 'sounds', '$templateCache', '$http', '$timeout', function($window, notify, sounds, $templateCache, $http, $timeout) {

var modals = {

  page: false,
  /**
   * Opens a modal
   *
   * @param {string} tplName Name of the template to be loaded
   * @param {object} vars Key-value pairs object that passes parameters from main
   * scope to the modal one. You can get the variables in the modal accessing to
   * `$scope.vars` variable.
   * @param {function} okCallback Function called when clicked on Ok button. The
   * first parameter is the data returned by the modal and the second one the vars
   * parameter passed to this function.
   * @param {function} cancelCallback Function called when modal is cancelled. The
   * first parameter is the reason because the modal has been cancelled and the
   * second one the vars parameter passed to this function.
   */
  open: function(tplName, vars, okCallback, cancelCallback) {
    var tplUrl = 'modals/'+tplName+'.html';
    var finish = function() {
        modals.page = tplUrl;
        modals.vars = vars;
        modals.okCallback = okCallback;
        modals.cancelCallback = cancelCallback;
        modals.show = true;
    }
    if ($templateCache.get(tplUrl)) {
        finish();
    } else {
        $http.get(tplUrl, {cache:$templateCache}).success(function() {finish();});
    }
  },

  focus: function(id) {
    $timeout(function() {
        var elmt = document.getElementById(id);
        elmt.focus();
    });
  },

  onQrOk: function(data, vars) {
    sounds.play('keygenEnd');
    var pars = BtcUtils.parseURI(data);
    if (!pars || !pars.address) {
      notify.warning('URI not supported');
      return;
    }
    if (pars.amount !== undefined && DarkWallet.getIdentity().settings.currency == 'mBTC') {
      pars.amount = CurrencyFormat.asSatoshis(pars.amount, 'BTC');
      pars.amount = CurrencyFormat.asBtc(pars.amount, 'mBTC').toString();
    } else if (pars.amount !== undefined && DarkWallet.getIdentity().settings.currency == 'bits') {
      pars.amount = CurrencyFormat.asSatoshis(pars.amount, 'BTC');
      pars.amount = CurrencyFormat.asBtc(pars.amount, 'bits').toString();
    }
    if (Array.isArray(vars.field)) {
      vars.field.push({address: pars.address, amount: pars.amount});
    } else {
      vars.field.address = pars.address;
      if (pars.amount !== undefined) {
        vars.field.amount = pars.amount;
      }
    }
  },

  onQrCancel: function(data) {
    if (data && data.name === 'PermissionDeniedError') {
      notify.error('Your camera is disabled');
    }
  },

  scanQr: function(value, callback) {
    var cb = function(data, vars) {
      modals.onQrOk(data, vars);
      if (callback) callback();
    };
    modals.open('scan-qr', {field: value}, cb, modals.onQrCancel);
  },

  showQr: function(value) {
    if (typeof value !== "object" || value === null) {
      value = {value: value};
    }
    modals.open('show-qr', value);
  },

  showBtcQr: function(value) {
    if (typeof value !== "object" || value === null) {
      value = {value: value};
    }
    value.btc = true;
    modals.showQr(value, value);
  },

  password: function(text, callback) {
    modals.open('ask-password', {text: text, password: ''}, callback);
  },

  confirmSend: function(text, spend, recipients, callback) {
    modals.open('confirm-send', {text: text, spend: spend, recipients: recipients, password: ''}, callback);
  }
};
return modals;
}]);
});
