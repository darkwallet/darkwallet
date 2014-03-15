angular.module('DarkWallet.controllers').controller('WalletSendCtrl', ['$scope', 'toaster', function($scope, toaster) {
  $scope.send = {recipient: '', amount: 0.2, fee: 0.00002};

  $scope.sendBitcoins = function() {
      // get a free change address
      var changeAddress = $scope.getChangeAddress();

      // prepare amounts
      var satoshis = 100000000;
      var amount = $scope.send.amount * satoshis;
      var fee = $scope.send.fee * satoshis;

      // prepare the transaction
      $scope.identity.wallet.sendBitcoins($scope.send.recipient,
                                          changeAddress,
                                          amount,
                                          fee,
                                          $scope.send.password);
      // this should actually be a starting note, but we don't have a finishing callback yet.
      // we can also use something to show radar progress
      toaster.pop('success', 'Bitcoins sent', 'Sent ' + (fee + amount) + ' satoshis');
      
  }

  $scope.repeatedFields = {
    fields: [
      { address: '', amount: '' }
    ],
    field_proto: { address: '', amount: '' }
  };

  $scope.addField = function() {
    // add the new option to the model
    $scope.repeatedFields.fields.push($scope.repeatedFields.field_proto);
    // clear the option.
    $scope.repeatedFields.field_proto = { address: '', amount: '' };
  }
}]);