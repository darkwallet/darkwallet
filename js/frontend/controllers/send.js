'use strict';

define(['./module', 'frontend/port', 'darkwallet', 'bitcoinjs-lib', 'util/btc'],
function (controllers, Port, DarkWallet, Bitcoin, BtcUtils) {
  var BigInteger = Bitcoin.BigInteger;
  controllers.controller('WalletSendCtrl', ['$scope', '$window', 'notify', 'modals', '$wallet', function($scope, $window, notify, modals, $wallet) {

  var sendForm = $scope.forms.send;

  var dustThreshold = 5600;
  $scope.quicksend = {};

  $scope.resetSendForm = function() {
      sendForm.sending = false;
      sendForm.title = '';
      $scope.sendEnabled = false;
      sendForm.recipients = {
          fields: [
              { address: '', amount: '' }
          ],
          field_proto: { address: '', amount: '' }
      };
      var identity = DarkWallet.getIdentity();
      $scope.selectedCurrency = identity.settings.currency;
      if ($scope.selectedCurrency == 'mBTC') {
          sendForm.fee = $scope.defaultFee*1000;
      } else {
          sendForm.fee = $scope.defaultFee;
      }
  };

  $scope.updateBtcFiat = function(field) {
      var tickerService = DarkWallet.service.ticker;
      var identity = DarkWallet.getIdentity();
      var currency = identity.settings.currency;
      var fiatCurrency = identity.settings.fiatCurrency;
      if (field.isFiatShown) {
          field.amount = tickerService.fiatToBtc(field.fiatAmount, currency, fiatCurrency);
      } else {
          field.fiatAmount = tickerService.btcToFiat(field.amount, currency, fiatCurrency);
      }
  };

  $scope.setPocket = function(pocket) {
      var identity = DarkWallet.getIdentity();
      if (pocket == 'any') {
          sendForm.sendPocketName = 'Any';
          // TODO: Any is only using default pocket right now.
          sendForm.pocketIndex = 0;
      } else if (typeof pocket == 'number') {
          sendForm.sendPocketName = identity.wallet.pockets.hdPockets[pocket].name;
          sendForm.pocketIndex = pocket;
      } else {
          var idx = parseInt(pocket.split(':')[1]);
          var fund = identity.wallet.multisig.funds[idx];
          sendForm.sendPocketName = fund.name;
          sendForm.pocketIndex = fund.address;
      }
  };

  var initialized, validAddresses;
  var initIdentity = function(identity) {
      if (!identity || initialized == identity.name) {
          return;
      }

      initialized = identity.name;
      validAddresses = [
          identity.wallet.versions.address,
          identity.wallet.versions.stealth.address,
          identity.wallet.versions.p2sh
      ]
 
      // Set the dust threshold
      dustThreshold = identity.wallet.wallet.dustThreshold;

      // Initialize the store and send form if it's the first time
      if (!sendForm) {
          $scope.forms.send = { mixing: true,
                        sending: false,
                        sendPocket: 0,
                        autoAddEnabled: false,
                        advanced: false };
          // Need to set the form here
          sendForm = $scope.forms.send;
          $scope.resetSendForm();
      }

      // init scope variables
      $scope.setPocket(sendForm.pocketIndex||0);
      if (!$scope.$$phase) {
          $scope.$apply();
      }
  };

  initIdentity(DarkWallet.getIdentity());

  // Identity ready
  Port.connectNg('wallet', $scope, function(data) {
    if (data.type == 'ready') {
        // Set the default fee
        var identity = DarkWallet.getIdentity();
        initIdentity(identity);
    }
  });

  var updateRadar = function(radar, task) {
      var progressBar = $window.document.getElementById('send-progress');
      var button = $window.document.getElementById('send-button');

      // Check if we're finished
      if (radar >= 0.75) {
          radar = 1;
          if (task.radar < 0.75) {
              if (button && button.classList.contains('working')) {
                  button.classList.remove('working');
              }
              notify.success('Transaction finished propagating');
              $scope.resetSendForm();
          }
      }

      // If task.radar is less than one keep updating
      if (task.radar < 1) {
          if (button && !button.classList.contains('working')) {
              button.classList.add('working');
          }

          task.radar = radar;
      }

      // Progress bar must be updated at the end
      if (progressBar) {
          progressBar.style.width = radar*100 + '%';
      }
  };

  var getSatoshis = function() {
      var satoshis;
      var identity = DarkWallet.getIdentity();
      var currency = identity.settings.currency;
      if (currency == 'mBTC') {
          satoshis = 100000;
      } else {
          satoshis = 100000000;
      }
      return satoshis;
  };

  var prepareRecipients = function() {
      var satoshis = getSatoshis();
      var recipients = [];
      var totalAmount = 0;
      
      if ($scope.quicksend.next) {
          sendForm.recipients.fields = [{
            address: $scope.quicksend.address,
            amount: $scope.quicksend.amount
          }];
      }
      
      sendForm.recipients.fields.forEach(function(recipient) {
          if (!recipient.amount || !recipient.address) {
              return;
          }
          if (!BtcUtils.validateAddress(recipient.address, validAddresses)) {
              return;
          }
          var amount = parseInt(BigInteger.valueOf(recipient.amount * satoshis).toString());
          totalAmount += amount;
          recipients.push({address: recipient.address, amount: amount});
      });
      return {amount: totalAmount, recipients: recipients};
  };

  $scope.validateSendForm = function() {
      var spend = prepareRecipients();
      if ((spend.recipients.length > 0) && (spend.amount > dustThreshold)) {
          $scope.sendEnabled = true;
      } else {
          $scope.sendEnabled = false;
      }
      if ($scope.sendEnabled) {
          $scope.autoAddField();
      }
  };

  $scope.finishSign = function(signTask, amountNote, password) {
      // callback waiting for radar feedback
      var isBroadcasted = false;
      var radarCache = {radar: 0};
      var onBroadcast = function(error, task) {
          console.log("broadcast feedback", error, task);
          if (error) {
              var errorMessage = error.message || ''+error;
              notify.error("Error broadcasting", errorMessage);
              sendForm.sending = false;
          } else if (task && task.type == 'signatures') {
              notify.note('Signatures pending', amountNote)
          } else if (task && task.type == 'radar') {
              updateRadar(task.radar || 0, radarCache);
              if (!isBroadcasted) {
                  notify.success('Transaction sent', amountNote);
                  isBroadcasted = true;
              }
          }
      };

      var walletService = DarkWallet.service.wallet;
      walletService.signTransaction(signTask.tx, signTask, password, onBroadcast);
  };


  $scope.sendBitcoins = function() {
      // get a free change address
      var changeAddress = $wallet.getChangeAddress(sendForm.pocketIndex);

      // prepare amounts
      var satoshis = getSatoshis();

      // Prepare recipients
      var spend = prepareRecipients();
      var recipients = spend.recipients;
      var totalAmount = spend.amount;

      if (!recipients.length) {
          notify.note('You need to fill in at least one recipient');
          return;
      }

      if (totalAmount < dustThreshold) {
          notify.note('Amount is below the dust threshold', totalAmount+'<'+dustThreshold);
          return;
      }

      sendForm.sending = true;
      var fee = parseInt(BigInteger.valueOf(sendForm.fee * satoshis).toString());

      // callback waiting for radar feedback
      var onSent = function(error, task) {
          console.log("send feedback", error, task);
          var amountNote = (fee + totalAmount) + ' satoshis';
          if (error) {
              var errorMessage = error.message || ''+error;
              notify.error("Transaction failed", errorMessage);
              sendForm.sending = false;
          } else if (task && task.type == 'sign') {
              // Need to sign so open modal
              modals.password('Unlock password', function(_password) {$scope.finishSign(task, amountNote, _password)});
          } else if (task && task.type == 'mixer') {
              notify.note('Sent to mixer ('+task.task.state+')', amountNote);
              $scope.resetSendForm();
          } else if (task) {
              notify.note('New task: ' + task.type, amountNote);
              $scope.resetSendForm();
          } else {
              notify.success('Transaction created', amountNote);
              $scope.resetSendForm();
          }
      };

      // prepare the transaction
      var walletService = DarkWallet.service.wallet;

      walletService.send(sendForm.pocketIndex,
                         recipients,
                         changeAddress,
                         fee,
                         sendForm.mixing,
                         onSent);
  };

  $scope.addAddress = function(data, vars) {
      vars.field.address = data;
      $scope.validateSendForm();
  };
  
  $scope.onQrModalOkSend = function(data, vars) {
      $scope.onQrModalOk(data, vars);
      $scope.validateSendForm();
  };

  $scope.addField = function() {
      // add the new option to the model
      sendForm.recipients.fields.push(sendForm.recipients.field_proto);
      // clear the option.
      sendForm.recipients.field_proto = { address: '', amount: '' };
  };
  
  $scope.autoAddField = function() {
      if (!sendForm.autoAddEnabled) {
          return;
      }
      var fields = sendForm.recipients.fields;
      var lastFields = fields[fields.length - 1];
      var field_keys = Object.keys(sendForm.recipients.field_proto);
      var empty;
      field_keys.forEach(function(key) {
          empty = empty || lastFields[key];
      });
      if (empty) {
          $scope.addField();
      }
  };
  
  $scope.toggleCoinJoin = function() {
      sendForm.mixing = !sendForm.mixing;
  };

  $scope.enableAutoAddFields = function() {
      $scope.addField();
      sendForm.autoAddEnabled = true;
  };
}]);
});
