define(['util/encryption', 'bitcoinjs-lib'], function (Encryption, Bitcoin) {
  'use strict';


   var convert = Bitcoin.convert;
   var priv1 = [1,2,3,4,5,6,7,8,1,2,3,4,5,6,7,8,1,2,3,4,5,6,7,8,1,2,3,4,5,6,7,8];
   var priv2 = [40,2,3,80,5,6,7,8,1,2,200,4,5,6,7,8,1,2,3,4,5,6,7,30,1,2,3,4,5,6,7,8];
   var salt1 = [1,2,3,4,5,6,7,8,1,2,3,4,5,6,7,8];
   var sk1String = "3630912263819880391871841998814355599719133951328004060450684113124377952769";
   var pk1String = "41202715211027140813958021888988770900774044112800746194328591365721768705212";
   var sk2String = "3630912263819880391871860706035313435276488585285723842877408623300767318529";
   var pk2String = "53255436729671775084746528346843731237424359258590576875878644045356852269230";
   var signPk1 = [153, 32, 105, 155, 191, 185, 219, 175, 20, 23, 50, 114, 114, 124, 168, 245, 71, 56, 0, 137, 97, 13, 195, 134, 108, 162, 184, 72, 132, 49, 3, 245];

   describe('DarkWallet encryption library', function() {

     it('runs pbkdf2', function() {
         var salt = [1257186216, 1232830679, 1170146244, -885338222];
         var result1 = Encryption.pbkdf2('foo', salt, 1000);
         var result2 = Encryption.pbkdf2('foo', salt, 100);
         expect(result1).toEqual([2009227810, 1007622408, 1831134731, -180373023, -1317676430, -896658796, -923166224, -1493813979]);
         expect(result2).toEqual([-2075347970, 1683887616, 1083372104, 169975936, -1141536062, 1346044816, 397305448, 287967530]);
     });

     it('encrypts', function() {
         var ivWords = Bitcoin.CryptoJS.lib.WordArray.create([964042148, 1339623129, -848535864]);
         var saltWords = Bitcoin.CryptoJS.lib.WordArray.create([1257186216, 1232830679, 1170146244, -885338222]);
         var cipher = Encryption.encrypt('foo', 'hello', ivWords, saltWords);

         expect(cipher.iv).toBe("OXYdpE/ZBtnNbF7I")
         expect(cipher.data).toBeDefined()
         expect(cipher.salt).toBe("Su8jqEl7gNdFvwPEyzrPkg==")
         expect(cipher.it).toBe(1000)
         expect(cipher.ks).toBe(256)
         expect(cipher.pad).toBe(64)
     });

     it('decrypts', function() {
         var cipher = { data: 'elA0D+udrLv6YbG++KXS6WRhQ7v6ELJ3KyjC9FXf4v3DldmZWgf9W8EALgBPhCuXL9b447oQq2DYhkxMV27LwSL9jRY/',
                        iv: 'OXYdpE/ZBtnNbF7I',
                        salt: 'ndiWCYV7cfwUrqHG+S6ecQ==',
                        it: 1000,
                        ks: 256,
                        pad: 64};

         var cleartext = Encryption.decrypt('foo', cipher);
         expect(cleartext).toBe('hello');
     });

     it('encrypts and decrypts', function() {
         var cipher = Encryption.encrypt('foo', 'hello world');
         var cleartext = Encryption.decrypt('foo', cipher);
         expect(cleartext).toBe('hello world');
     });

     it('decrypts wrongly', function() {
         // TODO: here one char is changed from the data (ciphertext), this should be detected
         var cipher = { data: 'elA0D+udrLv6YbG++KXS6WRhQ7v6ELJ3KyjC9FXf4v3DldmZWgf9W8EALgBPhCvXL9b447oQq2DYhkxMV27LwSL9jRY/',
                        iv: 'OXYdpE/ZBtnNbF7I',
                        salt: 'ndiWCYV7cfwUrqHG+S6ecQ==',
                        it: 1000,
                        ks: 256,
                        pad: 64};

         var cleartext = Encryption.decrypt('foo', cipher);
         expect(cleartext).toBe('hello');
     });


     it('generates shared secrets', function() {
         var priv1 = new Bitcoin.BigInteger(sk1String);
         var priv2 = new Bitcoin.BigInteger(sk2String);
         var pub1 = new Bitcoin.BigInteger(pk1String);
         var pub2 = new Bitcoin.BigInteger(pk2String);

         var shared1 = Encryption.genSharedSecret(priv1, pub2);
         var shared2 = Encryption.genSharedSecret(priv2, pub1);

         expect(shared1.hmac.words).toEqual(shared2.hmac.words);
         expect(shared1.message.words).toEqual(shared2.message.words);
     });

     it('generates fingerprints', function() {
         var fingerprint = Encryption.genFingerprint(signPk1)

         expect(fingerprint).toBe('A38F3250FFBC4D744CED0B8DA1F453D8ADC7A742');
     });

     it('adapts private keys for curve25519', function() {
         var priv1 = new Bitcoin.BigInteger(sk1String);
         var priv2 = new Bitcoin.BigInteger(sk2String);

         var newKey1 = Encryption.adaptPrivateKey(priv1);
         var newKey2 = Encryption.adaptPrivateKey(priv2);

         expect(newKey1.toString()).toBe('32578934573148929247764588250986332563036630117738145070315080115102660362752');
         expect(newKey2.toString()).toBe('32578934573148929247764606958207290398593984751695864852741804625279049728512');
     });


   });
   describe('DarkWallet stealth encryption library', function() {
     var privKey, pubKey, stealthCypher;

     beforeEach(function() {
       privKey = new Bitcoin.ECKey(priv1, true);
       pubKey = privKey.getPub().toBytes();
     });

     it('stealth encrypts and decrypts', function() {
         var encKeyBytes = priv2;
         stealthCypher = Encryption.stealth.encrypt(pubKey, 'hello', encKeyBytes);

         expect(stealthCypher.data.ks).toBe(256)
         expect(stealthCypher.data.ts).toBe(128)
         expect(stealthCypher.data.cipher).toBe('aes')
         expect(stealthCypher.data.mode).toBe('ccm')

         var cleartext = Encryption.stealth.decrypt(privKey, stealthCypher);

         expect(cleartext).toBe('hello');
     });

     it('stealth decrypts for identity', function() {
         var identity = {
            wallet: {
                getPrivateKey: function(_seq, _pass, _cb) {_cb(privKey);}
            }
         }
         var cleartext;
         Encryption.stealth.decryptForIdentity(stealthCypher, identity, [0, 0], 'foo', function(_cleartext){cleartext=_cleartext});
         expect(cleartext).toBe('hello');
     });
 
   });
 
});
