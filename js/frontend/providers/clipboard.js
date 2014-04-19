define(['./module'], function (providers) {
'use strict';

providers.factory('clipboard', ['notify', '$window', function(notify, $window) {

var clipboard = {

  copyClipboard: function(text) {
    var copyDiv = $window.document.createElement('div');
    copyDiv.contentEditable = true;
    copyDiv.style="position: fixed;";
    $window.document.getElementById('fixed').appendChild(copyDiv);
    copyDiv.innerHTML = text;
    copyDiv.unselectable = "off";
    copyDiv.focus();
    $window.document.execCommand('SelectAll');
    $window.document.execCommand("Copy", false, null);
    $window.document.getElementById('fixed').removeChild(copyDiv);
  },
  
  pasteClipboard: function() {
    var pasteDiv = $window.document.createElement('div');
    pasteDiv.contentEditable = true;
    $window.document.getElementById('fixed').appendChild(pasteDiv);
    pasteDiv.innerHTML = '';
    pasteDiv.unselectable = "off";
    pasteDiv.focus();
    $window.document.execCommand("paste");
    var text = pasteDiv.innerText;
    $window.document.getElementById('fixed').removeChild(pasteDiv);
    return text;
  },
  registerScope: function(scope) {
    scope.copyClipboard = function (text, notification) {
        notification = notification || 'Copied to clipboard';
        clipboard.copyClipboard(text);
        notify.note(notification);
    };
    scope.pasteClipboard = clipboard.pasteClipboard;
  }

};
return clipboard;
}]);
});
