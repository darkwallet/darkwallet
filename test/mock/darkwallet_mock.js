/*
 * @fileOverview Main object for generic dark wallet api.
 */

define(function() {
// DarkWallet object.
var DarkWallet = {

    // Get the wallet service.
    service: function() {
      var _radar = 0;
      return {
        getKeyRing: function() {
          
        },
        getClient: function() {
          return {
            fetch_transaction: function(hash, callback) {
              var tx =  {
                "a1b0c4cb40f018d379adf9ff5c1aaf62a8e4083a3b0dc125ad843b169af9f329":
                "0100000001e5ff4507c27f122178533f07eef680bde0218ef8d731bc52fe64a898\
22ac4e36000000006a473044022034f6b4a877c1064bd58653dc102cf1187d4b33e048d1074bdd469bb\
6af21445b022068532bbbfe7c15251329a5b479a448d03d7572d0b79d5a554e87f8096cb2af57012103\
298323901ec8554099ff7e64e28195f9ae94a2f3487df56b64a7deeabf6428baffffffff027a870d000\
000000017a9140db1635fe975792a9a7b6f2d4061b730478dc6b987484f4000000000001976a9143b70\
f2aeea554b7fb7d145061efad4398879b9be88ac00000000"
              };
              callback(0, tx[hash]);
            },
            broadcast_transaction: function(tx, callback) {
              if (tx == 'newTxError') {
                callback(true);
              } else {
                callback(null, _radar++);
              }
            }
          };
        },
        getIdentity: function() {
          
        },
        getLobbyTransport: function() {
           return {
               getChannel: function(name) {
                   return {
                       name: name,
                       addCallback: function(_name, _cb) { },
                       removeCallback: function(_name, _cb) { }
                   }
               }
           }
        }
      };
    },

    // Identity key ring. Holds all identities.
    getKeyRing: function() {return DarkWallet.service().getKeyRing()},

    // Light client
    getClient: function() {return DarkWallet.service().getClient()},

    // Get identity
    getIdentity: function(idx) {return DarkWallet.service().getIdentity(idx)},

    // Lobby transport
    getLobbyTransport: function() {return DarkWallet.service().getLobbyTransport()}
};
return DarkWallet;
});
