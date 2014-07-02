/**
 * @fileOverview HistoryProvider angular provider
 */
'use strict';

define(['./module', 'util/btc', 'darkwallet', 'dwutil/multisig'],
function (providers, BtcUtils, DarkWallet, MultisigFund) {
  providers.factory('$history', ['$rootScope', '$wallet', '$location', function($rootScope, $wallet, $location) {

  var monthNames = [ "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December" ];

  // Get date 30 days ago
  var prevmonth = new Date();
  prevmonth.setDate(prevmonth.getDate()-30);

  // Get date 7 days ago
  var prevweek = new Date();
  prevweek.setDate(prevweek.getDate()-7);


  /**
   * History provider class
   */ 
  function HistoryProvider($scope, $wallet) {
      this.pocket = {index: undefined, name: 'All Pockets', mpk: undefined, addresses: $wallet.allAddresses, isAll: true, type: 'init', incoming: 0, outgoing: 0};
      this.txFilter = 'last';
      this.addrFilter = 'unused';
      this.$wallet = $wallet;
      this.rows = [];
  }

  /**
   * Balance
   */ 
  HistoryProvider.prototype.calculateBalance = function(pocket) {
      var identity = DarkWallet.getIdentity();
      return identity.wallet.getBalance(pocket.index, pocket.type);
  };

  /**
   * Pocket change
   */ 
  HistoryProvider.prototype.isCurrentPocket = function(pocketId) {
      if (this.pocket.isAll) {
          return true;
      } else if (this.pocket.index === pocketId) {
          return true;
      }
  };

  HistoryProvider.prototype.removePocket = function(type, pocketId) {
    var self = this;
    var identity = DarkWallet.getIdentity();
    var pocket = identity.wallet.pockets.getPocket(pocketId, type);
    if (pocket) {
        var removed = pocket.destroy();
        removed.forEach(function(walletAddress) {
            self.$wallet.removeAddress(walletAddress);
        });
        // go to 'all' if this is the current pocket
        if (this.pocket.index === pocketId && this.pocket.type === type) {
            this.selectAll();
        }
        return pocket;
    }
  };

  HistoryProvider.prototype.onBalanceUpdate = function() {
      this.pocket.balance = this.calculateBalance(this.pocket);
      return this.chooseRows();
  };

  HistoryProvider.prototype.getCurrentPocket = function() {
      return this.pocket;
  };

  HistoryProvider.prototype.setCurrentPocket = function(type, idx, force) {
      if (type === undefined) {
          if (idx === undefined) {
              type = 'all';
          } else {
              type = 'hd';
          }
      }

      // If type is the same or 
      if (type === this.pocket.type && idx === this.pocket.lastIndex && !force) {
          return false;
      }

      var identity = DarkWallet.getIdentity();
      switch(type) {
          case 'all':
              this.selectAll();
              break;
          case 'hd':
              var keys = Object.keys(identity.wallet.pockets.pockets.hd);
              if (this.selectGenericPocket('hd', keys.indexOf(''+idx))) {
                  this.selectedPocket = 'hd:' + idx;
                  this.pocket.lastIndex = idx;
              }
              break;
          case 'readonly':
              this.selectGenericPocket(type, idx);
              break;
          case 'multisig':
              this.selectFund(idx);
              break;
      }
      return true;
  };

  // History Listing
  HistoryProvider.prototype.selectFund = function(fundIndex) {
      var identity = DarkWallet.getIdentity();
      var fund = identity.wallet.multisig.funds[fundIndex];

      if (!fund) {
          $location.path('/wallet');
          return this.selectAll();
      }

      // Need to find the original index for this fund
      var keys = Object.keys(identity.wallet.pockets.pockets.multisig);
      var rowIndex = keys.indexOf(fund.address);

      if (this.selectGenericPocket('multisig', rowIndex)) {
          // some custom data...
          this.pocket.lastIndex = fundIndex;
          this.pocket.fund = new MultisigFund(fund);
          this.pocket.tasks = this.pocket.fund.tasks;
          this.pocket.isFund = true;
          this.selectedPocket = 'multisig:' + fundIndex;
      }
  };

  HistoryProvider.prototype.selectAll = function() {
      var identity = DarkWallet.getIdentity();
      this.pocket.name = "All Pockets";
      this.pocket.index = undefined;
      this.pocket.mpk = undefined;
      this.pocket.type = 'all';

      var mainAddress = identity.wallet.getAddress([0]);
      this.pocket.stealth = mainAddress.stealth;
      this.pocket.mainAddress = mainAddress.stealth;
      this.pocket.mainHash = identity.contacts.generateContactHash(this.pocket.mainAddress);

      this.pocket.fund = null;
      this.pocket.addresses = this.$wallet.allAddresses;
      this.pocket.lastIndex = undefined;
      this.pocket.isAll = true;
      this.pocket.isFund = false;
      this.pocket.readOnly = false;

      this.pocket.balance = identity.wallet.getBalance();

      this.pocket.tasks = [];
      this.selectedPocket = 'pocket:all';
      return this.chooseRows();
  };

  HistoryProvider.prototype.selectGenericPocket = function(type, rowIndex) {
      if (rowIndex === -1) {
          this.selectAll();
          $location.path('/wallet');
          return false;
      }
      var identity = DarkWallet.getIdentity();

      var pockets = identity.wallet.pockets.getPockets(type);

      // ensure order is the same as the sidebar
      var keys = Object.keys(pockets);
      var pocketId = keys[rowIndex];
      if (pocketId === undefined) {
          this.selectAll();
          $location.path('/wallet');
          return false;
      }
      var pocket = pockets[pocketId];

      // set some type information
      this.pocket.isAll = false;
      this.pocket.isFund = false;
      // warning: where index is an int but gets converted to a string, we need
      // to be careful in the line below
      this.pocket.index = (""+rowIndex === pocketId) ? rowIndex : pocketId;
      this.pocket.type = type;
      this.pocket.lastIndex = rowIndex;
      this.pocket.name = pocket.name;
      this.pocket.fund = null;

      // warning: refresh addresses needs to come after setting pocket.isAll
      this.refreshAddresses();

      this.pocket.mixing = pocket.store.mixing;
      this.pocket.mixingOptions = pocket.store.mixingOptions;
      this.pocket.tasks = [];
      this.pocket.readOnly = pocket.readOnly;

      this.pocket.balance = this.calculateBalance(this.pocket);

      // Get the main address for the pocket
      var walletAddress = pocket.getMainAddress();

      // Set some contact fields
      this.pocket.mpk = walletAddress.mpk || walletAddress.address;
      this.pocket.stealth = walletAddress.stealth;
      this.pocket.mainAddress = walletAddress.stealth || walletAddress.address;
      this.pocket.mainHash = identity.contacts.generateContactHash(this.pocket.mainAddress);

      this.selectedPocket = type+':' + rowIndex;
      this.chooseRows();
      return true;
  };

  HistoryProvider.prototype.refreshAddresses = function() {
      var identity = DarkWallet.getIdentity();
      if (this.pocket.isAll) {
          this.pocket.addresses = this.$wallet.allAddresses;
      } else {
          var pocket = identity.wallet.pockets.getPocket(this.pocket.index, this.pocket.type);
          this.pocket.addresses = pocket.getWalletAddresses();
      }
  }

  // Filters
  HistoryProvider.prototype.fillRowContact = function(contacts, row) {
      if (!row.contact) {
          var contact = contacts.findByAddress(row.address);
          if (contact) {
              row.contact = contact;
          }
      }
  };
 
  // Filter the rows we want to show
  HistoryProvider.prototype.chooseRows = function() {
      this.pocket.incoming = 0;
      this.pocket.outgoing = 0;
      var identity =  DarkWallet.getIdentity();
      var self = this;
      var history = identity.history.history;
      var rows = history.filter(this.pocketFilter, this);
      rows = rows.sort(function(a, b) {
         if (!a.height) {
            return -10000000;
         }
         if (!b.height) {
            return 10000000;
         }
         return b.height - a.height;
      });
      var shownRows = [];
      rows = rows.filter(function(row) { return self.historyFilter(row, shownRows); } );
      if (!rows.length) {
          this.rows = [];
          return [];
      }
      if (this.txFilter === 'weekly') {
          this.rows = this.calculateWeekly(rows);
      }
      else if (this.txFilter === 'monthly') {
          this.rows = this.calculateMonthly(rows);
      } else {
          this.rows = this.calculateHistory(rows);
      }
      return this.rows;
  };

  HistoryProvider.prototype.calculateMonthly = function(rows) {
      var self = this;
      var now = new Date();
      var d = now.getDate(); //get the current day
      var monthStart = new Date(now.valueOf() - ((d===1?0:d-1)*86400000)); //rewind to start day
      var monthEnd;
      var getLabel = function(dateStart, dateEnd) {
         return monthNames[dateEnd.getMonth()]+"/"+dateEnd.getFullYear();
      };
      var month = {index: 0, incoming: 0, outgoing: 0, transactions: 0, label: getLabel(monthStart, monthStart)};
      var result = [month];

      var monthIndex = 0;
      var blockDiff = DarkWallet.service.wallet.blockDiff;
      rows.forEach(function(row) {
           if (row.height) {
               var timestamp = BtcUtils.heightToTimestamp(row.height, blockDiff);
               while (timestamp < monthStart) {
                   monthEnd = new Date(monthStart.valueOf()-86400000);
                   monthStart = new Date(monthStart.valueOf()-(monthEnd.getDate()*86400000));
                   monthIndex -= 1;
                   var label = getLabel(monthStart, monthEnd);
                   month = {index: monthIndex, incoming: 0, outgoing: 0, transactions: 0, label: label};
                   result.push(month);
               }
           }
           month.transactions += 1;
           var impact = self.getRowImpact(row);
           if (impact>0) {
               month.incoming += impact;
           } else {
               month.outgoing -= impact;
           }
      });

      return result;
  };

  HistoryProvider.prototype.calculateWeekly = function(rows) {
      var self = this;
      var now = new Date();
      var startDay = 1; //0=sunday, 1=monday etc.
      var d = now.getDay(); //get the current day
      var weekStart = new Date(now.valueOf() - (d<=0 ? 7-startDay:d-startDay)*86400000); //rewind to start day
      weekStart -= now.getHours()*3600000;
      weekStart -= now.getMinutes()*60000;

      var getLabel = function(dateStart, dateEnd) {
         var start = dateStart.toLocaleDateString();
         var end = dateEnd.toLocaleDateString();
         //return monthNames[weekStart.getMonth()]+"-"+(Math.floor(weekStart.getDate()/7)+1);
         return start + "-" + end;
      };
      var week = {index: 0, incoming: 0, outgoing: 0, transactions: 0};
      var result = [week];

      var weekIndex = 0;
      var blockDiff = DarkWallet.service.wallet.blockDiff;

      rows.forEach(function(row) {
           if (row.height) {
               var timestamp = BtcUtils.heightToTimestamp(row.height, blockDiff);
               while (timestamp < weekStart) {
                   var weekEnd = new Date(weekStart-86400000);
                   weekStart = new Date(weekStart-(7*86400000));
                   weekIndex -= 1;
                   var label = getLabel(weekStart, weekEnd);
                   week = {index: weekIndex, incoming: 0, outgoing: 0, transactions: 0, label: label};
                   result.push(week);
               }
           }
           week.transactions += 1;
           var impact = self.getRowImpact(row);
           if (impact>0) {
               week.incoming += impact;
           } else {
               week.outgoing -= impact;
           }
      });

      return result;
  };

  HistoryProvider.prototype.getRowImpact = function(row) {
      if (this.pocket.index === undefined) {
          return row.total;
      } else {
          return row.impact[this.pocket.index].total;
      }
  };

  HistoryProvider.prototype.calculateHistory = function(rows) {
      var identity =  DarkWallet.getIdentity();

      // Now calculate balances
      var prevRow = rows[0];
      prevRow.confirmed = this.pocket.balance.confirmed;
      prevRow.unconfirmed = this.pocket.balance.unconfirmed;
      prevRow.current = this.pocket.balance.current;
      prevRow.partial = this.getRowImpact(prevRow);

      var contacts = identity.contacts;
      this.fillRowContact(contacts, prevRow);
      var idx = 1;
      while(idx<rows.length) {
          var row = rows[idx];
          this.fillRowContact(contacts, row);
          
          var value = prevRow.partial;

          row.partial = this.getRowImpact(row);

          row.current = prevRow.current-value;

          if (prevRow.height || prevRow.inMine) {
              row.confirmed = prevRow.confirmed-value;
              row.unconfirmed = prevRow.unconfirmed;
              if (!prevRow.height) {
                 // outgoing
                 row.unconfirmed -= value;
              }
          } else {
              row.confirmed = prevRow.confirmed;
              row.unconfirmed = prevRow.unconfirmed-value;
          }
          prevRow = row;
          idx++;
      }
      return rows;
  };


  HistoryProvider.prototype.pocketFilter = function(row) {
      // Making sure shownRows is reset before historyFilter stage is reached.
      if (this.pocket.isAll) {
          if (!row.height) {
              this.pocket.incoming += row.myInValue;
              this.pocket.outgoing += row.myOutValue;
          }
          // only add pocket transactions for now
          return ((typeof row.inPocket === 'number') || (typeof row.outPocket === 'number'));
      }
      else {
          var keys = Object.keys(row.impact);
          var impacted = (keys.indexOf(this.pocket.index) > -1);
          if (!row.height && impacted && row.impact[this.pocket.index] > 0) {
              this.pocket.incoming += row.impact[this.pocket.index];
          } else if (impacted && !row.height) {
              this.pocket.outgoing -= row.impact[this.pocket.index];
          }
          return impacted;
      }
  };

  // Set the history filter
  HistoryProvider.prototype.setAddressFilter = function(name) {
      this.addrFilter = name;
      return name;
  };

  HistoryProvider.prototype.addressFilter = function(row) {
      switch(this.addrFilter) {
          case 'all':
              return true;
          case 'unused':
              return !row.nOutputs;
          case 'top':
              return row.balance>0;
          case 'labelled':
              return ['unused', 'change'].indexOf(row.label) == -1;
          default:
              break;
      }

  };

  // Set the history filter
  HistoryProvider.prototype.setHistoryFilter = function(name) {
      this.txFilter = name;
      return this.chooseRows();
  };

  // Clear the contact in any rows that have it linked
  HistoryProvider.prototype.clearRowContacts = function(contact) {
      var identity = DarkWallet.getIdentity();
      identity.history.history.forEach(function(row) {
          if (contact === row.contact) {
              row.contact = undefined;
          }
      });
  };

  HistoryProvider.prototype.historyFilter = function(row, shownRows) {
      var blockDiff = DarkWallet.service.wallet.blockDiff;
      if (!row.height) {
          shownRows.push(row.hash);
          return true;
      }
      switch(this.txFilter) {
          case 'last':
          case 'weekly':
          case 'monthly':
              return true;
          case 'last10':
          default:
              if (shownRows.indexOf(row.hash) !== -1) {
                  return true;
              } else if (shownRows.length < 10) {
                  shownRows.push(row.hash);
                  return true;
              }
      }
      return false;
  };

      return new HistoryProvider($rootScope.$new(), $wallet);
  }]);
});
