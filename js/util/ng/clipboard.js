define(function() {
var ClipboardUtils = {

  copyClipboard: function(text) {
    var copyDiv = document.createElement('div');
    copyDiv.contentEditable = true;
    copyDiv.style="position: fixed;";
    document.getElementById('fixed').appendChild(copyDiv);
    copyDiv.innerHTML = text;
    copyDiv.unselectable = "off";
    copyDiv.focus();
    document.execCommand('SelectAll');
    document.execCommand("Copy", false, null);
    document.getElementById('fixed').removeChild(copyDiv);
  },
  
  pasteClipboard: function() {
    var pasteDiv = document.createElement('div');
    pasteDiv.contentEditable = true;
    document.getElementById('fixed').appendChild(pasteDiv);
    pasteDiv.innerHTML = '';
    pasteDiv.unselectable = "off";
    pasteDiv.focus();
    document.execCommand("paste");
    var text = pasteDiv.innerText;
    document.getElementById('fixed').removeChild(pasteDiv);
    return text;
  },
  registerScope: function(scope) {
    scope.copyClipboard = ClipboardUtils.copyClipboard;
    scope.pasteClipboard = ClipboardUtils.pasteClipboard;
  }

}
return ClipboardUtils;

});
