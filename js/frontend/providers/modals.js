define(['./module'], function (providers) {
'use strict';

providers.factory('modals', ['$modal', 'notify', 'sounds', function($modal, notify, sounds) {

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
  openModal: function(tplName, vars, okCallback, cancelCallback) {

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
      setTimeout(function() {
        var element = document.querySelectorAll(".modal-" + tplName + " [autofocus]")[0];
        if (element) {
          element.focus();
        }
      }, 10);
    });

    modal.result.then(ok, cancel);
  },
  
  onQrModalOk: function(data, vars) {
    sounds.play('keygenEnd');
    if (Array.isArray(vars.field)) {
      vars.field.push({address: data});
    } else {
      vars.field.address = data;
    }
  },
  
  onQrModalCancel: function(data) {
    if (data && data.name === 'PermissionDeniedError') {
      notify.error('Your camera is disabled');
    }
  },
  
  registerScope: function(scope) {
    scope.openModal = modals.openModal;
    scope.onQrModalOk = modals.onQrModalOk;
    scope.onQrModalCancel = modals.onQrModalCancel;
  }
};
return modals;
}]);
});
