'use strict';

define(['angular-mocks', 'frontend/providers/notify'], function(mocks) {
  describe('Notify provider', function() {

    var notify, toaster, ngProgress;
    
    beforeEach(mocks.module("DarkWallet.providers"));
    beforeEach(function() {
      mocks.module(function($provide) {
        // Override services
        $provide.value('toaster', {});
        $provide.value('ngProgress', {});
      });
    });
    beforeEach(mocks.inject(['notify', 'toaster', 'ngProgress', function(_notify_, _toaster_, _ngProgress_) {
      notify = _notify_;
      toaster = _toaster_;
      ngProgress = _ngProgress_;
      
      toaster.pop = function() {};
      spyOn(toaster, 'pop');
      
    }]));

    it('notifies a note', function() {
      notify.note('hello', 'world');
      expect(toaster.pop).toHaveBeenCalledWith('note', 'hello', 'world');
    });

    it('notifies an error', function() {
      notify.error('hello', 'world');
      expect(toaster.pop).toHaveBeenCalledWith('error', 'hello', 'world');
    });

    it('notifies a warning', function() {
      notify.warning('hello', 'world');
      expect(toaster.pop).toHaveBeenCalledWith('warning', 'hello', 'world');
    });

    it('notifies a success', function() {
      notify.success('hello', 'world');
      expect(toaster.pop).toHaveBeenCalledWith('success', 'hello', 'world');
    });
    
    it('wrapps ngProgress', function() {
      expect(notify.progress).toBe(ngProgress);
    })
  });
});