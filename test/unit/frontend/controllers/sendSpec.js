/**
 * @fileOverview SendCtrl angular controller
 */
'use strict';

define(['angular-mocks', 'testUtils'], function (mocks, testUtils) {

  describe('Send controller', function() {
    var sendController, scope, routeParams, location, _contacts, DarkWallet, callback;

    var modals = {called: null, confirmSend: function(title, obj, contacts, cb) {cb(obj);this.called = obj;}};
    var identity = {
      name: "test",
      settings: {
      },
      tx: {
        prepare: function() {return {created: []};}
      },
      contacts: {
        parseKey: function() { return {}; },
        findByAddress: function() { },
        contacts: _contacts,
        generateContactHash: function() { return "dead"; },
        addContact: function(newContact) {
          identity.contacts.contacts.push(newContact);
          return newContact;
        },
        updateContact: function(contact) {},
        deleteContact: function(contact) {}
      },
      wallet: {
        dust: 460,
        versions: {stealth: {address: 42}, pcode: {address: 47}, address: 0, p2sh: 5},
        getWalletAddress: function() {},
        multisig: {
            search: function() {return {name: 'fundName', address: 'fundAddress'}}
        },
        pockets: {
            pockets: {readonly: [], hd: [], multisig: []},
            getPockets: function() {return []},
            getPocket: function() {return {name: 'testPocket'}},
            hdPockets: [{name: 'pocketName'}]
        }
      }
    };
    
    var injectController = function(routeParams) {
      mocks.inject(["$rootScope", "$controller", function ($rootScope, $controller) {
        var watch = {};
        var notify = {};
        watch.removePocket = function() {};
        watch.initPocket = function() {};
        watch.renamePocket = function() {};
        watch.addKey = function() {};
        watch.removeKey = function() {};
        watch.renameKey = function() {};
        scope = $rootScope.$new();
        scope.forms = {send: {}};
        scope.quicksend = {};
        routeParams = routeParams || {};
        location = {
          path: function(path) {
            location._path = path;
          }
        };
        var _ = function(s) {
          return s;
        };
        var history = {refreshAddresses: function() {}, clearRowContacts: function() {}, removePocket: function(){}};
        var wallet = {addToScope: function() {}, getChangeAddress: function() {return {address: '17a7r4qa5FPCHiPwXYuH9nqZ1AobTkMVub'};}};
        var timeout = function() { };
        var _window = function() { };
        var tabs = {updateTabs: function() {}};
        timeout.cancel = function() {};
        sendController = $controller('WalletSendCtrl', {$scope: scope, $wallet: wallet, $timeout: timeout, $window: _window, $history: history, notify: notify, _Filter: _, modals: modals, $tabs: tabs});
      }]);
    };
    
    beforeEach(function(done) {
      window.chrome = {runtime: {}};
      testUtils.stub('darkwallet', {
        service: {
          wallet: { 
            mixTransaction: function() {}
          }
        },
        getIdentity: function() {
          return identity;
        }
      });
      testUtils.stub('frontend/port', {
        connectNg: function(service, scope, c) {
          callback = c;
        }
      });
      testUtils.stub('dwutil/currencyformat', {
        asSatoshis: function() {return 100000;},
        asBtc: function() {return 0.001;},
        fiatToBtc: function() {return 'btc';},
        btcToFiat: function() {return 'fiat';}
      });


      mocks.module("DarkWallet.controllers");
      
      testUtils.loadWithCurrentStubs('frontend/controllers/send', function() {
        injectController();
        DarkWallet = require('darkwallet');
        //spyOn(identity.contacts, 'deleteContact');
        done();
      });
    });
    
    afterEach(function() {
      testUtils.reset();
      delete window.chrome;
    });

    describe('', function() {

      it('is created properly', function() {
        expect(scope.quicksend).toEqual({next: false});
        expect(scope.forms.send.sending).toBe(false);
        expect(scope.forms.send.title).toBe('');
        expect(scope.sendEnabled).toBe(false);
        expect(scope.quicksend.next).toBe(false);
      });

      it('resets the form properly', function() {
        scope.forms.send.title = "fooo"
        scope.resetSendForm();
        expect(scope.forms.send.sending).toBe(false);
        expect(scope.forms.send.title).toBe('');
        expect(scope.sendEnabled).toBe(false);
        expect(scope.quicksend.next).toBe(false);
      });

      it('updates btc to fiat', function() {
        var field = {isFiatShown: false, amount: 10000};
        scope.updateBtcFiat(field);
        expect(field.fiatAmount).toBe('fiat');
      });

      it('updates fiat to btc', function() {
        var field = {isFiatShown: true, fiatAmount: 10000};
        scope.updateBtcFiat(field);
        expect(field.amount).toBe('btc');
      });

      it('sets pocket', function() {
        scope.setPocket('any');
        expect(scope.forms.send.sendPocketName).toBe('Any');
        expect(scope.forms.send.pocketIndex).toBe(0);
        scope.setPocket(0);
        expect(scope.forms.send.sendPocketName).toBe('pocketName');
        expect(scope.forms.send.pocketIndex).toBe(0);
        scope.setPocket('fundAddress');
        expect(scope.forms.send.sendPocketName).toBe('fundName');
        expect(scope.forms.send.pocketIndex).toBe('fundAddress');
      });

      it('validates an empty send form', function() {
        scope.validateSendForm();
        expect(scope.sendEnabled).toBe(false);
      });

      it('validates a quicksend orm', function() {
        scope.quicksend.next = true;
        scope.quicksend.address = "1MTnG6LPTo4TLCZTYqW5LvVx6R1vDDnBEF";
        scope.quicksend.amount = 100000;
        scope.validateSendForm();
        expect(scope.sendEnabled).toBe(true);
      });

      it('validates the send form', function() {
        scope.resetSendForm();
        scope.forms.send.recipients.fields = [{address: '1MTnG6LPTo4TLCZTYqW5LvVx6R1vDDnBEF', amount: 1000}];
        scope.validateSendForm();
        expect(scope.sendEnabled).toBe(true);
      });

      it('sends bitcoins', function() {
        scope.resetSendForm();
        scope.forms.send.recipients.fields = [{address: '1MTnG6LPTo4TLCZTYqW5LvVx6R1vDDnBEF', amount: 1000}];
        scope.sendBitcoins();
        expect(scope.forms.send.sending).toBe(true);
        expect(modals.called).toEqual({ pocket : { name : 'testPocket' }, metadata : { created : [  ], label : '' } });
      });

      it('toggles coinjoin', function() {
        scope.toggleCoinJoin();
        expect(scope.forms.send.mixing).toBe(false);
        scope.toggleCoinJoin();
        expect(scope.forms.send.mixing).toBe(true);
      });

      it('adds a field', function() {
        expect(scope.forms.send.autoAddEnabled).toBe(false);
        expect(scope.forms.send.recipients.fields.length).toBe(1);
        scope.addField();
        expect(scope.forms.send.recipients.fields.length).toBe(2);
      });

      it('enables autoadd', function() {
        scope.enableAutoAddFields();
        expect(scope.forms.send.autoAddEnabled).toBe(true);
      });

      it('runs the qt modal', function() {
        var called = false;
        scope.onQrModalOk = function()  { called=true; };
        scope.onQrModalOkSend()
        expect(called).toBe(true);
      });

      it('autoadds a field', function() {
        scope.enableAutoAddFields();
        scope.forms.send.recipients.fields = [{address: '1MTnG6LPTo4TLCZTYqW5LvVx6R1vDDnBEF', amount: 1000}];
        scope.autoAddField();
        expect(scope.forms.send.recipients.fields.length).toBe(2);
        scope.autoAddField();
        expect(scope.forms.send.recipients.fields.length).toBe(2);
      });

      it('autoadds a field with autoadd disabled', function() {
        scope.forms.send.recipients.fields = [{address: '1MTnG6LPTo4TLCZTYqW5LvVx6R1vDDnBEF', amount: 1000}];
        scope.autoAddField();
        expect(scope.forms.send.recipients.fields.length).toBe(1);
        scope.autoAddField();
        expect(scope.forms.send.recipients.fields.length).toBe(1);
      });




    });
  });
});
