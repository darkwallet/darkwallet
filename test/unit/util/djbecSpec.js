'use strict';

define(['util/djbec', 'bitcoinjs-lib'], function(Djbec, Bitcoin) {

   var sk1, sk2, pk1, pk2;

   // TODO: We should add standard test vectors here
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

   var signed1 = [198, 145, 189, 237, 140, 224, 4, 101, 219, 26, 136, 65, 151, 155, 154, 107, 168, 12, 87, 245, 147, 28, 97, 219, 63, 202, 109, 233, 38, 113, 140, 121, 204, 134, 175, 165, 242, 13, 130, 124, 223, 161, 40, 84, 80, 43, 215, 190, 153, 11, 136, 47, 153, 3, 173, 24, 85, 250, 147, 154, 6, 166, 205, 3];
   var signed2 = [142, 109, 15, 212, 137, 92, 61, 172, 54, 141, 170, 90, 32, 138, 132, 60, 199, 67, 112, 153, 181, 83, 43, 216, 23, 164, 74, 103, 242, 140, 179, 63, 1, 56, 79, 230, 213, 92, 178, 237, 162, 121, 131, 105, 203, 158, 59, 65, 170, 12, 67, 117, 186, 2, 247, 41, 26, 185, 148, 25, 41, 56, 9, 10];

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
