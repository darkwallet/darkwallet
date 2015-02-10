/**
 * @fileOverview Popup classes.
 */
'use strict';

/**
 * Controller for notifications
 * @param {Object} $scope Angular scope.
 * @constructor
 */
define(['frontend/controllers/module', 'darkwallet', 'frontend/port', 'require'], function (controllers, DarkWallet, Port, requirejs) {
  controllers.controller('NotificationsCtrl', ['$scope', '$window', 'modals', 'notify', '$brc', '_Filter', function($scope, $window, modals, notify, $brc, _) {

  $scope.tasks = [];
  $scope.modals = modals;

  var linkTasks = function() {
      var identity = DarkWallet.getIdentity();
      var sections = Object.keys(identity.tasks.tasks);
      var tasks = [];
      sections.forEach(function(section) {
          identity.tasks.tasks[section].forEach(function(task) {
              if (!task.seen) {
                  // TODO: to be removed:
                  if (task.progress === undefined) {
                      task.progress = 33;
                  }
                  var outPocket, inPocket;
                  if (!(task.outPocket === undefined)) {
                      var outType = (typeof task.outPocket === 'number') ? 'hd' : (task.outPocket.slice(0, 9) === 'readonly:') ? 'readonly' : 'multisig';
                      outPocket = identity.wallet.pockets.getPocket(task.outPocket, outType);
                  }
                  if (!(task.inPocket === undefined)) {
                      var inType = (typeof task.inPocket === 'number') ? 'hd' : (task.inPocket.slice(0, 9) === 'readonly:') ? 'readonly' : 'multisig';
                      inPocket = identity.wallet.pockets.getPocket(task.inPocket, inType);
                  }
                  var guiTask = {section: section, store: task, outPocket: outPocket, inPocket: inPocket};
                  if (section == 'multisig') {
                      // Get this here so we don't need Object in angular :-P
                      guiTask.nSigs = Object.keys(task.pending[0].signatures).length;
                      guiTask.fund = identity.wallet.multisig.search({address: task.address||task.inPocket});
                      if (!guiTask.fund) {
                          console.log("warning: fund not available for task ", guiTask);
                          return;
                      }
                      var canSign = identity.wallet.multisig.canSign(guiTask.fund);
                      // TODO: move setting the finished state to a better place
                      if (guiTask.nSigs >= guiTask.fund.m) {
                          task.state = 'finished';
                      }
                      canSign.some(function(myIdx) {
                          guiTask.canSign = true;
                          if (task.pending[0].signatures.hasOwnProperty(myIdx)) {
                              guiTask.signed = true;
                              return true;
                          }
                      });
                  }
                  tasks.push(guiTask);
              }
          });
      });
      $scope.tasks = tasks;
  }

  $scope.acceptFund = function(guiTask) {
      DarkWallet.service.multisigTrack.accept(guiTask.store);

      var fundIndex = DarkWallet.getIdentity().wallet.multisig.funds.indexOf(guiTask.store.fund);

      // Go to the fund page
      $window.open('index.html#wallet/fund/multisig/'+fundIndex);
  }

  /**
   * Continue signing after getting the password
   */
  function finishSignFundTx(password, guiTask) {
      requirejs(['dwutil/multisig'], function(MultisigFund) {
          var identity = DarkWallet.getIdentity();

          var fund = new MultisigFund(guiTask.fund);

          var fundTask = fund.findFundTask(guiTask.store);

          var inputs = fund.getValidInputs(fundTask.tx);

          var signed;
          try {
              signed = fund.signTransaction(password, fundTask, inputs);
          } catch (e) {
              notify.warning(_('Invalid Password'));
              return;
          }

          if (!signed) {
              notify.warning(_('Transaction was already signed by us'));
              return;
          }
          var tx = fund.finishTransaction(fundTask);
          if (tx) {
              $brc.broadcast(tx, fundTask);
              notify.success(_('Signed transaction and broadcasted transaction!'));
          } else {
              notify.success(_('Signed transaction'));
          }
          if (!$scope.$$phase) {
              $scope.$apply();
          }
      });
  };


  $scope.signTask = function(guiTask) {
      // import transaction here
      modals.password(_('Write your password'), function(password) {
          finishSignFundTx(password, guiTask);
      });
  }

  // Wallet service, connect to get notified about identity getting loaded.
  Port.connect('wallet', function(data) {
    if (data.type == 'ready') {
        // identity is ready here
        linkTasks();
        if(!$scope.$$phase) {
            $scope.$apply();
        }
    }
  });

}]);
});
