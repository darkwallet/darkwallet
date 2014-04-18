/**
 * @fileOverview HistoryCtrl angular controller
 */

define(['./module', 'bitcoinjs-lib', 'util/btc', 'darkwallet'],
function (controllers, Bitcoin, BtcUtils, DarkWallet) {
  'use strict';
  controllers.controller('HistoryCtrl', ['$scope', 'notify', function($scope, notify) {

  // Start some structures
  $scope.pocket = {index: undefined, name: 'All Pockets', mpk: undefined, addresses: $scope.allAddresses, changeAddresses: []};
  $scope.pocketName = "All Pockets";
  $scope.selectedPocket = 'pocket:all';

  $scope.isAll = true;
  $scope.isFund = false;

  // Create a profile out of a public key by looking in contacts and wallet.
  var detectParticipant = function(pubKeyBytes) {
      var identity = DarkWallet.getIdentity();

      // Ensure we check the compressed version for my address
      var myPubKey = new Bitcoin.ECPubKey(pubKeyBytes, true);
      var myAddress = myPubKey.getAddress();

      var compressed = (pubKeyBytes.length == 33);

      // Initially show the address for the compressed key, not necessarily the
      // one we know about the contact if they're using uncompressed addresses
      var contactAddress = new Bitcoin.ECPubKey(pubKeyBytes, compressed);

      var participant = { name: contactAddress.toString(),
                          pubKey: pubKeyBytes,
                          hash: contactAddress.toHex() };

      var walletAddress = identity.wallet.getWalletAddress(myAddress);
      if (walletAddress) {
          // Current identity
          participant.type = 'me';
          participant.name = identity.name;
          participant.address = walletAddress;
          // In some cases would not be the stealth identifier.
          // Also, doing it like this so it would show the same as in contacts..
          participant.hash = Bitcoin.CryptoJS.SHA256(walletAddress.stealth).toString();
      } else {
          // Check if it's a contact
          var contact = identity.contacts.findByPubKey(pubKeyBytes);
          if (contact) {
              participant.name = contact.name;
              participant.hash = contact.hash;
              participant.type = 'contact';
          }
      }
      return participant;
  };

  // Detect participants for a fund from contacts and wallet.
  var detectFundParticipants = function(fund) {
      // TODO: Not very efficient, should keep track in some way
      var participants = [];

      fund.pubKeys.forEach(function(pubKey) {
          participants.push(detectParticipant(pubKey));
      });

      return participants;
  };

  // Check tasks and put some info in the pocket
  var checkFundTasks = function(fund) {
      var identity = DarkWallet.getIdentity();
      var res = [];
      // Check pending tasks for fund
      var tasks = identity.tasks.tasks.multisig;
      if (tasks) {
          tasks.forEach(function(task) {
              var addresses = task.pending.map(function(p){return p.address});
              if (addresses.indexOf(fund.address) != -1) {
                  var tx = new Bitcoin.Transaction(task.tx);
                  res.push({tx: tx, task: task});
              }
          });
      }
      return res;
  };

  // History Listing
  $scope.selectFund = function(fund, rowIndex) {
      $scope.pocket.name = fund.name;
      $scope.pocket.index = fund.seq[0];
      var address = $scope.identity.wallet.getAddress(fund.seq);
      $scope.pocket.participants = detectFundParticipants(fund);
      var meFound = $scope.pocket.participants.filter(function(participant) {return participant.type=='me';});
      $scope.pocket.participants = detectFundParticipants(fund);
      $scope.pocket.canSign = meFound.length ? true : false ;
      $scope.pocket.changeAddresses = [];
      $scope.pocket.addresses = [address];
      $scope.pocket.fund = fund;
      $scope.pocket.tasks = checkFundTasks(fund);
      $scope.isAll = false;
      $scope.isFund = true;
      $scope.pocket.mpk = undefined;
      $scope.pocket.stealth = undefined;
      $scope.selectedPocket = 'fund:' + rowIndex;

      var balance = $scope.identity.wallet.getBalance(fund.seq[0]);

      $scope.balance = balance.confirmed;
      $scope.unconfirmed = balance.unconfirmed;

      // Check tasks and put some info in the pocket
      checkFundTasks(fund, $scope.pocket);
  };
  $scope.selectPocket = function(pocketName, rowIndex, form) {
      var pocketIndex;
      if (pocketName === undefined) {
          $scope.pocket.name = "All Pockets";
          $scope.pocket.index = undefined;
          $scope.pocket.mpk = undefined;
          $scope.pocket.stealth = undefined;
          $scope.pocket.fund = null;
          $scope.pocket.addresses = $scope.allAddresses;
          $scope.pocket.changeAddresses = [];
          $scope.isAll = true;
          $scope.isFund = false;
          var balance = $scope.identity.wallet.getBalance();
          $scope.balance = balance.confirmed;
          $scope.unconfirmed = balance.unconfirmed;
          $scope.pocket.tasks = [];
          //balanceStart($scope.balance);
          rowIndex = 'all';
      } else {
          pocketIndex = rowIndex*2;
          $scope.pocket.index = pocketIndex;
          $scope.pocket.name = pocketName;
          $scope.pocket.fund = null;
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
          $scope.pocket.changeAddresses = $scope.addresses[$scope.pocket.index+1];
          var walletPocket = $scope.identity.wallet.pockets.getPocket(pocketName);
          $scope.pocket.mixing = walletPocket.mixing;
          $scope.pocket.tasks = [];
          $scope.isAll = false;
          $scope.isFund = false;
          // balance is sum of public and change branches
          var mainBalance = $scope.identity.wallet.getBalance(pocketIndex);
          var changeBalance = $scope.identity.wallet.getBalance(pocketIndex+1);
          $scope.balance = mainBalance.confirmed + changeBalance.confirmed;
          $scope.unconfirmed = mainBalance.unconfirmed + changeBalance.unconfirmed;
          $scope.forms.pocketLabelForm = form;
      }
      $scope.selectedPocket = 'pocket:' + rowIndex;
  };

  $scope.renamePocket = function(pocket) {
    if (!pocket.name) {
      $scope.forms.pocketLabelForm.$show();
    } else {
      $scope.identity.store.save();
    }
  };

  $scope.newMultiSig = function() {
    $scope.selectedPocket = 'newMultisig';
  };

  // Pockets
  $scope.newPocket = {};
  $scope.creatingPocket = false;
  $scope.deletePocket = function(pocket) {
      $scope.openModal('confirm-delete', {name: pocket.name, object: pocket}, $scope.deletePocketFinish)
  };
  $scope.deletePocketFinish = function(pocket) {
      $scope.identity.wallet.pockets.deletePocket(pocket.name);
      $scope.selectPocket();
  };
  $scope.setMixing = function(pocket) {
      var identity = $scope.identity;
      var walletPocket = identity.wallet.pockets.getPocket(pocket.name);
      walletPocket.mixing = !walletPocket.mixing;
      pocket.mixing = walletPocket.mixing;
      identity.wallet.store.save();
      var mixerService = DarkWallet.service.mixer;
      mixerService.checkMixing();
  };
  $scope.createPocket = function() {
    if ($scope.creatingPocket) {
      if ($scope.newPocket.name) {
          // create pocket
          $scope.identity.wallet.pockets.createPocket($scope.newPocket.name);
          var pocketIndex = $scope.identity.wallet.pockets.hdPockets.length-1;
          // initialize pocket on angular
          $scope.initPocket(pocketIndex);
          // generate an address
          $scope.generateAddress(pocketIndex, 0);
          // select the pocket
          $scope.selectPocket($scope.newPocket.name, pocketIndex);
          // reset pocket form
          $scope.newPocket = {name:''};
      }
    }
    $scope.creatingPocket = !$scope.creatingPocket;
  };

  // Filters

  var shownRows = [];
  $scope.txFilter = 'last10';

  var pocketFilter = function(row) {
      // Making sure shownRows is reset before historyFilter stage is reached.
      shownRows = [];
      if ($scope.isAll) {
          // only add pocket transactions for now
          return typeof row.pocket === 'number';
      }
      else {
          // row pocket here is just 1st element in index, pocket can be pocket/2
          if (typeof row.pocket === 'number') {
              // row.pocket here is the branch id, pocket.index is 2*pocketId
              var pocketBranch = (row.pocket%2) ? row.pocket-1 : row.pocket;
              return pocketBranch == $scope.pocket.index;
          } else {
              return row.pocket == $scope.pocket.index;
          }
      }
  };

  // Get date 30 days ago
  var prevmonth = new Date();
  prevmonth.setDate(prevmonth.getDate()-30);
  // Get date 7 days ago
  var prevweek = new Date();
  prevweek.setDate(prevweek.getDate()-7);

  // Set the history filter
  $scope.setHistoryFilter = function(name) {
      $scope.txFilter = name;
      shownRows = [];
  };

  // History filter, run for every row to see if we should show it
  $scope.unusedAddressFilter = function(address) {
      return address.nOutputs == 0;
  };
  $scope.usedAddressFilter = function(address) {
      return address.nOutputs;
  };
  $scope.pocketFilter = function(row) {
      return pocketFilter(row);
  };
  $scope.historyFilter = function(row) {
      switch($scope.txFilter) {
          case 'all':
              return true;
          case 'lastWeek':
              var ts = BtcUtils.heightToTimestamp(row.height);
              if (ts > prevweek.getTime()) {
                  return true;
              }
              break;
          case 'lastMonth':
              var ts = BtcUtils.heightToTimestamp(row.height);
              if (ts > prevmonth.getTime()) {
                  return true;
              }
              break;
          case 'last10':
          default:
              if (shownRows.indexOf(row.hash) != -1) {
                  return true;
              } else if (shownRows.length < 10) {
                  shownRows.push(row.hash);
                  return true;
              }
      }
      return false;
  };

  $scope.moveFunds = function(type, index) {
    var wallet = $scope.identity.wallet;
    var walletService = DarkWallet.service.wallet;
    var to;
    var address;
    if (type === 'pocket') {
      to = wallet.pockets.hdPockets[index].name;
      address = wallet.getFreeAddress(index).address;
    } else if (type === 'multisig') {
      to = wallet.multisig.funds[index].name;
      address = wallet.getFreeAddress(index).address;
    } else {
      to = $scope.availableIdentities[index];
      address = '';
    }
    $scope.openModal('ask-password', {text: "Are you sure you want to move all " + $scope.pocket.name +
    " funds to " + to + "?"}, function(password) {
      var fee = wallet.store.get('fee');
      var amount = wallet.getBalance($scope.pocket.index).confirmed - fee;
      walletService.send($scope.pocket.index, [{amount: amount, address: address}], null, fee, true, function() {
        console.log('Not implemented yet.');
      });
    });
  };

}]);
});
