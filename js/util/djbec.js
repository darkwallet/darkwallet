
//  Ed25519 - digital signatures based on curve25519
//  Adapted from http://ed25519.cr.yp.to/python/ed25519.py by Ron Garret
//  December 2011
//
//  Requires jsbn and jsSHA
//  http://www-cs-students.stanford.edu/~tjw/jsbn/
//
//  Running under v8 highly recommended.  Anything else is pretty slow.


BigInteger.prototype.toSource = function(b) {
  return bnToString.call(this, b) + "L";
}

function chr(n) { return String.fromCharCode(n); }
function ord(c) { return c.charCodeAt(0); }

function map(f, l) {
  result = new Array(l.length);
  for (var i=0; i<l.length; i++) result[i]=f(l[i]);
  return result;
}

function bytes2string(bytes) { return map(chr, bytes).join(''); }

function string2bytes(s) { return map(ord, s); }

function bi2bytes(n, cnt) {
  if (cnt==undefined) cnt = (n.bitLength()>>3)+1;
  var bytes = new Array(cnt);
  for (var i = 0; i<cnt; i++) {
    bytes[i] = n[0]&255;           // n.and(xff);
    n = n.shiftRight(8);
  }
  return bytes;
}

function bytes2bi(bytes) {
  var n = bi('0');
  for (var i=bytes.length-1; i>-1; i--) {
    n = n.shiftLeft(8).or(bi(''+bytes[i]));
  }
  return n;
}

function hex2bi(s) { return new BigInteger(s, 16); }

// BigInteger construction done right
function bi(s, base) {
  if (base != undefined) {
    if (base == 256) return bytes2bi(string2bytes(s));
    return new BigInteger(s, base);
  } else if (typeof s == 'string') {
    return new BigInteger(s, 10);
  } else if (s instanceof Array) {
    return bytes2bi(s);
  } else if (typeof s == 'number') {
    return new BigInteger(s.toString(), 10);
  } else {
    throw "Can't convert " + s + " to BigInteger";
  }
}

function sha512(s) {                      // Requires jsSHA
  var shaObj = new jsSHA(s, "ASCII");
  return bi2bytes(hex2bi(shaObj.getHash("SHA-512", "HEX")), 64).reverse();
}

function inthash(s) {
  return bytes2bi(sha512(s));
}

function stringhash(s) {
  return bytes2string(sha512(s));
}


var zero = BigInteger.ZERO;
var one = BigInteger.ONE;
var two = bi('2');

BigInteger.prototype.times = BigInteger.prototype.multiply;
BigInteger.prototype.plus = BigInteger.prototype.add;
BigInteger.prototype.minus = BigInteger.prototype.subtract;
BigInteger.prototype.square = function () { return this.times(this); }


var xff = bi('255');
var b = bi('256');
var q = two.pow(bi('255')).minus(bi('19'));
var l = two.pow(252).add(bi('27742317777372353535851937790883648493'));

var k1 = two.pow(b.minus(two));
var k2 = two.pow(251).minus(one).shiftLeft(3);

function inv(n) { return n.mod(q).modInverse(q); }

var d = bi('-121665').times(inv(bi('121666'))).mod(q);
var i = two.modPow(q.minus(one).divide(bi('4')), q);

function xrecover(y) {
  var ysquared = y.times(y);
  var xx = ysquared.minus(one).times(inv(one.add(d.times(ysquared))));
  var x = xx.modPow(q.add(bi('3')).divide(bi('8')), q);
  if (!(x.times(x).minus(xx).mod(q).equals(zero))) {
    x = x.times(i).mod(q);
  }
  if (!(x.mod(two).equals(zero))) {
    x = q.minus(x);
  }
  return x;
}

var by = inv(bi('5')).times(bi('4')).mod(q);
var bx = xrecover(by);
var bp = [bx, by]

// Simple but slow version

function edwards(p1, p2) {
  var x1 = p1[0]; var y1 = p1[1]; var x2 = p2[0]; var y2 = p2[1];
  var k = d.times(x1).times(x2).times(y1).times(y2);
  var x3 = x1.times(y2).add(x2.times(y1)).times(inv(one.plus(k)));
  var y3 = y1.times(y2).add(x1.times(x2)).times(inv(one.minus(k)));
  return [x3.mod(q), y3.mod(q)];
}

function slow_scalarmult(p, e) {
  if (e.equals(zero)) return [zero, one];
  var _ = scalarmult(p, e.divide(two));
  _ = edwards(_,_)
  if (e.testBit(0)) return edwards(_, p);
  else return _;
}

// Faster (!) version based on:
// http://www.hyperelliptic.org/EFD/g1p/auto-twisted-extended-1.html

function xpt_add(pt1, pt2) {
  var x1 = pt1[0];
  var y1 = pt1[1];
  var z1 = pt1[2];
  var t1 = pt1[3];
  var x2 = pt2[0];
  var y2 = pt2[1];
  var z2 = pt2[2];
  var t2 = pt2[3];
  var A = y1.minus(x1).times(y2.plus(x2)).mod(q);
  var B = y1.plus(x1).times(y2.minus(x2)).mod(q);
  var C = z1.times(two).times(t2).mod(q);
  var D = t1.times(two).times(z2).mod(q);
  var E = D.plus(C);
  var F = B.minus(A);
  var G = B.plus(A);
  var H = D.minus(C);
  return [E.times(F).mod(q), G.times(H).mod(q),
	  F.times(G).mod(q), E.times(H).mod(q)];
}

