'use strict';

define(['angular-mocks', 'testUtils'], function(mocks, testUtils) {
  describe('Modals provider', function() {

    var modals, $modal, $timeout, $window, notify, sounds, element, _params, settings;
    
    beforeEach(function(done) {
      settings = {
        currency: 'BTC'
      };

      testUtils.stub('darkwallet', {
        getIdentity: function() {
          return {settings: settings};
        }
      });
    
      testUtils.loadWithCurrentStubs('frontend/providers/modals', function() {
        mocks.module("DarkWallet.providers");
        
        mocks.module(function($provide) {
          // Override services
          $provide.value('$modal', {});
          $provide.value('$timeout', function(callback) {callback();});
          $provide.value('notify', {});
          $provide.value('sounds', {});
        });
        
        mocks.inject(['modals', '$modal', '$timeout', '$window', 'notify', 'sounds',
          function(_modals_, _$modal_, _$timeout_, _$window_, _notify_, _sounds_) {
          modals = _modals_;
          $modal = _$modal_;
          $timeout = _$timeout_;
          $window = _$window_;
          notify = _notify_;
          sounds = _sounds_;

          $modal.open = function(params) {
            _params = params;
            var scope = {};
            var modalInstance = {
              close: function() {},
              dismiss: function() {}
            };
            var vars = params.resolve.vars();
            params.controller(scope, modalInstance, vars);
            scope.ok();
            scope.cancel();
            scope.onError();
            return {
              opened: {
                then: function(callback) {
                  callback();
                }
              },
              result: {
                then: function(success, failed) {
                  success('result ' + params.windowClass);
                  failed('reason');
                }
              }
            };
          };

          element = {focus: function() {}};
          $window.document.querySelectorAll = function(selector) {
            if (selector === ".modal-ask-password [autofocus]") {
              return [element];
            }
            return [];
          };

          sounds.play = function() {};
          spyOn(sounds, 'play');

          notify.error = function() {};
          notify.warning = function() {};
          spyOn(notify, 'error');
          spyOn(notify, 'warning');

          done();
        }]);
      });
    });
    
    afterEach(function() {
      testUtils.reset();
    })
    
    it('opens a modal', function() {
      modals.open('template');
      modals.open('template', {field: {}});
      modals.open('template', null, function(result) {
        expect(result).toBe('result modal-template');
      });
      modals.open('template', null, null, function(reason) {
        expect(reason).toBe('reason');
      });
    });
    
    describe('manages scanned qr', function() {
      var vars;
      beforeEach(function() {
        vars = {field:{}};
      });
      
      afterEach(function() {
        expect(vars.field.address).toBe('31oSGBBNrpCiENH3XMZpiP6GTC4tad4bMy');
        expect(sounds.play).toHaveBeenCalled();
      })
      
      it('fills a normal address', function() {
        modals.onQrOk('31oSGBBNrpCiENH3XMZpiP6GTC4tad4bMy', vars);
      });
      
      it('fills an address without the bitcoin: prefix', function() {
        modals.onQrOk('bitcoin:31oSGBBNrpCiENH3XMZpiP6GTC4tad4bMy', vars);
      });
      
      it('scans an address and the amount', function() {
        modals.onQrOk('bitcoin:31oSGBBNrpCiENH3XMZpiP6GTC4tad4bMy?amount=1', vars);
        expect(vars.field.amount).toBe('1');
        // Doesn't override amount
        modals.onQrOk('bitcoin:31oSGBBNrpCiENH3XMZpiP6GTC4tad4bMy?foo=bar', vars);
        expect(vars.field.amount).toBe('1');
        vars.field.amount = undefined;
        modals.onQrOk('bitcoin:31oSGBBNrpCiENH3XMZpiP6GTC4tad4bMy?foo=bar', vars);
        expect(vars.field.amount).toBeUndefined();
        modals.onQrOk('bitcoin:31oSGBBNrpCiENH3XMZpiP6GTC4tad4bMy?foo=bar&amount=1', vars);
        expect(vars.field.amount).toBe('1');
      });
      
      it('scans an address and the amount in millibitcoins', function() {
        settings.currency = 'mBTC';
        modals.onQrOk('bitcoin:31oSGBBNrpCiENH3XMZpiP6GTC4tad4bMy?amount=1', vars);
        expect(vars.field.amount).toBe('1000');
        // Doesn't override amount
        modals.onQrOk('bitcoin:31oSGBBNrpCiENH3XMZpiP6GTC4tad4bMy?foo=bar', vars);
        expect(vars.field.amount).toBe('1000');
        vars.field.amount = undefined;
        modals.onQrOk('bitcoin:31oSGBBNrpCiENH3XMZpiP6GTC4tad4bMy?foo=bar', vars);
        expect(vars.field.amount).toBeUndefined();
        modals.onQrOk('bitcoin:31oSGBBNrpCiENH3XMZpiP6GTC4tad4bMy?foo=bar&amount=1', vars);
        expect(vars.field.amount).toBe('1000');
      });
    });
    
    it('fills for multiple fields', function() {
      var vars = {field: []};
      modals.onQrOk('31oSGBBNrpCiENH3XMZpiP6GTC4tad4bMy', vars);
      modals.onQrOk('13i6nM6iauwi3H4cDk77Nu4NY5Y1bKk3Wd', vars);
      expect(vars.field.length).toBe(2);
      expect(vars.field[1].address).toBe('13i6nM6iauwi3H4cDk77Nu4NY5Y1bKk3Wd');
    });
    
    it('does not fill when there is a req- field', function() {
      var vars = {field: []};
      modals.onQrOk('bitcoin:31oSGBBNrpCiENH3XMZpiP6GTC4tad4bMy?amount=9&req-some=thing');
      expect(vars.field.address).toBeUndefined();
      expect(vars.field.amount).toBeUndefined();
      expect(notify.warning).toHaveBeenCalled();
    });
    
    it('manages qr cancel', function() {
      modals.onQrCancel();
      expect(notify.error).not.toHaveBeenCalled();
      modals.onQrCancel({name: 'PermissionDeniedError'});
      expect(notify.error).toHaveBeenCalledWith('Your camera is disabled');
    });
    
    it('opens a qr scan modal', function() {
      var field = {};
      modals.scanQr(field);
      expect(_params.templateUrl).toBe('modals/scan-qr.html');
      expect(field.address).toBe('result modal-scan-qr');
    });
    
    it('opens a qr show modal', function() {
      modals.showQr('data');
      expect(_params.templateUrl).toBe('modals/show-qr.html');
      expect(_params.resolve.vars()).toEqual({address: 'data'});
      modals.showQr('data', 'version');
      expect(_params.resolve.vars()).toEqual({address: 'data', version: 'version'});
    });
    
    it('opens an enter password modal', function(done) {
      modals.password('Enter your password', function(password) {
        expect(_params.templateUrl).toBe('modals/ask-password.html');
        expect(password).toBe('result modal-ask-password');
        done();
      });
    });
  });
});