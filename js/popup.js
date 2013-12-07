document.addEventListener('DOMContentLoaded', function () {
  var page = document.getElementById('history');
  page.addEventListener('click', function (e) {
    chrome.tabs.create({url:chrome.extension.getURL("wallet.html")});
    //chrome.tabs.executeScript(null,
    //  {code:"document.body.style.backgroundColor='red'"});
    window.close();
  });
});

function PopupCtrl($scope) {
  $scope.identities = [
    {id: 'gengix'},
    {id: 'sem'},
  ];
  
  $scope.identityChange = function() {
    if ($scope.identity.id == 'gengix') {
      $scope.activity = [
        {action: 'Received bitcoins', amount: '0.05', timestamp: '5 minutes ago'},
        {action: 'Received bitcoins', amount: '0.01', timestamp: '6 minutes ago'},
      ];
    } else {
      $scope.activity = [
        {action: 'Received bitcoins', amount: '0.1', timestamp: '15 minutes ago'},
        {action: 'Received bitcoins', amount: '2', timestamp: '26 minutes ago'},
      ];
    }
  }

  $scope.identity = $scope.identities[0];
  $scope.identityChange();
}

