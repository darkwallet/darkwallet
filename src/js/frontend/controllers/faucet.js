'use strict';

define(['./module', 'darkwallet'], function (controllers, DarkWallet) {
  controllers.controller('FaucetCtrl', ['$scope', '$http', '$wallet', 'notify', '_Filter', function($scope, $http, $wallet, notify, _) {
    var identity = DarkWallet.getIdentity();

    var day = 60*60*24*1000;

    $scope.faucetRunning = {haskoin: false, helloblock: false};

    $scope.pokeHelloblockFaucet = function() {
        var walletAddress = $wallet.generateAddress();
        walletAddress.label = 'helloblock';
        $scope.faucetRunning.helloblock = true;
        $http({method: 'POST', url: "https://testnet.helloblock.io/v1/faucet/withdrawal", data: "toAddress="+walletAddress.address+"&value=1000000", headers:{'Content-Type': 'application/x-www-form-urlencoded'}})
           .success(function(data) {
               notify.success(_("Coins requested!"));
               $scope.faucetRunning.helloblock = false;
           })
           .error(function() {
               notify.warning(_("Error fetching coins"));
               $scope.faucetRunning.helloblock = false;
           });

    };

    $scope.pokeHaskoinFaucet = function() {
        $scope.faucetRunning.haskoin = true;
        if (identity.settings.faucetTimestamp && (identity.settings.faucetTimestamp > Date.now() - day)) {
            notify.warning(_("You can only use the haskoin faucet one time a day!"));
            return;
        }
        var walletAddress = $wallet.generateAddress();
        walletAddress.label = 'haskoin';
        $http({method: 'POST', url: "http://faucet.haskoin.com/", data: "address="+walletAddress.address, headers:{'Content-Type': 'application/x-www-form-urlencoded'}})
           .success(function(data) {
               identity.settings.faucetTimestamp = Date.now();
               identity.store.save();
               notify.success(_("Coins requested!"));
           })
           .error(function() {
               notify.warning(_("Error fetching coins"));
           });
    };

}]);

});
