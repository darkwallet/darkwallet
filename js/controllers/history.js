/**
 * @fileOverview HistoryCtrl angular controller
 */

angular.module('DarkWallet.controllers').controller('HistoryCtrl', ['$scope', 'toaster', function($scope, toaster) {

  // History
  
  $scope.pocketName = "All Pockets";
  $scope.pocket = {index: undefined, name: 'All Pockets', mpk: undefined, addresses: $scope.allAddresses};
  $scope.isAll = true;
  $scope.selectPocket = function(pocket, pocketIndex) {
      if (pocket === undefined) {
          $scope.pocket.name = "All Pockets";
          $scope.pocket.index = undefined;
          $scope.pocket.mpk = undefined;
          $scope.pocket.stealth = undefined;
          $scope.pocket.addresses = $scope.allAddresses;
          $scope.isAll = true;
      } else {
          $scope.pocket.index = $scope.identity.wallet.pockets.indexOf(pocket);
          $scope.pocket.name = pocket;
          var walletAddress = $scope.identity.wallet.getAddress([$scope.pocket.index]);
          if (!walletAddress.mpk) {
              // derive mpk here for now so we can show as master address
	      var mpKey = Bitcoin.HDWallet.fromBase58($scope.identity.wallet.mpk);
              var childKey = mpKey.derive($scope.pocket.index);
              walletAddress.mpk = childKey.toBase58(false);
              $scope.identity.wallet.store.save();
          }
          $scope.pocket.mpk = walletAddress.mpk;
          $scope.pocket.stealth = walletAddress.stealth;
          $scope.pocket.addresses = $scope.addresses[$scope.pocket.index];
          $scope.isAll = false;
      }
      $scope.selectedPocket = pocketIndex;
      $scope.balance = $scope.identity.wallet.getBalance(pocket);
  }
  
  // Send

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

  // Pockets
  $scope.newPocketName = '';
  $scope.createPocket = function() {
      if ($scope.newPocketName) {
          $scope.identity.wallet.createPocket($scope.newPocketName);
          $scope.identity.wallet.createPocket($scope.newPocketName+'-change');
          $scope.selectPocket($scope.newPocketName, $scope.identity.wallet.pockets.length-2);
          $scope.newPocketName = '';
      }
  }


}]);
