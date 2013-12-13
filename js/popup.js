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
        {action: 'Received bitcoins', amount: '0.2', timestamp: '31 minutes ago'},
      ];
    }
  }

  $scope.identity = $scope.identities[0];
  $scope.identityChange();
}

function PasswdCtrl($scope) {
  $scope.passwd = "";
  $scope.submit = function() {
    var random = new Uint8Array(16);
    var seed = [];
    window.crypto.getRandomValues(random);
    for (var i in random) {
      seed[i] = random[i];
    }
    seed = Bitcoin.convert.bytesToString(seed);
    var key = new Bitcoin.BIP32key(seed);
    var pubKey = key.getPub().serialize();
    var privKey = key.serialize();
    privKey = sjcl.encrypt($scope.passwd, privKey);
    chrome.storage.local.set({pubKey: pubKey});
    chrome.storage.local.set({privKey: privKey});
    chrome.storage.local.get('pubKey', function(pubKey){
      $scope.pubKey = pubKey.pubKey;
      $scope.$apply();
    });
    chrome.storage.local.get('privKey', function(privKey){
      $scope.privKey = sjcl.decrypt($scope.passwd, privKey.privKey);
      $scope.$apply();
    });
  };
}
