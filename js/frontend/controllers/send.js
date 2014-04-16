define(['./module', 'frontend/services', 'darkwallet', 'bitcoinjs-lib'],
function (controllers, Services, DarkWallet, Bitcoin) {
  'use strict';
  var BigInteger = Bitcoin.BigInteger;
  controllers.controller('WalletSendCtrl', ['$scope', 'notify', function($scope, notify) {
  $scope.send = {recipient: '', amount: 0.2, mixing: true};
  $scope.autoAddEnabled = false;
  $scope.sendPocket = 0;
  $scope.advanced = false;
  
  $scope.updateBtcFiat = function(field) {
    var tickerService = DarkWallet.service().getTickerService();
    var identity = DarkWallet.getIdentity();
    var currency = identity.settings.currency;
    var fiatCurrency = identity.settings.fiatCurrency;
    if (field.isFiatShown) {
      field.amount = tickerService.fiatToBtc(field.fiatAmount, currency, fiatCurrency);
    } else {
      field.fiatAmount = tickerService.btcToFiat(field.amount, currency, fiatCurrency);
    }
  }

  $scope.setPocket = function(pocket) {
      if (pocket == 'any') {
          $scope.sendPocketName = 'Any';
          // TODO: Any is only using default pocket right now.
          $scope.pocketIndex = 0;
      } else if (typeof pocket == 'number') {
          $scope.sendPocketName = $scope.identity.wallet.pockets.hdPockets[pocket].name;
          $scope.pocketIndex = pocket;
      } else {
          var idx = parseInt(pocket.split(':')[1])
          var fund = $scope.identity.wallet.multisig.funds[idx];
          $scope.sendPocketName = fund.name;
          $scope.pocketIndex = fund.address;
      }
  };

  var initIdentity = function(identity) {
      // init scope variables
      $scope.setPocket($scope.sendPocket);  
      $scope.selectedCurrency = identity.settings.currency;
      if ($scope.selectedCurrency == 'mBTC') {
          $scope.send.fee = $scope.defaultFee*1000;
      } else {
          $scope.send.fee = $scope.defaultFee;
      }
      if (!$scope.$$phase) {
          $scope.$apply();
      }
  }

  // Identity ready
  Services.connectNg('wallet', $scope, function(data) {
    if (data.type == 'ready') {
        // Set the default fee
        var identity = DarkWallet.getIdentity();
        initIdentity(identity);
    }
  })

  var updateRadar = function(radar) {
      var progressBar = document.getElementById('send-progress')
      var button = document.getElementById('send-button');

      if (!button.classList.contains('working')) {
          button.classList.add('working');
      }
      progressBar.style.width = radar*100 + '%';
  }

  $scope.finishSign = function(signTask, amountNote, password) {
    // callback waiting for radar feedback
    var isBroadcasted = false;
    var onBroadcast = function(error, task) {
        console.log("broadcast feedback", error, task)
        if (error) {
            var errorMessage = error.message || ''+error;
            notify.error("Error broadcasting", errorMessage);
        } else if (task && task.type == 'signatures') {
            notify.note('Signatures pending', amountNote)
        } else if (task && task.type == 'radar') {
            updateRadar(task.radar || 0)
            if (!isBroadcasted) {
                notify.success('Transaction sent', amountNote)
                isBroadcasted = true;
            } else {
            }
        }
    }

    var walletService = DarkWallet.service().getWalletService();
    walletService.signTransaction(signTask.tx, signTask, password, onBroadcast);
  }

  $scope.sendBitcoins = function() {
      // get a free change address
      var identity = DarkWallet.getIdentity();
      var changeAddress = $scope.getChangeAddress($scope.pocketIndex);

      // prepare amounts
      var satoshis;
      var currency = identity.settings.currency;
      if (currency == 'mBTC') {
          satoshis = 100000;
      } else {
          satoshis = 100000000;
      }
      // Prepare recipients
      var recipients = [];
      var totalAmount = 0;
      $scope.recipients.fields.forEach(function(recipient) {
          if (!recipient.amount || !recipient.address) {
              return;
          }
          var amount = parseInt(BigInteger.valueOf(recipient.amount * satoshis).toString());
          totalAmount += amount;
          recipients.push({address: recipient.address, amount: amount})
      });

      var fee = parseInt(BigInteger.valueOf($scope.send.fee * satoshis).toString());

      // callback waiting for radar feedback
      var isBroadcasted = false;
      var onSent = function(error, task) {
          console.log("send feedback", error, task)
          var amountNote = (fee + totalAmount) + ' satoshis';
          if (error) {
              var errorMessage = error.message || ''+error;
              notify.error("Transaction failed", errorMessage);
          } else if (task && task.type == 'sign') {
              // Need to sign so open modal
              $scope.openModal('ask-password', {text: 'Unlock password', password: ''}, function(_password) {$scope.finishSign(task, amountNote, _password)})
          } else if (task && task.type == 'mixer') {
              notify.note('Sent to mixer ('+task.task.state+')', amountNote)
          } else if (task) {
              notify.note('New task: ' + task.type, amountNote)
          } else {
              notify.success('Transaction created', amountNote);
          }
      }

      // prepare the transaction
      var walletService = DarkWallet.service().getWalletService();

      walletService.send($scope.pocketIndex,
                         recipients,
                         changeAddress,
                         fee,
                         $scope.send.mixing,
                         onSent);
  }

  $scope.recipients = {
    fields: [
      { address: '', amount: '' }
    ],
    field_proto: { address: '', amount: '' }
  };

  $scope.addAddress = function(data, vars) {
    vars.field.address = data;
    $scope.autoAddField();
  };
  
  $scope.onQrModalOkSend = function(data, vars) {
    $scope.onQrModalOk(data, vars);
    $scope.autoAddField();
  }

  $scope.addField = function() {
    // add the new option to the model
    $scope.recipients.fields.push($scope.recipients.field_proto);
    // clear the option.
    $scope.recipients.field_proto = { address: '', amount: '' };
  };
  
  $scope.autoAddField = function() {
    if (!$scope.autoAddEnabled) {
      return;
    }
    var fields = $scope.recipients.fields;
    var lastFields = fields[fields.length - 1];
    var field_keys = Object.keys($scope.recipients.field_proto);
    var empty;
    field_keys.forEach(function(key) {
      empty = empty || lastFields[key];
    });
    if (empty) {
      $scope.addField();
    }
  };
  
  $scope.toggleCoinJoin = function() {
    $scope.send.mixing = !$scope.send.mixing;
  }

  $scope.enableAutoAddFields = function() {
    $scope.addField();
    $scope.autoAddEnabled = true;
  };
}]);
});
