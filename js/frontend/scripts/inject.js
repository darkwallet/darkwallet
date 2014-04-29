'use strict';

// Search for things that look like Bitcoin addresses
// Replace them with clickable links.
//var replaced = $("body").html().replace(/text/g,'replace');
//$("body").html(replaced);

/*
var btn = document.createElement("BUTTON")
var t = document.createTextNode("CLICK ME");
btn.appendChild(t);
//Appending to DOM 
document.body.appendChild(btn);
*/

/*
 * We don't use registerProtocolHandler() because we have to declare web accessible
 * resources, and that exposes to the web that the user is using that extension.
 * 
 * The following commit is just for documentation, it is not in our source.
 * https://github.com/sembrestels/darkwallet/commit/b99acd91#diff-4b1eb3dc4
 * 
 * Instead, we listen the click event on links that have bitcoin uris.
 */
document.body.addEventListener('click', function(e) {
  var elem = e.target;
  if (elem.tagName == 'A' && typeof elem.href == 'string' && elem.href.startsWith('bitcoin:')) {
    window.open('chrome-extension://' + chrome.runtime.id + "/html/index.html#/send?uri=" + encodeURIComponent(elem.href));
    e.preventDefault();
  }
}, false);