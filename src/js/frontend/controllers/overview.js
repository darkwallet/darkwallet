/**
 * @fileOverview OverviewCtrl angular controller
 */
'use strict';

define(['./module', 'darkwallet', 'frontend/port'], function (controllers, DarkWallet, Port) {
  controllers.controller('OverviewCtrl', ['$scope', '$history', '$location', function($scope, $history, $location) {

  $scope.hdPockets = [];
  $scope.multisigPockets = [];

  $scope.editing = false;

  $scope.toggleEdit = function(pocket) {
      var pocketId = pocket.type+pocket.index;
      if ($scope.editing == pocketId) {
          $scope.editing = false;
      } else {
          $scope.editing = pocketId;
      }
  }

  /**
   * Select a pocket from the grid
   */
  $scope.selectGridPocket = function(pocket) {
      if (pocket.type == 'pocket') {
          $location.path('/wallet/dashboard/'+pocket.index);
      } else if (pocket.type == 'fund') {
          $location.path('/wallet/dashboard/multisig/'+pocket.index);
      }
  };

  $scope.openLink = function(path) {
      $location.path('/'+path);
  };

  /**
   * Update a pocket's information in place
   */
  var updatePocket = function(newData, position, arr) {
      var found = arr.filter(function(pocket) {return (newData.type == pocket.type && newData.name == pocket.name)});
      if (found.length) {
          Object.keys(newData).forEach(function(key) {
              found[key] = newData[key];
          });
      } else if (position) {
          arr.splice(position, 0, newData);
      } else {
          arr.push(newData);
      }
  };

  /**
   * Calculate all balances
   */
  var calculateBalances = function() {
      var identity = DarkWallet.getIdentity();

      var total = {confirmed: 0, unconfirmed: 0, current: 0, hd: {confirmed: 0, unconfirmed: 0, current: 0, number: 0}, multisig: {confirmed: 0, unconfirmed: 0, current: 0, number: 0}};

      identity.wallet.pockets.hdPockets.forEach(function(pocket, i) {
          if (!pocket) {
              return;
          }
          var balance = identity.wallet.getBalance(i, 'hd');

          // Update total
          total.confirmed += balance.confirmed;
          total.current += balance.current;
          total.unconfirmed += balance.unconfirmed;
          total.hd.confirmed += balance.confirmed;
          total.hd.current += balance.current;
          total.hd.unconfirmed += balance.unconfirmed;
          total.hd.number += 1;

          // Save the pocket information
          updatePocket({name: pocket.name, mixing: pocket.mixing, balance: balance, type: 'pocket', index: i}, null, $scope.hdPockets);
      });
      identity.wallet.multisig.funds.forEach(function(fund, i) {
          if (!fund || !identity.wallet.pockets.getPocket(fund.address, 'multisig')) {
              return;
          }
          var balance = identity.wallet.getBalance(fund.address, 'multisig');

          // Update total
          total.current += balance.current;
          total.confirmed += balance.confirmed;
          total.unconfirmed += balance.unconfirmed;
          total.multisig.current += balance.current;
          total.multisig.confirmed += balance.confirmed;
          total.multisig.unconfirmed += balance.unconfirmed;
          total.multisig.number += 1;

          // Save the pocket information
          updatePocket({name: fund.name, mixing: fund.mixing, balance: balance, type: 'fund', fund: fund, index: i}, null, $scope.multisigPockets);
      });
      $scope.setOverview(total);
      // updatePocket({name: 'Total', balance: total, type: 'total'}, identity.wallet.pockets.hdPockets.length-1);
 
  };

  /**
   * Calculate everything if we have an identity loaded.
   */
  var loaded = DarkWallet.getIdentity();
  if (loaded) {
      loaded = loaded.name;
      calculateBalances();
  };

  /**
   * Listen to events
   */
  Port.connectNg('wallet', $scope, function(data) {
      if (data.type === 'ready' && data.identity !== loaded) {
          // Ready event, recalculate balances and cleanup pockets
          loaded = data.identity;
          $scope.hdPockets.splice(0, $scope.hdPockets.length);
          $scope.multisigPockets.splice(0, $scope.multisigPockets.length);
          calculateBalances();
      }
      else if (data.type === 'height') {
          // We may want to recalculate something on height
          $scope.currentHeight = data.value;
          calculateBalances();
      }
      else if (data.type === 'rename') {
          loaded = data.newName;
      }
  });

  Port.connectNg('gui', $scope, function(data) {
      if (data.type === 'balance') {
          // Balance event
          calculateBalances();
      }
  });


  }]);
});
