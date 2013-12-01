document.addEventListener('DOMContentLoaded', function () {
  var page = document.getElementById('page');
  page.addEventListener('click', function (e) {
    chrome.tabs.create({url:chrome.extension.getURL("wallet.html")});
    //chrome.tabs.executeScript(null,
    //  {code:"document.body.style.backgroundColor='red'"});
    window.close();
  });
});

