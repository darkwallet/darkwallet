
function LobbyCtrl($scope, toaster) {
    $scope.pairCode = '';
    $scope.requests = [];
    $scope.subscribed = false;
    var SHA256 = Bitcoin.Crypto.SHA256;
    var tmpKey = Bitcoin.Key();
    tmpKey.compressed = true;

    // Subscribe to given channel
    var channelSubscribe = function(channel, callback, update_cb) {
        client = DarkWallet.getClient();
        var channelHash = SHA256(SHA256($scope.pairCode)+$scope.pairCode);
        client.chan_subscribe("b", channelHash, callback, update_cb);
    }

    // Post to given channel
    var channelPost = function(channel, data, callback) {
        var channelHash = SHA256(SHA256(channel)+channel);
        client = DarkWallet.getClient();
        client.chan_post("b", channelHash, data, callback);
    }

    // Callback for data received on channel
    var onChannelData = function(message) {
        console.log("data for channel", message);
        var decrypted;
        var pubKeyHash = Bitcoin.convert.bytesToHex(tmpKey.getPub())
        var pairCodeHash = $scope.subscribed;
        var decoded = JSON.parse(message.data);
        // Just an encrypted message
        if (decoded.cipher) {
            decrypted = sjcl.decrypt(pairCodeHash, message.data);
            $scope.requests.push({data: decrypted});
            //if (decrypted != pubKeyHash) {
                startPairing($scope.pairCode, Bitcoin.convert.hexToBytes(decrypted));
            //}
        // Stealth message to us (maybe)
        } else if (decoded.pub) {
            console.log("stealth", tmpKey, decoded);
            decrypted = Stealth.decrypt(tmpKey, decoded);
        }
        console.log("data for channel", decrypted);
        if(!$scope.$$phase) {
            $scope.$apply();
        }
  
    }

    // Start pairing with another identity
    var startPairing = function(channel, pubKey) {
        // pair to a specific user session public key
        var msg = 'hello';
        var encrypted = Stealth.encrypt(pubKey, msg);
        channelPost(channel, JSON.stringify(encrypted), function(err, data){
            console.log("channel post2", err, data)
        });
    }

    // Action to start announcements and reception
    $scope.announceSelf = function() {
        client = DarkWallet.getClient();
        var pairCodeHash = SHA256(SHA256($scope.pairCode)+$scope.pairCode);
        var pubKeyHash = Bitcoin.convert.bytesToHex(tmpKey.getPub())
        var encrypted = sjcl.encrypt(pairCodeHash, pubKeyHash, {ks: 256, ts: 128});
        // chan tests
        if ($scope.subscribed != pairCodeHash) {
            console.log("announcing", pairCodeHash, pubKeyHash, encrypted);
            channelSubscribe($scope.pairCode, function(err, data){
                if (!err) {
                    $scope.subscribed = pairCodeHash;
                }
                console.log("channel subscribed", err, data)
            }, onChannelData);
        }
        channelPost($scope.pairCode, encrypted, function(err, data){
            console.log("channel post", err, data)
        });
        /*
        client.chan_get("b", "announcements", function(err, data){console.log("channel get", err, data)})
        client.chan_list("b", function(err, data){console.log("channel list", err, data)})*/
 
    }
}