function xpt_double(pt1) {
  var x1 = pt1[0];
  var y1 = pt1[1];
  var z1 = pt1[2];
  var A = x1.times(x1);
  var B = y1.times(y1);
  var C = two.times(z1).times(z1);
  var D = zero.minus(A).mod(q);
  var J = x1.plus(y1);
  var E = J.times(J).minus(A).minus(B);
  var G = D.plus(B);
  var F = G.minus(C);
  var H = D.minus(B);
  return [E.times(F).mod(q), G.times(H).mod(q),
	  F.times(G).mod(q), E.times(H).mod(q)];
}

function xpt_mult(pt, n) {
  if (n.equals(zero)) return [zero, one, one, zero];
  var _ = xpt_mult(pt, n.shiftRight(1));
  _ = xpt_double(_);
  if (n.testBit(0)) return xpt_add(_, pt);
  else return _;
}

function pt_xform(pt) {
  var x = pt[0];
  var y = pt[1];
  return [x, y, one, x.times(y).mod(q)]
}

function pt_unxform (pt) {
  var x = pt[0];
  var y = pt[1];
  var z = pt[2];
  var invz = inv(z);
  return [x.times(invz).mod(q), y.times(invz).mod(q)]
}

function scalarmult(pt, n) {
  return pt_unxform(xpt_mult(pt_xform(pt), n));
}

function encodeint(n) {
  return bi2bytes(n, 32);
}

function decodeint(a) {
  return bytes2bi(a);
}

function encodepoint(p) {
  var x = p[0];
  var y = p[1];
  return encodeint(y.add(x.and(one).shiftLeft(255)));
}

function publickey(sk) {
  var h = inthash(sk);
  var a = k1.add(k2.and(h));
  return encodepoint(scalarmult(bp, a));
}

function signature(m, sk, pk) {
  var hi = inthash(sk);
  var hs = stringhash(sk);
  var a = k1.add(k2.and(hi));
  var r = inthash(hs.slice(32,64) + m);
  var rp = scalarmult(bp, r);
  var s0 = inthash(bytes2string(encodepoint(rp)) + bytes2string(pk) + m)
  var s = r.add(a.times(s0)).mod(l);
  return encodepoint(rp).concat(encodeint(s));
}

function isoncurve(p) {
  var x = p[0];
  var y = p[1];
  var v = d.times(x).times(x).times(y).times(y).mod(q);
  return y.times(y).minus(x.times(x)).minus(one).minus(v).mod(q).equals(zero);
}

function decodeint(v) { return bytes2bi(v,32); }

function decodepoint(v) {
  var y = bytes2bi(v, 32).and(two.pow(xff).minus(one));
  x = xrecover(y);
  if ((x.testBit(0) ? 1 : 0) != v[31]>>7) x = q.minus(x);
  var p = [x,y];
  if (!isoncurve(p)) throw('Point is not on curve');
  return p;
}

function checksig(sig, msg, pk) {
  var r = decodepoint(sig.slice(0, 32));
  var a = decodepoint(pk);
  var s = decodeint(sig.slice(32, 64));
  var h = inthash(bytes2string(encodepoint(r).concat(pk)) + msg);
  var v1 = scalarmult(bp, s);
  var v2 = edwards(r, scalarmult(a, h));
  return v1[0].equals(v2[0]) && v1[1].equals(v2[1]);
}

function sig_test(msg) {
  var pk = publickey('foo');
  var sig = signature(msg, 'foo', pk);
  return checksig(sig, msg, pk);
}

///////////////////////////////////////////////////////
//
//  Curve25519 diffie-helman
//

function zpt_add(xz1, xz2, base) {
  var x1 = xz1[0];
  var x2 = xz2[0];
  var z1 = xz1[1];
  var z2 = xz2[1];
  var x = x2.times(x1).minus(z2.times(z1)).square().shiftLeft(2).mod(q);
  var z = x2.times(z1).minus(z2.times(x1)).square().shiftLeft(2).times(base).mod(q);
  return [x,z];
}

function zpt_double(xz) {
  var x = xz[0];
  var z = xz[1];
  var x1 = x.square().minus(z.square()).square().mod(q);
  var z1 = x.times(z).times(x.square().plus(bi('486662').times(x).times(z).plus(z.square()))).shiftLeft(2).mod(q)
  return [x1, z1]
}

function zpt_sm(n, base) {
  var bp = [base, one]
  var bp2 = zpt_double(bp);
  function f(m) {
    if (m.equals(one)) return [bp, bp2];
    var pm_pm1 = f(m.shiftRight(1));
    var pm = pm_pm1[0];
    var pm1 = pm_pm1[1];
    if (m.testBit(0)) return [zpt_add(pm, pm1, base), zpt_double(pm1)];
    else return [zpt_double(pm), zpt_add(pm, pm1, base)];
  }
  return f(n);
}

function curve25519(n, base) {
  base = base || bi('9');
  var xz_ = zpt_sm(n, base);
  var x = xz_[0][0];
  var z = xz_[0][1];
  return x.times(z.modInverse(q)).mod(q);
}

function dh_test(sk1, sk2) {
  pk1 = curve25519(sk1);
  pk2 = curve25519(sk2);
  return curve25519(sk1, pk2).equals(curve25519(sk2, pk1));
}
