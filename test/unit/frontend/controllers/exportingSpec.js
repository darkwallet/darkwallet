/**
 * @fileOverview ExportingCtrl angular controller
 */
'use strict';

define(['angular-mocks', 'testUtils', 'bitcoinjs-lib'], function (mocks, testUtils, Bitcoin) {

  describe('Exporting controller', function() {
    var exportingController, scope, DarkWallet, notify;

    var modals = {password: function(title, cb) {cb('pass');}};

    var identity = {
      wallet: {
        getWalletAddress: function(address) {
          return {address: address, type: 'hd'}
        },
        getPocketAddresses: function(pocketId) {
          return ['1BgGZ9tcN4rm9KBzDn7KprQz87SZ26SAMH',
                  '1cMh228HTCiwS8ZsaakH8A8wze1JR5ZsP',
                  '1CUNEBjYrCn2y1SdiUMohaKUi4wpP326Lb']
        },
        getPrivateKey: function(address, pass, cb) {
          var wif = '';
          var addr = address.address;
          // well-known keys with weak secret exponents (1,2,3)
          if (addr == '1BgGZ9tcN4rm9KBzDn7KprQz87SZ26SAMH') {
            wif = 'KwDiBf89QgGbjEhKnhXJuH7LrciVrZi3qYjgd9M7rFU73sVHnoWn';
          } else if (addr == '1cMh228HTCiwS8ZsaakH8A8wze1JR5ZsP') {
            wif = 'KwDiBf89QgGbjEhKnhXJuH7LrciVrZi3qYjgd9M7rFU74NMTptX4';
          } else if (addr == '1CUNEBjYrCn2y1SdiUMohaKUi4wpP326Lb') {
            wif = 'KwDiBf89QgGbjEhKnhXJuH7LrciVrZi3qYjgd9M7rFU74sHUHy8S';
          }
          cb(Bitcoin.ECKey.fromWIF(wif))
        }
      }
    };
      
    var injectController = function() {
      mocks.inject(["$rootScope", "$controller", function ($rootScope, $controller) {
        scope = $rootScope.$new();
        notify = {};
        notify.success = function() {};
        notify.error = function() {};
        var _ = function(s, x) {
          return s.replace(/\{0\}/, x);
        };
        exportingController = $controller('ExportingCtrl', {$scope: scope, notify: notify, _Filter: _, modals: modals});
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

      mocks.module("DarkWallet.controllers");
      
      testUtils.loadWithCurrentStubs('frontend/controllers/exporting', function() {
        injectController();
        DarkWallet = require('darkwallet');
        done();
      });
    });
    
    afterEach(function() {
      testUtils.reset();
      delete window.chrome;
    });

    describe('', function() {

      it('exports a key if an address is given', function() {
        scope.tools = {};
        scope.tools.exportAddresses = '1BgGZ9tcN4rm9KBzDn7KprQz87SZ26SAMH';
        // spyOn(identity.wallet, 'getPrivateKey');
        scope.exportKeys()
        expect(scope.tools.exportAddresses).toBe(
          '1BgGZ9tcN4rm9KBzDn7KprQz87SZ26SAMH' + ',' + 'KwDiBf89QgGbjEhKnhXJuH7LrciVrZi3qYjgd9M7rFU73sVHnoWn' + '\n'
        );
      });

      it('exports one key for every address given', function() {
        scope.tools = {};
        scope.tools.exportAddresses = '1BgGZ9tcN4rm9KBzDn7KprQz87SZ26SAMH' + '\n' +
          '1cMh228HTCiwS8ZsaakH8A8wze1JR5ZsP';
        scope.exportKeys()
        expect(scope.tools.exportAddresses).toBe(
          '1BgGZ9tcN4rm9KBzDn7KprQz87SZ26SAMH' + ',' + 'KwDiBf89QgGbjEhKnhXJuH7LrciVrZi3qYjgd9M7rFU73sVHnoWn' + '\n' +
          '1cMh228HTCiwS8ZsaakH8A8wze1JR5ZsP' + ',' + 'KwDiBf89QgGbjEhKnhXJuH7LrciVrZi3qYjgd9M7rFU74NMTptX4' + '\n'
        );
      });

       it('exports all keys if no input is given', function() {
         scope.tools = {};
         scope.tools.exportAddresses = '';
         scope.exportKeys()
         expect(scope.tools.exportAddresses).toBe(
           '1BgGZ9tcN4rm9KBzDn7KprQz87SZ26SAMH' + ',' + 'KwDiBf89QgGbjEhKnhXJuH7LrciVrZi3qYjgd9M7rFU73sVHnoWn' + '\n' +
           '1cMh228HTCiwS8ZsaakH8A8wze1JR5ZsP' +  ',' + 'KwDiBf89QgGbjEhKnhXJuH7LrciVrZi3qYjgd9M7rFU74NMTptX4' + '\n' +
           '1CUNEBjYrCn2y1SdiUMohaKUi4wpP326Lb' + ',' + 'KwDiBf89QgGbjEhKnhXJuH7LrciVrZi3qYjgd9M7rFU74sHUHy8S' + '\n'
         );
       });
        
       it('does not clear input on bad input', function() {
         scope.tools = {};
         scope.tools.exportAddresses = '123';
         scope.exportKeys()
         expect(scope.tools.exportAddresses).toBe('123');
         expect(scope.tools.exportComplete).toBe(false);
         // expect(scope.tools.exportOpen).toBe(true);
         // expect(scope.tools.open).toBe(true);
       });

    });
  });
});
