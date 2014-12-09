/**
 * @fileOverview FundCtrl angular controller
 */
'use strict';

define(['./module', 'darkwallet'],
function (controllers, DarkWallet) {

  controllers.controller('FundCtrl', ['$scope', 'modals', 'notify', '$brc', '$tabs', '_Filter', function($scope, modals, notify, $brc, $tabs, _) {

  $scope.jsObjectKeys = Object.keys;

  /**
   * Check if we have enough signatures and put them into the transaction
   */
  function finishSigning(fund, task) {
      var tx = fund.finishTransaction(task);
      if (tx) {
          $brc.broadcast(tx, task);
      }
      return tx;
  };

  /**
   * Import a signature
   */
  $scope.importFundSig = function(form, task) {

      var fund = $scope.pocket.fund;
      var added;
      try {
          added = fund.importSignature(form.text, task);
      } catch(e) {
          notify.error(_(e.message));
          return;
      }

      // Show some notification and finish task if we have all signatures.
      if (added) {
          if (finishSigning(fund, task)) {
              // Wait for notification from broadcasting
          } else {
              notify.success(_('Imported'), _('Signature imported'));
          }
      } else {
          notify.warning(_('Error importing'), _('Can\'t verify'));
      }
  };


  /**
   * Import a partial transaction into the fund
   */
  $scope.importFundTx = function(form) {
      if (!form.$valid) {
          return;
      }

      var fund = $scope.pocket.fund;
      var frontTask;

      try {
          frontTask = fund.importTransaction(form.newTx);
      } catch(e) {
          notify.error(_('Error importing'), _(e.message));
          return;
      }

      $tabs.updateTabs($scope.pocket.type, $scope.pocket.tasks);

      // Add to tasks
      notify.success(_('Added transaction'));
  };

  /**
   * Continue signing after getting the password
   */
  function finishSignFundTx(password, fund, task, inputs) {
      var identity = DarkWallet.getIdentity();

      var signed;
      try {
          signed = fund.signTransaction(password, task, inputs);
      } catch (e) {
          notify.warning(_('Invalid Password'));
          return;
      }

      if (!signed) {
          notify.warning(_('Transaction was already signed by us'));
          return;
      }
      if (finishSigning(fund, task)) {
          notify.success(_('Signed transaction and ready to go!'));
      } else {
          notify.success(_('Signed transaction'));
      }
  };

  /**
   * Sign a transaction with our keys
   */
  $scope.signFundTxForeign = function(foreignKey, task) {
      var fund = $scope.pocket.fund;
      var signed;
     
      try {
          signed = fund.signTxForeign(foreignKey, task);
      } catch (e) {
          notify.error(_('Error importing'), _(e.message));
      }

      if (!signed) {
          notify.warning(_('Could not sign with the given key'));
          return;
      }
      if (finishSigning(fund, task)) {
          notify.success(_('Signed transaction and ready to go!'));
      } else {
          notify.success(_('Signed transaction'));
      }
 
  }
 
  /**
   * Sign a transaction with our keys
   */
  $scope.signFundTx = function(task) {
      // import transaction here
      var fund = $scope.pocket.fund;

      var inputs = fund.getValidInputs(task.tx);

      if (inputs.length) {
          modals.password(_('Write your password'), function(password) { finishSignFundTx(password, fund, task, inputs); } );
      } else {
          notify.error(_('Error importing'), _('Transaction is not for this multisig'));
      }
  };

  var finishDelete = function(fund) {
      var identity = DarkWallet.getIdentity();
      identity.wallet.multisig.deleteFund(fund.multisig);
      $scope.selectPocket();
  };
  $scope.deleteFund = function(fund) {
      modals.open('confirm-delete', {name: fund.name, object: fund}, finishDelete);
  };

}]);
});
