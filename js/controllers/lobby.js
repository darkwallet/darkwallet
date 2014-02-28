
function LobbyCtrl($scope, toaster) {
  DarkWallet.service().ready(function() {
    $scope.pairCode = '';
    $scope.requests = [];
    $scope.peers = [];
    $scope.peerIds = [];
    $scope.subscribed = false;
    var SHA256 = Bitcoin.Crypto.SHA256;
    var identity = DarkWallet.getIdentity();

    // Session key
    if (!identity.sessionKey) {
        identity.sessionKey = new Bitcoin.Key();
        identity.sessionKey.compressed = true;
    }
    var sessionKey = identity.sessionKey;

    // Identity (communications) key
    var selfKey;
    if (identity.store.get('commsKey')) {
        selfKey = new Bitcoin.Key(identity.store.get('commsKey'));
    }
    else {
        selfKey = new Bitcoin.Key();
        selfKey.compressed = true;
        identity.store.set('commsKey', selfKey.export('bytes'));
        identity.store.save();
    }

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

    // Get a simple mnemonic name
    var getMnemoname = function(dataBytes) {
        var mnemonic = new Mnemonic(64);
        mnemonic.random = [];
        mnemonic.random[0] = Bitcoin.Util.bytesToNum(dataBytes.slice(0,4));
        mnemonic.random[1] = Bitcoin.Util.bytesToNum(dataBytes.slice(8,16));
        var mnemoName = mnemonic.toWords().slice(0,4).join(" ");
        return mnemoName;

    }

    // Initialize peer structure
    var initializePeer = function(pubKeyBytes, iconSize) {
        var pubKeyHex = Bitcoin.convert.bytesToHex(pubKeyBytes);
        var mnemoname = getMnemoname(pubKeyBytes);
        var newPeer = {pubKeyHex: pubKeyHex, name: mnemoname};
        // TODO the identicon should be loaded in an angular directive,
        // but we do it now here for testing
        setTimeout(function(){
            new Identicon('peer'+pubKeyHex, Bitcoin.Util.bytesToNum(pubKeyBytes.slice(8,16)), iconSize);
        },1000);
        return newPeer;

    }

    // Initialize and add peer to scope
    var addPeer = function(pubKeyBytes) {
        var newPeer = initializePeer(pubKeyBytes, 24);
        $scope.peerIds.push(newPeer.pubKeyHex);
        $scope.peers.push(newPeer);
    }

    // Initialize some own data
    $scope.comms = initializePeer(sessionKey.getPub(), 32);
    $scope.myself = initializePeer(selfKey.getPub(), 32);

    // Callback for data received on channel
    var onChannelData = function(pairCodeHash, message) {
        console.log("data for channel", message);
        var decrypted;
        var decoded = JSON.parse(message.data);
        // Just an encrypted message
        if (decoded.cipher) {
            decrypted = sjcl.decrypt(pairCodeHash, message.data);
            var decryptedBytes = Bitcoin.convert.hexToBytes(decrypted);
            if (decrypted != $scope.comms.pubKeyHex) {
                if ($scope.peerIds.indexOf(decrypted) == -1) {
                    addPeer(decryptedBytes);
                }
                startPairing($scope.pairCode, decryptedBytes);
            }
        // Stealth message to us (maybe)
        } else if (decoded.pub) {
            console.log("stealth", sessionKey, decoded);
            decrypted = Stealth.decrypt(sessionKey, decoded);
        }
        if (decrypted) {
            $scope.requests.push({data: decrypted});
            console.log("data for channel", decrypted);
        }
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
        var pubKeyHash = Bitcoin.convert.bytesToHex(sessionKey.getPub())
        var encrypted = sjcl.encrypt(pairCodeHash, pubKeyHash, {ks: 256, ts: 128});
        // chan tests
        if ($scope.subscribed != pairCodeHash && !client.handler_map["chan.update." + pairCodeHash]) {
            console.log("announcing", pairCodeHash, pubKeyHash, encrypted);
            channelSubscribe($scope.pairCode, function(err, data){
                if (!err) {
                    $scope.subscribed = pairCodeHash;
                }
                console.log("channel subscribed", err, data)
            }, function(_data) {onChannelData(pairCodeHash, _data)});
        }
        channelPost($scope.pairCode, encrypted, function(err, data){
            console.log("channel post", err, data)
        });
        /*
        client.chan_get("b", "announcements", function(err, data){console.log("channel get", err, data)})
        client.chan_list("b", function(err, data){console.log("channel list", err, data)})*/
 
    }
  });
}
