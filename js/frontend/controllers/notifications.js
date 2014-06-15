/**
 * @fileOverview Popup classes.
 */
'use strict';

/**
 * Controller for notifications
 * @param {Object} $scope Angular scope.
 * @constructor
 */
define(['frontend/controllers/module', 'darkwallet', 'frontend/port', 'require'], function (controllers, DarkWallet, Port, require) {
  controllers.controller('NotificationsCtrl', ['$scope', '$window', 'modals', 'notify', '$brc', function($scope, $window, modals, notify, $brc) {

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
                      outPocket = identity.wallet.getPocket(task.outPocket);
                  }
                  if (!(task.inPocket === undefined)) {
                      inPocket = identity.wallet.getPocket(task.inPocket);
                  }
                  var guiTask = {section: section, store: task, outPocket: outPocket, inPocket: inPocket};
                  if (section == 'multisig') {
                      // Get this here so we don't need Object in angular :-P
                      guiTask.nSigs = Object.keys(task.pending[0].signatures).length;
                      guiTask.fund = identity.wallet.multisig.search({address: task.address||task.inPocket});
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

      // Should now go to the fund page
      $window.open('index.html#wallet');
  }

  /**
   * Continue signing after getting the password
   */
  function finishSignFundTx(password, guiTask) {
      require(['dwutil/multisig'], function(MultisigFund) {
          var identity = DarkWallet.getIdentity();

          var fund = new MultisigFund(guiTask.fund);

          var fundTask = fund.getFundTask(guiTask.store);

          var inputs = fund.getValidInputs(fundTask.tx);

          var signed;
          try {
              signed = fund.signTransaction(password, fundTask, inputs);
          } catch (e) {
              notify.warning("Invalid Password");
              return;
          }

          if (!signed) {
              notify.warning("Transaction was already signed by us");
              return;
          }
          var tx = fund.finishTransaction(fundTask);
          if (tx) {
              $brc.broadcast(tx, fundTask);
              notify.success('Signed transaction and broadcasted transaction!');
          } else {
              notify.success('Signed transaction');
          }
          if (!$scope.$$phase) {
              $scope.$apply();
          }
      });
  };


  $scope.signTask = function(guiTask) {
      // import transaction here
      modals.password('Unlock password', function(password) {
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
