/**
 * @fileOverview OverviewCtrl angular controller
 */
'use strict';

define(['./module', 'darkwallet', 'frontend/port'], function (controllers, DarkWallet, Port) {
  controllers.controller('OverviewCtrl', ['$scope', '$history', function($scope, $history) {

  $scope.allPockets = [];

  /**
   * Select a pocket from the grid
   */
  $scope.selectGridPocket = function(pocket) {
      if (pocket.type == 'pocket') {
          $scope.selectPocket(pocket.name, pocket.index);
      } else if (pocket.type == 'fund') {
          $scope.selectFund(pocket.fund, pocket.index);
      }
  };

  /**
   * Update a pocket's information in place
   */
  var updatePocket = function(newData, position) {
      var found = $scope.allPockets.filter(function(pocket) {return (newData.type == pocket.type && newData.name == pocket.name)});
      if (found.length) {
          Object.keys(newData).forEach(function(key) {
              found[key] = newData[key];
          });
      } else if (position) {
          $scope.allPockets.splice(position, 0, newData);
      } else {
          $scope.allPockets.push(newData);
      }
  };

  /**
   * Calculate all balances
   */
  var calculateBalances = function() {
      var identity = DarkWallet.getIdentity();

      var total = {confirmed: 0, unconfirmed: 0, current: 0};

      identity.wallet.pockets.hdPockets.forEach(function(pocket, i) {
          if (!pocket) {
              return;
          }
          var balance = identity.wallet.getBalance(i);

          // Update total
          total.confirmed += balance.confirmed;
          total.current += balance.current;
          total.unconfirmed += balance.unconfirmed;

          // Save the pocket information
          updatePocket({name: pocket.name, mixing: pocket.mixing, balance: balance, type: 'pocket', index: i});
      });
      identity.wallet.multisig.funds.forEach(function(fund, i) {
          if (!fund) {
              return;
          }
          var balance = identity.wallet.getBalance(fund.address);

          // Update total
          total.current += balance.current;
          total.confirmed += balance.confirmed;
          total.unconfirmed += balance.unconfirmed;

          // Save the pocket information
          updatePocket({name: fund.name, mixing: fund.mixing, balance: balance, type: 'fund', fund: fund, index: i});
      });
      updatePocket({name: 'Total', balance: total, type: 'total'}, identity.wallet.pockets.hdPockets.length-1);
 
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
      if (data.type == 'ready' && data.identity != loaded) {
          // Ready event, recalculate balances and cleanup pockets
          loaded = data.identity;
          $scope.allPockets.splice(0, $scope.allPockets.length);
          calculateBalances();
      }
      else if (data.type == 'height') {
          // We may want to recalculate something on height
          $scope.currentHeight = data.value;
          calculateBalances();
      }
      else if (data.type == 'rename') {
          loaded = data.newName;
      }
  });

  Port.connectNg('gui', $scope, function(data) {
      if (data.type == 'balance') {
          // Balance event
          $scope.rates[data.currency] = data.rate;
          calculateBalances();
      }
  });


  }]);
});
