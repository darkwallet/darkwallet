'use strict';

/*
 * We don't use registerProtocolHandler() because we have to declare web accessible
 * resources, and that exposes to the web that the user is using that extension.
 * 
 * The following commit is just for documentation, it is not in our source.
 * https://github.com/sembrestels/darkwallet/commit/b99acd91#diff-4b1eb3dc4
 * 
 * Instead, we listen the click event on links that have bitcoin uris.
 */

var bitcoinUri = function(uri) {
  var _uri = 'chrome-extension://' + chrome.runtime.id + '/src/html/index.html#/';
  if (typeof uri != 'string') {
    return false;
  }
  if (uri.indexOf('bitcoin:') == 0) {
    return _uri + "send?uri=" + encodeURIComponent(uri);
  }
  if (uri.indexOf('bitid:') == 0) {
    return _uri + "bitid?uri=" + encodeURIComponent(uri);
  }
  return false;
};

document.body.addEventListener('click', function(e) {
  var elem = e.target;
  while (elem && elem.tagName != 'A') {
    elem = elem.parentNode;
  }
  if (elem && elem.tagName == 'A' && bitcoinUri(elem.href)) {
    var u = bitcoinUri(elem.href);
    chrome.runtime.sendMessage({ type: 'newTab', url: u });
    e.preventDefault();
  }
}, false);
