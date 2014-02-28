
function LobbyCtrl($scope, toaster) {
    $scope.pairCode = '';
    $scope.requests = [];
    $scope.subscribed = false;
    var SHA256 = Bitcoin.Crypto.SHA256;
    var tmpKey = Bitcoin.Key();
    $scope.announceSelf = function() {
        client = DarkWallet.getClient();
        var pairCodeHash = SHA256(SHA256($scope.pairCode)+$scope.pairCode);
        var pubKeyHash = Bitcoin.convert.bytesToHex(tmpKey.getPubKeyHash())
        var encrypted = sjcl.encrypt(pairCodeHash, pubKeyHash, {ks: 256, ts: 128});
        // chan tests
        if ($scope.subscribed != pairCodeHash) {
            console.log("announcing", pairCodeHash, pubKeyHash, encrypted);
            client.chan_subscribe("b", pairCodeHash, function(err, data){
                if (!err) {
                    $scope.subscribed = pairCodeHash;
                }
                console.log("channel subscribed", err, data)
            }, function(_data) {
                console.log("data for channel", _data);
                var decrypted = sjcl.decrypt(pairCodeHash, _data.data);
                console.log("data for channel", decrypted);
                $scope.requests.push({data: decrypted});

                if(!$scope.$$phase) {
                    $scope.$apply();
                }
            });
        }
        client.chan_post("b", pairCodeHash, encrypted, function(err, data){
            console.log("channel post", err, data)
        });
        /*client.chan_post("b", "announcements", "hi " + $scope.pairCode, function(err, data){console.log("channel post", err, data)})
        client.chan_get("b", "announcements", function(err, data){console.log("channel get", err, data)})
        client.chan_list("b", function(err, data){console.log("channel list", err, data)})*/
 
    }
}
