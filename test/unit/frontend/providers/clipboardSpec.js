'use strict';

define(['angular-mocks', 'frontend/providers/clipboard'], function(mocks) {
  describe('Clipboard provider', function() {

    var clipboard, $window, notify, _clipboardText, el;
    
    beforeEach(mocks.module("DarkWallet.providers"));
    beforeEach(function() {
      mocks.module(function($provide) {
        // Override services
        $provide.value('notify', {});
      });
    });
    beforeEach(mocks.inject(['clipboard', '$window', 'notify', function(_clipboard_, _$window_, _notify_) {
      clipboard = _clipboard_;
      $window = _$window_;
      notify = _notify_;
      
      notify.note = function() {};
      spyOn(notify, 'note');
      
      el = $window.document.createElement('div');
      el.setAttribute('id', 'fixed');
      $window.document.body.appendChild(el);
      
      $window.document.execCommand = function(command){
        switch(command) {
          case 'Copy':
            _clipboardText = $window.document.querySelector('#fixed div').innerHTML;
            break;
          case 'paste':
            $window.document.querySelector('#fixed div').innerHTML = _clipboardText;
            break;
        }
      };
    }]));

    afterEach(function() {
      $window.document.body.removeChild(el);
    });
    
    it('copies', function() {
      clipboard.copy('text');
      expect(_clipboardText).toBe('text');
      expect(notify.note).toHaveBeenCalledWith('Copied to clipboard');
      expect($window.document.getElementById('fixed').innerHTML).toBe('');
    });
    
    it('copies with a different notification', function() {
      clipboard.copy('text', 'Copied text');
      expect(notify.note).toHaveBeenCalledWith('Copied text');
    });
    
    it('pastes', function() {
      _clipboardText = 'hello';
      var text = clipboard.paste();
      expect(text).toBe('hello');
      expect($window.document.getElementById('fixed').innerHTML).toBe('');
    });
  });
});