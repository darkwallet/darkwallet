'use strict';

define(['./module', 'util/btc', 'darkwallet', 'dwutil/currencyformat'], function (providers, BtcUtils, DarkWallet, CurrencyFormat) {

providers.factory('modals', ['$modal', '$window', '$timeout', 'notify', 'sounds', function($modal, $window, $timeout, notify, sounds) {

var modals = {

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

    var ModalCtrl = function ($scope, $modalInstance, vars) {
      $scope.vars = vars;
      $scope.ok = function (value) {
        $modalInstance.close(value);
      };
      $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
      };
      $scope.onError = function(e) {
        $modalInstance.dismiss(e);
      };
    };

    var ok = function(data) {
      okCallback ? (vars ? okCallback(data, vars) : okCallback(data)) : null;
    };
    var cancel = function(reason) {
      cancelCallback ? (vars ? cancelCallback(reason, vars) : cancelCallback(reason)) : null;
    };

    var modal = $modal.open({
      templateUrl: 'modals/' + tplName + '.html',
      controller: ModalCtrl,
      windowClass: 'modal-' + tplName,
      resolve: {
        vars: function() {
          return vars;
        }
      }
    });

    // Fix autofocus in modals (broken because they have tabindex attribute set to -1)
    modal.opened.then(function() {
      $timeout(function() {
        var element = $window.document.querySelectorAll(".modal-" + tplName + " [autofocus]")[0];
        if (element) {
          element.focus();
        }
      }, 10);
    });

    modal.result.then(ok, cancel);
  },
  
  onQrOk: function(data, vars) {
    sounds.play('keygenEnd');
    var pars = BtcUtils.parseURI(data);
    if (pars === null) {
      notify.warning('URI not supported');
      return;
    }
    if (pars.amount && DarkWallet.getIdentity().settings.currency == 'mBTC') {
      pars.amount = CurrencyFormat.asSatoshis(pars.amount, 'BTC');
      pars.amount = CurrencyFormat.asBtc(pars.amount, 'mBTC').toString();
    }
    if (Array.isArray(vars.field)) {
      vars.field.push({address: pars.address, amount: pars.amount});
    } else {
      vars.field.address = pars.address;
      vars.field.amount = pars.amount !== undefined ? pars.amount : vars.field.amount;
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

  showQr: function(value, version) {
    var pars = {address: value};
    if (version) {
        pars.version = version;
    }
    modals.open('show-qr', pars);
  },

  password: function(text, callback) {
    modals.open('ask-password', {text: text, password: ''}, callback);
  }
};
return modals;
}]);
});
