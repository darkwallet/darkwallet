define(['./module', 'frontend/services', 'darkwallet', 'bitcoinjs-lib'],
function (controllers, Services, DarkWallet, Bitcoin) {
  'use strict';
  var BigInteger = Bitcoin.BigInteger;
  controllers.controller('WalletSendCtrl', ['$scope', 'toaster', function($scope, toaster) {
  $scope.send = {recipient: '', amount: 0.2};
  $scope.autoAddEnabled = false;

  var initIdentity = function(identity) {
      // init scope variables
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


  $scope.sendBitcoins = function() {
    
      $scope.openModal('ask-password', {text: 'Unlock password', password: ''}, $scope.finishSend)
  }
  $scope.finishSend = function(password) {
      // get a free change address
      var identity = DarkWallet.getIdentity();
      var changeAddress = $scope.getChangeAddress();

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

      var onSent = function(error) {
          // this should actually be a starting note, but we don't have a finishing callback yet.
          // we can also use something to show radar progress
          if (!error) {
              toaster.pop('success', 'Bitcoins sent', 'Sent ' + (fee + totalAmount) + ' satoshis');
          } else {
              toaster.pop('error', "Can't send", error.text);
              console.log("error", error);
          }
      }

      // prepare the transaction
      identity.wallet.sendBitcoins(recipients,
                                          changeAddress,
                                          fee,
                                          password,
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
  
  $scope.enableAutoAddFields = function() {
    $scope.addField();
    $scope.autoAddEnabled = true;
  };
}]);
});
