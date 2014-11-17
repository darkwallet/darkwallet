'use strict';

define(['util/djbec', 'bitcoinjs-lib'], function(Djbec, Bitcoin) {

   var sk1, sk2, pk1, pk2;

   // some vectors from http://ed25519.cr.yp.to/python/sign.input
   var vectors = [
     ["b18e1d0045995ec3d010c387ccfeb984d783af8fbb0f40fa7db126d889f6dadd", // priv
      "77f48b59caeda77751ed138b0ec667ff50f8768c25d48309a8f386a2bad187fb", // pub
      "916c7d1d268fc0e77c1bef238432573c39be577bbea0998936add2b50a653171ce18a542b0b7f96c1691a3be6031522894a8634183eda38798a0c5d5d79fbd01dd04a8646d71873b77b221998a81922d8105f892316369d5224c9983372d2313c6b1f4556ea26ba49d46e8b561e0fc76633ac9766e68e21fba7edca93c4c7460376d7f3ac22ff372c18f613f2ae2e856af40", // msg
      "6bd710a368c1249923fc7a1610747403040f0cc30815a00f9ff548a896bbda0b4eb2ca19ebcf917f0f34200a9edbad3901b64ab09cc5ef7b9bcc3c40c0ff7509"], // sig,
      ["93649c63910b35718e48c590d261c48e4ef8336613f6aa077b462676b3ba8829",
      "06a685898b855212ebc289915d105a4320d620d85771b8c6b15bf10a1be6e9b8",
      "2cd1a951056c9ebae1399b6bd2d82c0ae277856290d06920ac56cac8fb42435101c72aa9c08dd2d12426325562c2f0a49cd821b11b939aafa593b4095c021bcb4827b107b9664d68282888bc4a44af3e3bdc861be6af309044c3daab57b77023dc902d47ebc326f9bdd02dbc02cd540ff81b2ddf7cf679a41193dfe5f8c8ca1aaefc41ef740280d9823e30a354717c8431f5d8",
      "6274f2d4f431d5affefa35e7cf584a599017193da99094ca908b75acb608d1bf981857be93a7dafb0fadb3ff0906f48a5ee950456f782c2d605b14095ba0ff0f"],
      ["1c15cbeb89362d69476a2aa4a5f3ef2089cf87286349e0dfe0e72d9e3e5a66c7",
       "13a882a1064182582c211847e19b4dac59722c9ffd34826d96f33113400fac7a",
       "091c9b9b116ae83d23d01a6295211785d446b6228dd687ddf79bd0d5a4daa8c79d2cbfc37365f1f285e361738123e34e2bcbfc664ce1253a11d9e4a7982e58cf9468e1017ea14d2cc6d0865d40fde8cb560241e96ac1617c791f0ca7c6410cadf328611b18aef333d8350ac497f0a4ae2d03fdf0e23e426d34f4514780d1474e113583541f3c043672057172618cb2059eaaed56",
       "5998b2808adfdeeaebe2c3eac026d3f825f9c7f2af97ca324fbd57aac1bedff78a8ee621d037ee3ad2a712e9a009c58ea3e6f2a828f74b86da275a44a4b1e50b"]
   ];

   function unhexlify(s) {
     if (s.length === 0) { return ''; }
     return s.match(/.{1,2}/g).map(function(x) { return String.fromCharCode(parseInt(x, 16)); }).join('');
   }

   function hexlify(s) {
     return s.split("").map(function(x) { return ("0" + x.charCodeAt(0).toString(16)).slice(-2); }).join("")
   };

   var sk1Bytes = [1,2,3,4,5,6,7,8,1,2,3,4,5,6,7,8,1,2,3,4,5,6,7,8,1,2,3,4,5,6,7,8];
   var sk2Bytes = [1,2,3,8,5,6,7,8,1,25,3,4,58,86,7,8,1,2,3,4,5,56,7,8,1,2,3,4,5,6,7,8];
   var sk1String = "3630912263819880391871841998814355599719133951328004060450684113124377952769";
   var sk2String = "3630912263819880391871860706035313435276488585285723842877408623300767318529";

   var pk1String = "41202715211027140813958021888988770900774044112800746194328591365721768705212";
   var pk2String = "53255436729671775084746528346843731237424359258590576875878644045356852269230";

   var sk1IntHash = "3785047263979736627163772602458212674009569523367137115970539162935690024316525691811301446413093761092955240714105344418655782000506159820373323951773707";
   var sk2IntHash = "1894406637379832781313025905937390438599175151636787297416528594762862868558309845562413840260014748644461397263008935459552025316601253903903533755937758";

   var signPk1 = [153, 32, 105, 155, 191, 185, 219, 175, 20, 23, 50, 114, 114, 124, 168, 245, 71, 56, 0, 137, 97, 13, 195, 134, 108, 162, 184, 72, 132, 49, 3, 245];
   var signPk2 = [77, 240, 156, 31, 253, 144, 166, 77, 78, 41, 226, 51, 169, 189, 14, 232, 208, 38, 175, 0, 56, 16, 13, 94, 119, 219, 98, 102, 24, 97, 89, 9];

   var signed1 = [144, 232, 193, 107, 170, 89, 237, 234, 81, 236, 21, 118, 242, 41, 143, 238, 43, 231, 148, 12, 196, 196, 129, 64, 228, 68, 176, 76, 186, 88, 242, 62, 162, 145, 53, 30, 63, 43, 157, 83, 117, 89, 255, 154, 154, 200, 29, 156, 137, 137, 159, 83, 245, 142, 177, 166, 119, 123, 120, 67, 215, 59, 206, 8];
   var signed2 = [65, 200, 104, 166, 233, 87, 122, 53, 57, 56, 210, 114, 13, 175, 23, 91, 244, 52, 156, 205, 224, 32, 180, 94, 55, 122, 98, 222, 64, 17, 216, 168, 187, 234, 235, 18, 253, 7, 215, 205, 37, 104, 82, 34, 0, 218, 199, 218, 100, 212, 77, 93, 69, 33, 182, 153, 229, 27, 100, 54, 203, 185, 183, 5];

   describe('curve25519 encryption library', function() {

    beforeEach(function() {
      sk1 = Djbec.bytes2bi(sk1Bytes);
      sk2 = Djbec.bytes2bi(sk2Bytes);
      pk1 = Djbec.curve25519(sk1);
      pk2 = Djbec.curve25519(sk2);
    });

    it('converts bytes to big integer', function() {
        var bi1 = Djbec.bytes2bi(sk1Bytes);
        var bi2 = Djbec.bytes2bi(sk2Bytes);

        expect(bi1.toString()).toBe(sk1String);
        expect(bi2.toString()).toBe(sk2String);
    });

    it('converts big integer to bytes', function() {
        var bi1 = new Bitcoin.BigInteger(sk1String);
        var bi2 = new Bitcoin.BigInteger(sk2String);

        var bytes1 = Djbec.bi2bytes(bi1);
        var bytes2 = Djbec.bi2bytes(bi2);

        expect(bytes1).toEqual(sk1Bytes);
        expect(bytes2).toEqual(sk2Bytes);
    });

    it('calculates a public key', function() {
        var pk1 = Djbec.curve25519(sk1);
        var pk2 = Djbec.curve25519(sk2);

        expect(pk1.toString()).toBe(pk1String);
        expect(pk2.toString()).toBe(pk2String);
    });

    it('calculates dh', function() {
        var secret1 = Djbec.curve25519(sk1, pk2);
        var secret2 = Djbec.curve25519(sk2, pk1);

        expect(secret1.toString()).toBe(secret2.toString());
    });

    it('calculates an inthash', function() {
        var hash1 = Djbec.inthash('foo1');
        var hash2 = Djbec.inthash('foo2');

        expect(hash1.toString()).toBe(sk1IntHash)
        expect(hash2.toString()).toBe(sk2IntHash)
    });

    it('runs internal dh test', function() {
        var res = Djbec.dh_test(sk1, sk2);

        expect(res).toBe(true);
    });

    it('ecDH', function() {
        expect(Djbec.ecDH(sk1, pk2).toString()).toEqual(Djbec.curve25519(sk1, pk2).toString());
        expect(Djbec.ecDH(sk2, pk1).toString()).toEqual(Djbec.curve25519(sk2, pk1).toString());
    });


   });

   describe('ed25519 signing library', function() {
    it('generates signing public keys', function() {
        var spk1 = Djbec.publickey('foo1');
        var spk2 = Djbec.publickey('foo2');

        expect(spk1).toEqual(signPk1)
        expect(spk2).toEqual(signPk2)
    });

    it('signs', function() {
        var sig1 = Djbec.signature('hello', 'foo1', signPk1);
        var sig2 = Djbec.signature('hello', 'foo2', signPk2);

        expect(sig1).toEqual(signed1)
        expect(sig2).toEqual(signed2)
    });

    it('checks signatures', function() {
        var res1 = Djbec.checksig(signed1, 'hello', signPk1);
        var res2 = Djbec.checksig(signed2, 'hello', signPk2);

        expect(res1).toBe(true);
        expect(res2).toBe(true);
    });

    it('decodes points', function() {
        var p1 = Djbec.decodepoint(signPk1);
        var p2 = Djbec.decodepoint(signPk2);

        expect(p1[0].toString()).toBe('49869354224628164998473947843571652374772190148595454313149084780422241844587');
        expect(p1[1].toString()).toBe('52926245577378894609145116867658767299698320542241374899390053605721688842393');
        expect(p2[0].toString()).toBe('56138736041316152858743926437126683607454611737593693010150309720318411997484');
        expect(p2[1].toString()).toBe('4228735153231553677555693497958551710520480637253298945598201213897920016461');
    });

    it('encodes points', function() {
        var p1x = new Bitcoin.BigInteger('49869354224628164998473947843571652374772190148595454313149084780422241844587');
        var p1y = new Bitcoin.BigInteger('52926245577378894609145116867658767299698320542241374899390053605721688842393');
        var p2x = new Bitcoin.BigInteger('56138736041316152858743926437126683607454611737593693010150309720318411997484');
        var p2y = new Bitcoin.BigInteger('4228735153231553677555693497958551710520480637253298945598201213897920016461');

        var pk1 = Djbec.encodepoint([p1x, p1y]);
        var pk2 = Djbec.encodepoint([p2x, p2y]);

        expect(pk1).toEqual(signPk1);
        expect(pk2).toEqual(signPk2);
    });

    it('decodes int', function() {
        var bi1 = new Bitcoin.BigInteger(sk1String);
        var bi2 = new Bitcoin.BigInteger(sk2String);

        var bytes1 = Djbec.encodeint(bi1);
        var bytes2 = Djbec.encodeint(bi2);

        expect(bytes1).toEqual(sk1Bytes);
        expect(bytes2).toEqual(sk2Bytes);
    });

    it('encodes int', function() {
        var bi1 = Djbec.decodeint(sk1Bytes);
        var bi2 = Djbec.decodeint(sk2Bytes);

        expect(bi1.toString()).toEqual(sk1String);
        expect(bi2.toString()).toEqual(sk2String);
    });

    it('creates a public key', function() {
        vectors.forEach(function(vector) {
            var privHex = vector[0];
            var pubHex = vector[1];
            var privKey = unhexlify(privHex);
            var pub = Djbec.publickey(privKey);
            expect(Djbec.bytes2string(pub)).toEqual(unhexlify(pubHex));
        });
    });

    it('checks signatures', function() {
        vectors.forEach(function(vector) {
            var pubHex = vector[1];
            var msgHex = vector[2];
            var sigHex = vector[3];
            var sig = Bitcoin.convert.hexToBytes(sigHex);
            var msg = unhexlify(msgHex);
            var pk = Bitcoin.convert.hexToBytes(pubHex);

            expect(Djbec.checksig(sig, msg, pk)).toBe(true);
        });
    });



    it('runs internal sigs test', function() {
        var res = Djbec.sig_test('foo')

        expect(res).toBe(true);
    });


   });

   describe('ecDH timing', function () {
    xit('test if the branches in zpt_sm take different time', function() {
        var base = new Uint8Array(32);
        var n = new Uint8Array(32);
        window.crypto.getRandomValues(base);
        var bi_base = Djbec.curve25519(Djbec.bytes2bi(base));
        var guess0 = [];
        var guess1 = [];
        var samples = 1000;
        for (var i = 0; i < samples + 1; i++) {
            window.crypto.getRandomValues(n);
            /* pretend the first 7 bits have been guessed to be 1010100 and
             * we're trying to guess the next bit from the timing
             * difference */
            n[31] = 84;
            var bi_n = Djbec.bytes2bi(n);
            var t_start, t_end;
            t_start = window.performance.now();
            Djbec.curve25519(bi_n, bi_base);
            t_end = window.performance.now();
            /* the first one is slow (because of javascript optimization?) */
            if (i > 0)
                guess0.push(t_end - t_start);

            n[31] = 84 + 128;
            bi_n = Djbec.bytes2bi(n);
            t_start = window.performance.now();
            Djbec.curve25519(bi_n, bi_base);
            t_end = window.performance.now();
            if (i > 0)
                guess1.push(t_end - t_start);
        }

        /* basic stat functions */
        var sum = function(nums) {
            return nums.reduce(function(a, b) { return a + b; }, 0);
        };

        var mean = function(nums) {
            return sum(nums) / nums.length;
        };

        var variance = function(nums) {
            return Math.sqrt((1 / nums.length) * sum(nums.map(function (x) {return (x - this) * (x - this)}, mean(nums))));
        };

        /* calculate the stats */
        var t_value = (mean(guess0) - mean(guess1)) / (Math.sqrt(0.5*(variance(guess0) + variance(guess1))) * Math.sqrt(2/samples));
        console.log(t_value);
        console.log(mean(guess0));
        console.log(mean(guess1));
    });

   });
});
