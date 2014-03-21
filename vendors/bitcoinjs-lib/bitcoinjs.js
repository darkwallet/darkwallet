!function(e){"object"==typeof exports?module.exports=e():"function"==typeof define&&define.amd?define(e):"undefined"!=typeof window?window.Bitcoin=e():"undefined"!=typeof global?global.Bitcoin=e():"undefined"!=typeof self&&(self.Bitcoin=e())}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function(e,r){"object"==typeof exports?module.exports=exports=r(require("./core"),require("./enc-base64"),require("./md5"),require("./evpkdf"),require("./cipher-core")):"function"==typeof define&&define.amd?define(["./core","./enc-base64","./md5","./evpkdf","./cipher-core"],r):r(e.CryptoJS)})(this,function(e){return function(){var r=e,t=r.lib,i=t.BlockCipher,o=r.algo,n=[],c=[],s=[],a=[],f=[],u=[],h=[],p=[],d=[],l=[];(function(){for(var e=[],r=0;256>r;r++)e[r]=128>r?r<<1:283^r<<1;for(var t=0,i=0,r=0;256>r;r++){var o=i^i<<1^i<<2^i<<3^i<<4;o=99^(o>>>8^255&o),n[t]=o,c[o]=t;var y=e[t],v=e[y],m=e[v],x=257*e[o]^16843008*o;s[t]=x<<24|x>>>8,a[t]=x<<16|x>>>16,f[t]=x<<8|x>>>24,u[t]=x;var x=16843009*m^65537*v^257*y^16843008*t;h[o]=x<<24|x>>>8,p[o]=x<<16|x>>>16,d[o]=x<<8|x>>>24,l[o]=x,t?(t=y^e[e[e[m^y]]],i^=e[e[i]]):t=i=1}})();var y=[0,1,2,4,8,16,32,64,128,27,54],v=o.AES=i.extend({_doReset:function(){for(var e=this._key,r=e.words,t=e.sigBytes/4,i=this._nRounds=t+6,o=4*(i+1),c=this._keySchedule=[],s=0;o>s;s++)if(t>s)c[s]=r[s];else{var a=c[s-1];s%t?t>6&&4==s%t&&(a=n[a>>>24]<<24|n[255&a>>>16]<<16|n[255&a>>>8]<<8|n[255&a]):(a=a<<8|a>>>24,a=n[a>>>24]<<24|n[255&a>>>16]<<16|n[255&a>>>8]<<8|n[255&a],a^=y[0|s/t]<<24),c[s]=c[s-t]^a}for(var f=this._invKeySchedule=[],u=0;o>u;u++){var s=o-u;if(u%4)var a=c[s];else var a=c[s-4];f[u]=4>u||4>=s?a:h[n[a>>>24]]^p[n[255&a>>>16]]^d[n[255&a>>>8]]^l[n[255&a]]}},encryptBlock:function(e,r){this._doCryptBlock(e,r,this._keySchedule,s,a,f,u,n)},decryptBlock:function(e,r){var t=e[r+1];e[r+1]=e[r+3],e[r+3]=t,this._doCryptBlock(e,r,this._invKeySchedule,h,p,d,l,c);var t=e[r+1];e[r+1]=e[r+3],e[r+3]=t},_doCryptBlock:function(e,r,t,i,o,n,c,s){for(var a=this._nRounds,f=e[r]^t[0],u=e[r+1]^t[1],h=e[r+2]^t[2],p=e[r+3]^t[3],d=4,l=1;a>l;l++){var y=i[f>>>24]^o[255&u>>>16]^n[255&h>>>8]^c[255&p]^t[d++],v=i[u>>>24]^o[255&h>>>16]^n[255&p>>>8]^c[255&f]^t[d++],m=i[h>>>24]^o[255&p>>>16]^n[255&f>>>8]^c[255&u]^t[d++],x=i[p>>>24]^o[255&f>>>16]^n[255&u>>>8]^c[255&h]^t[d++];f=y,u=v,h=m,p=x}var y=(s[f>>>24]<<24|s[255&u>>>16]<<16|s[255&h>>>8]<<8|s[255&p])^t[d++],v=(s[u>>>24]<<24|s[255&h>>>16]<<16|s[255&p>>>8]<<8|s[255&f])^t[d++],m=(s[h>>>24]<<24|s[255&p>>>16]<<16|s[255&f>>>8]<<8|s[255&u])^t[d++],x=(s[p>>>24]<<24|s[255&f>>>16]<<16|s[255&u>>>8]<<8|s[255&h])^t[d++];e[r]=y,e[r+1]=v,e[r+2]=m,e[r+3]=x},keySize:8});r.AES=i._createHelper(v)}(),e.AES});
},{"./cipher-core":2,"./core":3,"./enc-base64":4,"./evpkdf":6,"./md5":12}],2:[function(require,module,exports){
(function(e,r){"object"==typeof exports?module.exports=exports=r(require("./core")):"function"==typeof define&&define.amd?define(["./core"],r):r(e.CryptoJS)})(this,function(e){e.lib.Cipher||function(r){var t=e,i=t.lib,n=i.Base,o=i.WordArray,c=i.BufferedBlockAlgorithm,s=t.enc;s.Utf8;var a=s.Base64,f=t.algo,u=f.EvpKDF,h=i.Cipher=c.extend({cfg:n.extend(),createEncryptor:function(e,r){return this.create(this._ENC_XFORM_MODE,e,r)},createDecryptor:function(e,r){return this.create(this._DEC_XFORM_MODE,e,r)},init:function(e,r,t){this.cfg=this.cfg.extend(t),this._xformMode=e,this._key=r,this.reset()},reset:function(){c.reset.call(this),this._doReset()},process:function(e){return this._append(e),this._process()},finalize:function(e){e&&this._append(e);var r=this._doFinalize();return r},keySize:4,ivSize:4,_ENC_XFORM_MODE:1,_DEC_XFORM_MODE:2,_createHelper:function(){function e(e){return"string"==typeof e?B:_}return function(r){return{encrypt:function(t,i,n){return e(i).encrypt(r,t,i,n)},decrypt:function(t,i,n){return e(i).decrypt(r,t,i,n)}}}}()});i.StreamCipher=h.extend({_doFinalize:function(){var e=this._process(true);return e},blockSize:1});var d=t.mode={},p=i.BlockCipherMode=n.extend({createEncryptor:function(e,r){return this.Encryptor.create(e,r)},createDecryptor:function(e,r){return this.Decryptor.create(e,r)},init:function(e,r){this._cipher=e,this._iv=r}}),l=d.CBC=function(){function e(e,t,i){var n=this._iv;if(n){var o=n;this._iv=r}else var o=this._prevBlock;for(var c=0;i>c;c++)e[t+c]^=o[c]}var t=p.extend();return t.Encryptor=t.extend({processBlock:function(r,t){var i=this._cipher,n=i.blockSize;e.call(this,r,t,n),i.encryptBlock(r,t),this._prevBlock=r.slice(t,t+n)}}),t.Decryptor=t.extend({processBlock:function(r,t){var i=this._cipher,n=i.blockSize,o=r.slice(t,t+n);i.decryptBlock(r,t),e.call(this,r,t,n),this._prevBlock=o}}),t}(),y=t.pad={},v=y.Pkcs7={pad:function(e,r){for(var t=4*r,i=t-e.sigBytes%t,n=i<<24|i<<16|i<<8|i,c=[],s=0;i>s;s+=4)c.push(n);var a=o.create(c,i);e.concat(a)},unpad:function(e){var r=255&e.words[e.sigBytes-1>>>2];e.sigBytes-=r}};i.BlockCipher=h.extend({cfg:h.cfg.extend({mode:l,padding:v}),reset:function(){h.reset.call(this);var e=this.cfg,r=e.iv,t=e.mode;if(this._xformMode==this._ENC_XFORM_MODE)var i=t.createEncryptor;else{var i=t.createDecryptor;this._minBufferSize=1}this._mode=i.call(t,this,r&&r.words)},_doProcessBlock:function(e,r){this._mode.processBlock(e,r)},_doFinalize:function(){var e=this.cfg.padding;if(this._xformMode==this._ENC_XFORM_MODE){e.pad(this._data,this.blockSize);var r=this._process(true)}else{var r=this._process(true);e.unpad(r)}return r},blockSize:4});var m=i.CipherParams=n.extend({init:function(e){this.mixIn(e)},toString:function(e){return(e||this.formatter).stringify(this)}}),g=t.format={},x=g.OpenSSL={stringify:function(e){var r=e.ciphertext,t=e.salt;if(t)var i=o.create([1398893684,1701076831]).concat(t).concat(r);else var i=r;return i.toString(a)},parse:function(e){var r=a.parse(e),t=r.words;if(1398893684==t[0]&&1701076831==t[1]){var i=o.create(t.slice(2,4));t.splice(0,4),r.sigBytes-=16}return m.create({ciphertext:r,salt:i})}},_=i.SerializableCipher=n.extend({cfg:n.extend({format:x}),encrypt:function(e,r,t,i){i=this.cfg.extend(i);var n=e.createEncryptor(t,i),o=n.finalize(r),c=n.cfg;return m.create({ciphertext:o,key:t,iv:c.iv,algorithm:e,mode:c.mode,padding:c.padding,blockSize:e.blockSize,formatter:i.format})},decrypt:function(e,r,t,i){i=this.cfg.extend(i),r=this._parse(r,i.format);var n=e.createDecryptor(t,i).finalize(r.ciphertext);return n},_parse:function(e,r){return"string"==typeof e?r.parse(e,this):e}}),w=t.kdf={},S=w.OpenSSL={execute:function(e,r,t,i){i||(i=o.random(8));var n=u.create({keySize:r+t}).compute(e,i),c=o.create(n.words.slice(r),4*t);return n.sigBytes=4*r,m.create({key:n,iv:c,salt:i})}},B=i.PasswordBasedCipher=_.extend({cfg:_.cfg.extend({kdf:S}),encrypt:function(e,r,t,i){i=this.cfg.extend(i);var n=i.kdf.execute(t,e.keySize,e.ivSize);i.iv=n.iv;var o=_.encrypt.call(this,e,r,n.key,i);return o.mixIn(n),o},decrypt:function(e,r,t,i){i=this.cfg.extend(i),r=this._parse(r,i.format);var n=i.kdf.execute(t,e.keySize,e.ivSize,r.salt);i.iv=n.iv;var o=_.decrypt.call(this,e,r,n.key,i);return o}})}()});
},{"./core":3}],3:[function(require,module,exports){
(function(e,r){"object"==typeof exports?module.exports=exports=r():"function"==typeof define&&define.amd?define([],r):e.CryptoJS=r()})(this,function(){var e=e||function(e,r){var t={},i=t.lib={},n=i.Base=function(){function e(){}return{extend:function(r){e.prototype=this;var t=new e;return r&&t.mixIn(r),t.hasOwnProperty("init")||(t.init=function(){t.$super.init.apply(this,arguments)}),t.init.prototype=t,t.$super=this,t},create:function(){var e=this.extend();return e.init.apply(e,arguments),e},init:function(){},mixIn:function(e){for(var r in e)e.hasOwnProperty(r)&&(this[r]=e[r]);e.hasOwnProperty("toString")&&(this.toString=e.toString)},clone:function(){return this.init.prototype.extend(this)}}}(),o=i.WordArray=n.extend({init:function(e,t){e=this.words=e||[],this.sigBytes=t!=r?t:4*e.length},toString:function(e){return(e||s).stringify(this)},concat:function(e){var r=this.words,t=e.words,i=this.sigBytes,n=e.sigBytes;if(this.clamp(),i%4)for(var o=0;n>o;o++){var c=255&t[o>>>2]>>>24-8*(o%4);r[i+o>>>2]|=c<<24-8*((i+o)%4)}else if(t.length>65535)for(var o=0;n>o;o+=4)r[i+o>>>2]=t[o>>>2];else r.push.apply(r,t);return this.sigBytes+=n,this},clamp:function(){var r=this.words,t=this.sigBytes;r[t>>>2]&=4294967295<<32-8*(t%4),r.length=e.ceil(t/4)},clone:function(){var e=n.clone.call(this);return e.words=this.words.slice(0),e},random:function(r){for(var t=[],i=0;r>i;i+=4)t.push(0|4294967296*e.random());return new o.init(t,r)}}),c=t.enc={},s=c.Hex={stringify:function(e){for(var r=e.words,t=e.sigBytes,i=[],n=0;t>n;n++){var o=255&r[n>>>2]>>>24-8*(n%4);i.push((o>>>4).toString(16)),i.push((15&o).toString(16))}return i.join("")},parse:function(e){for(var r=e.length,t=[],i=0;r>i;i+=2)t[i>>>3]|=parseInt(e.substr(i,2),16)<<24-4*(i%8);return new o.init(t,r/2)}},u=c.Latin1={stringify:function(e){for(var r=e.words,t=e.sigBytes,i=[],n=0;t>n;n++){var o=255&r[n>>>2]>>>24-8*(n%4);i.push(String.fromCharCode(o))}return i.join("")},parse:function(e){for(var r=e.length,t=[],i=0;r>i;i++)t[i>>>2]|=(255&e.charCodeAt(i))<<24-8*(i%4);return new o.init(t,r)}},f=c.Utf8={stringify:function(e){try{return decodeURIComponent(escape(u.stringify(e)))}catch(r){throw Error("Malformed UTF-8 data")}},parse:function(e){return u.parse(unescape(encodeURIComponent(e)))}},a=i.BufferedBlockAlgorithm=n.extend({reset:function(){this._data=new o.init,this._nDataBytes=0},_append:function(e){"string"==typeof e&&(e=f.parse(e)),this._data.concat(e),this._nDataBytes+=e.sigBytes},_process:function(r){var t=this._data,i=t.words,n=t.sigBytes,c=this.blockSize,s=4*c,u=n/s;u=r?e.ceil(u):e.max((0|u)-this._minBufferSize,0);var f=u*c,a=e.min(4*f,n);if(f){for(var p=0;f>p;p+=c)this._doProcessBlock(i,p);var d=i.splice(0,f);t.sigBytes-=a}return new o.init(d,a)},clone:function(){var e=n.clone.call(this);return e._data=this._data.clone(),e},_minBufferSize:0});i.Hasher=a.extend({cfg:n.extend(),init:function(e){this.cfg=this.cfg.extend(e),this.reset()},reset:function(){a.reset.call(this),this._doReset()},update:function(e){return this._append(e),this._process(),this},finalize:function(e){e&&this._append(e);var r=this._doFinalize();return r},blockSize:16,_createHelper:function(e){return function(r,t){return new e.init(t).finalize(r)}},_createHmacHelper:function(e){return function(r,t){return new p.HMAC.init(e,t).finalize(r)}}});var p=t.algo={};return t}(Math);return e});
},{}],4:[function(require,module,exports){
(function(e,r){"object"==typeof exports?module.exports=exports=r(require("./core")):"function"==typeof define&&define.amd?define(["./core"],r):r(e.CryptoJS)})(this,function(e){return function(){var r=e,t=r.lib,n=t.WordArray,i=r.enc;i.Base64={stringify:function(e){var r=e.words,t=e.sigBytes,n=this._map;e.clamp();for(var i=[],o=0;t>o;o+=3)for(var s=255&r[o>>>2]>>>24-8*(o%4),c=255&r[o+1>>>2]>>>24-8*((o+1)%4),a=255&r[o+2>>>2]>>>24-8*((o+2)%4),f=s<<16|c<<8|a,u=0;4>u&&t>o+.75*u;u++)i.push(n.charAt(63&f>>>6*(3-u)));var d=n.charAt(64);if(d)for(;i.length%4;)i.push(d);return i.join("")},parse:function(e){var r=e.length,t=this._map,i=t.charAt(64);if(i){var o=e.indexOf(i);-1!=o&&(r=o)}for(var s=[],c=0,a=0;r>a;a++)if(a%4){var f=t.indexOf(e.charAt(a-1))<<2*(a%4),u=t.indexOf(e.charAt(a))>>>6-2*(a%4);s[c>>>2]|=(f|u)<<24-8*(c%4),c++}return n.create(s,c)},_map:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/="}}(),e.enc.Base64});
},{"./core":3}],5:[function(require,module,exports){
(function(e,r){"object"==typeof exports?module.exports=exports=r(require("./core")):"function"==typeof define&&define.amd?define(["./core"],r):r(e.CryptoJS)})(this,function(e){return function(){function r(e){return 4278255360&e<<8|16711935&e>>>8}var t=e,n=t.lib,i=n.WordArray,o=t.enc;o.Utf16=o.Utf16BE={stringify:function(e){for(var r=e.words,t=e.sigBytes,n=[],i=0;t>i;i+=2){var o=65535&r[i>>>2]>>>16-8*(i%4);n.push(String.fromCharCode(o))}return n.join("")},parse:function(e){for(var r=e.length,t=[],n=0;r>n;n++)t[n>>>1]|=e.charCodeAt(n)<<16-16*(n%2);return i.create(t,2*r)}},o.Utf16LE={stringify:function(e){for(var t=e.words,n=e.sigBytes,i=[],o=0;n>o;o+=2){var c=r(65535&t[o>>>2]>>>16-8*(o%4));i.push(String.fromCharCode(c))}return i.join("")},parse:function(e){for(var t=e.length,n=[],o=0;t>o;o++)n[o>>>1]|=r(e.charCodeAt(o)<<16-16*(o%2));return i.create(n,2*t)}}}(),e.enc.Utf16});
},{"./core":3}],6:[function(require,module,exports){
(function(e,r){"object"==typeof exports?module.exports=exports=r(require("./core"),require("./sha1"),require("./hmac")):"function"==typeof define&&define.amd?define(["./core","./sha1","./hmac"],r):r(e.CryptoJS)})(this,function(e){return function(){var r=e,t=r.lib,i=t.Base,n=t.WordArray,o=r.algo,s=o.MD5,a=o.EvpKDF=i.extend({cfg:i.extend({keySize:4,hasher:s,iterations:1}),init:function(e){this.cfg=this.cfg.extend(e)},compute:function(e,r){for(var t=this.cfg,i=t.hasher.create(),o=n.create(),s=o.words,a=t.keySize,c=t.iterations;a>s.length;){f&&i.update(f);var f=i.update(e).finalize(r);i.reset();for(var u=1;c>u;u++)f=i.finalize(f),i.reset();o.concat(f)}return o.sigBytes=4*a,o}});r.EvpKDF=function(e,r,t){return a.create(t).compute(e,r)}}(),e.EvpKDF});
},{"./core":3,"./hmac":9,"./sha1":28}],7:[function(require,module,exports){
(function(e,r){"object"==typeof exports?module.exports=exports=r(require("./core"),require("./cipher-core")):"function"==typeof define&&define.amd?define(["./core","./cipher-core"],r):r(e.CryptoJS)})(this,function(e){return function(){var r=e,t=r.lib,i=t.CipherParams,o=r.enc,n=o.Hex,c=r.format;c.Hex={stringify:function(e){return e.ciphertext.toString(n)},parse:function(e){var r=n.parse(e);return i.create({ciphertext:r})}}}(),e.format.Hex});
},{"./cipher-core":2,"./core":3}],8:[function(require,module,exports){
(function(e,r){"object"==typeof exports?module.exports=exports=r(require("./core"),require("./sha256"),require("./hmac")):"function"==typeof define&&define.amd?define(["./core","./sha256","./hmac"],r):r(e.CryptoJS)})(this,function(e){return e.HmacSHA256});
},{"./core":3,"./hmac":9,"./sha256":30}],9:[function(require,module,exports){
(function(e,r){"object"==typeof exports?module.exports=exports=r(require("./core")):"function"==typeof define&&define.amd?define(["./core"],r):r(e.CryptoJS)})(this,function(e){(function(){var r=e,t=r.lib,n=t.Base,i=r.enc,o=i.Utf8,s=r.algo;s.HMAC=n.extend({init:function(e,r){e=this._hasher=new e.init,"string"==typeof r&&(r=o.parse(r));var t=e.blockSize,n=4*t;r.sigBytes>n&&(r=e.finalize(r)),r.clamp();for(var i=this._oKey=r.clone(),s=this._iKey=r.clone(),a=i.words,c=s.words,f=0;t>f;f++)a[f]^=1549556828,c[f]^=909522486;i.sigBytes=s.sigBytes=n,this.reset()},reset:function(){var e=this._hasher;e.reset(),e.update(this._iKey)},update:function(e){return this._hasher.update(e),this},finalize:function(e){var r=this._hasher,t=r.finalize(e);r.reset();var n=r.finalize(this._oKey.clone().concat(t));return n}})})()});
},{"./core":3}],10:[function(require,module,exports){
(function(e,r){"object"==typeof exports?module.exports=exports=r(require("./core"),require("./x64-core"),require("./lib-typedarrays"),require("./enc-utf16"),require("./enc-base64"),require("./md5"),require("./sha1"),require("./sha256"),require("./sha224"),require("./sha512"),require("./sha384"),require("./sha3"),require("./ripemd160"),require("./hmac"),require("./pbkdf2"),require("./evpkdf"),require("./cipher-core"),require("./mode-cfb"),require("./mode-ctr"),require("./mode-ctr-gladman"),require("./mode-ofb"),require("./mode-ecb"),require("./pad-ansix923"),require("./pad-iso10126"),require("./pad-iso97971"),require("./pad-zeropadding"),require("./pad-nopadding"),require("./format-hex"),require("./aes"),require("./tripledes"),require("./rc4"),require("./rabbit"),require("./rabbit-legacy")):"function"==typeof define&&define.amd?define(["./core","./x64-core","./lib-typedarrays","./enc-utf16","./enc-base64","./md5","./sha1","./sha256","./sha224","./sha512","./sha384","./sha3","./ripemd160","./hmac","./pbkdf2","./evpkdf","./cipher-core","./mode-cfb","./mode-ctr","./mode-ctr-gladman","./mode-ofb","./mode-ecb","./pad-ansix923","./pad-iso10126","./pad-iso97971","./pad-zeropadding","./pad-nopadding","./format-hex","./aes","./tripledes","./rc4","./rabbit","./rabbit-legacy"],r):r(e.CryptoJS)})(this,function(e){return e});
},{"./aes":1,"./cipher-core":2,"./core":3,"./enc-base64":4,"./enc-utf16":5,"./evpkdf":6,"./format-hex":7,"./hmac":9,"./lib-typedarrays":11,"./md5":12,"./mode-cfb":13,"./mode-ctr":15,"./mode-ctr-gladman":14,"./mode-ecb":16,"./mode-ofb":17,"./pad-ansix923":18,"./pad-iso10126":19,"./pad-iso97971":20,"./pad-nopadding":21,"./pad-zeropadding":22,"./pbkdf2":23,"./rabbit":25,"./rabbit-legacy":24,"./rc4":26,"./ripemd160":27,"./sha1":28,"./sha224":29,"./sha256":30,"./sha3":31,"./sha384":32,"./sha512":33,"./tripledes":34,"./x64-core":35}],11:[function(require,module,exports){
(function(e,r){"object"==typeof exports?module.exports=exports=r(require("./core")):"function"==typeof define&&define.amd?define(["./core"],r):r(e.CryptoJS)})(this,function(e){return function(){if("function"==typeof ArrayBuffer){var r=e,t=r.lib,i=t.WordArray,n=i.init,o=i.init=function(e){if(e instanceof ArrayBuffer&&(e=new Uint8Array(e)),(e instanceof Int8Array||e instanceof Uint8ClampedArray||e instanceof Int16Array||e instanceof Uint16Array||e instanceof Int32Array||e instanceof Uint32Array||e instanceof Float32Array||e instanceof Float64Array)&&(e=new Uint8Array(e.buffer,e.byteOffset,e.byteLength)),e instanceof Uint8Array){for(var r=e.byteLength,t=[],i=0;r>i;i++)t[i>>>2]|=e[i]<<24-8*(i%4);n.call(this,t,r)}else n.apply(this,arguments)};o.prototype=i}}(),e.lib.WordArray});
},{"./core":3}],12:[function(require,module,exports){
(function(e,r){"object"==typeof exports?module.exports=exports=r(require("./core")):"function"==typeof define&&define.amd?define(["./core"],r):r(e.CryptoJS)})(this,function(e){return function(r){function t(e,r,t,n,i,o,s){var c=e+(r&t|~r&n)+i+s;return(c<<o|c>>>32-o)+r}function n(e,r,t,n,i,o,s){var c=e+(r&n|t&~n)+i+s;return(c<<o|c>>>32-o)+r}function i(e,r,t,n,i,o,s){var c=e+(r^t^n)+i+s;return(c<<o|c>>>32-o)+r}function o(e,r,t,n,i,o,s){var c=e+(t^(r|~n))+i+s;return(c<<o|c>>>32-o)+r}var s=e,c=s.lib,f=c.WordArray,a=c.Hasher,u=s.algo,p=[];(function(){for(var e=0;64>e;e++)p[e]=0|4294967296*r.abs(r.sin(e+1))})();var d=u.MD5=a.extend({_doReset:function(){this._hash=new f.init([1732584193,4023233417,2562383102,271733878])},_doProcessBlock:function(e,r){for(var s=0;16>s;s++){var c=r+s,f=e[c];e[c]=16711935&(f<<8|f>>>24)|4278255360&(f<<24|f>>>8)}var a=this._hash.words,u=e[r+0],d=e[r+1],h=e[r+2],y=e[r+3],m=e[r+4],l=e[r+5],x=e[r+6],q=e[r+7],g=e[r+8],v=e[r+9],b=e[r+10],S=e[r+11],w=e[r+12],C=e[r+13],_=e[r+14],A=e[r+15],B=a[0],H=a[1],j=a[2],J=a[3];B=t(B,H,j,J,u,7,p[0]),J=t(J,B,H,j,d,12,p[1]),j=t(j,J,B,H,h,17,p[2]),H=t(H,j,J,B,y,22,p[3]),B=t(B,H,j,J,m,7,p[4]),J=t(J,B,H,j,l,12,p[5]),j=t(j,J,B,H,x,17,p[6]),H=t(H,j,J,B,q,22,p[7]),B=t(B,H,j,J,g,7,p[8]),J=t(J,B,H,j,v,12,p[9]),j=t(j,J,B,H,b,17,p[10]),H=t(H,j,J,B,S,22,p[11]),B=t(B,H,j,J,w,7,p[12]),J=t(J,B,H,j,C,12,p[13]),j=t(j,J,B,H,_,17,p[14]),H=t(H,j,J,B,A,22,p[15]),B=n(B,H,j,J,d,5,p[16]),J=n(J,B,H,j,x,9,p[17]),j=n(j,J,B,H,S,14,p[18]),H=n(H,j,J,B,u,20,p[19]),B=n(B,H,j,J,l,5,p[20]),J=n(J,B,H,j,b,9,p[21]),j=n(j,J,B,H,A,14,p[22]),H=n(H,j,J,B,m,20,p[23]),B=n(B,H,j,J,v,5,p[24]),J=n(J,B,H,j,_,9,p[25]),j=n(j,J,B,H,y,14,p[26]),H=n(H,j,J,B,g,20,p[27]),B=n(B,H,j,J,C,5,p[28]),J=n(J,B,H,j,h,9,p[29]),j=n(j,J,B,H,q,14,p[30]),H=n(H,j,J,B,w,20,p[31]),B=i(B,H,j,J,l,4,p[32]),J=i(J,B,H,j,g,11,p[33]),j=i(j,J,B,H,S,16,p[34]),H=i(H,j,J,B,_,23,p[35]),B=i(B,H,j,J,d,4,p[36]),J=i(J,B,H,j,m,11,p[37]),j=i(j,J,B,H,q,16,p[38]),H=i(H,j,J,B,b,23,p[39]),B=i(B,H,j,J,C,4,p[40]),J=i(J,B,H,j,u,11,p[41]),j=i(j,J,B,H,y,16,p[42]),H=i(H,j,J,B,x,23,p[43]),B=i(B,H,j,J,v,4,p[44]),J=i(J,B,H,j,w,11,p[45]),j=i(j,J,B,H,A,16,p[46]),H=i(H,j,J,B,h,23,p[47]),B=o(B,H,j,J,u,6,p[48]),J=o(J,B,H,j,q,10,p[49]),j=o(j,J,B,H,_,15,p[50]),H=o(H,j,J,B,l,21,p[51]),B=o(B,H,j,J,w,6,p[52]),J=o(J,B,H,j,y,10,p[53]),j=o(j,J,B,H,b,15,p[54]),H=o(H,j,J,B,d,21,p[55]),B=o(B,H,j,J,g,6,p[56]),J=o(J,B,H,j,A,10,p[57]),j=o(j,J,B,H,x,15,p[58]),H=o(H,j,J,B,C,21,p[59]),B=o(B,H,j,J,m,6,p[60]),J=o(J,B,H,j,S,10,p[61]),j=o(j,J,B,H,h,15,p[62]),H=o(H,j,J,B,v,21,p[63]),a[0]=0|a[0]+B,a[1]=0|a[1]+H,a[2]=0|a[2]+j,a[3]=0|a[3]+J},_doFinalize:function(){var e=this._data,t=e.words,n=8*this._nDataBytes,i=8*e.sigBytes;t[i>>>5]|=128<<24-i%32;var o=r.floor(n/4294967296),s=n;t[(i+64>>>9<<4)+15]=16711935&(o<<8|o>>>24)|4278255360&(o<<24|o>>>8),t[(i+64>>>9<<4)+14]=16711935&(s<<8|s>>>24)|4278255360&(s<<24|s>>>8),e.sigBytes=4*(t.length+1),this._process();for(var c=this._hash,f=c.words,a=0;4>a;a++){var u=f[a];f[a]=16711935&(u<<8|u>>>24)|4278255360&(u<<24|u>>>8)}return c},clone:function(){var e=a.clone.call(this);return e._hash=this._hash.clone(),e}});s.MD5=a._createHelper(d),s.HmacMD5=a._createHmacHelper(d)}(Math),e.MD5});
},{"./core":3}],13:[function(require,module,exports){
(function(e,r){"object"==typeof exports?module.exports=exports=r(require("./core"),require("./cipher-core")):"function"==typeof define&&define.amd?define(["./core","./cipher-core"],r):r(e.CryptoJS)})(this,function(e){return e.mode.CFB=function(){function r(e,r,t,i){var o=this._iv;if(o){var n=o.slice(0);this._iv=void 0}else var n=this._prevBlock;i.encryptBlock(n,0);for(var s=0;t>s;s++)e[r+s]^=n[s]}var t=e.lib.BlockCipherMode.extend();return t.Encryptor=t.extend({processBlock:function(e,t){var i=this._cipher,o=i.blockSize;r.call(this,e,t,o,i),this._prevBlock=e.slice(t,t+o)}}),t.Decryptor=t.extend({processBlock:function(e,t){var i=this._cipher,o=i.blockSize,n=e.slice(t,t+o);r.call(this,e,t,o,i),this._prevBlock=n}}),t}(),e.mode.CFB});
},{"./cipher-core":2,"./core":3}],14:[function(require,module,exports){
(function(e,r){"object"==typeof exports?module.exports=exports=r(require("./core"),require("./cipher-core")):"function"==typeof define&&define.amd?define(["./core","./cipher-core"],r):r(e.CryptoJS)})(this,function(e){return e.mode.CTRGladman=function(){function r(e){if(255===(255&e>>24)){var r=255&e>>16,t=255&e>>8,i=255&e;255===r?(r=0,255===t?(t=0,255===i?i=0:++i):++t):++r,e=0,e+=r<<16,e+=t<<8,e+=i}else e+=1<<24;return e}function t(e){return 0===(e[0]=r(e[0]))&&(e[1]=r(e[1])),e}var i=e.lib.BlockCipherMode.extend(),n=i.Encryptor=i.extend({processBlock:function(e,r){var i=this._cipher,n=i.blockSize,o=this._iv,c=this._counter;o&&(c=this._counter=o.slice(0),this._iv=void 0),t(c);var s=c.slice(0);i.encryptBlock(s,0);for(var a=0;n>a;a++)e[r+a]^=s[a]}});return i.Decryptor=n,i}(),e.mode.CTRGladman});
},{"./cipher-core":2,"./core":3}],15:[function(require,module,exports){
(function(e,r){"object"==typeof exports?module.exports=exports=r(require("./core"),require("./cipher-core")):"function"==typeof define&&define.amd?define(["./core","./cipher-core"],r):r(e.CryptoJS)})(this,function(e){return e.mode.CTR=function(){var r=e.lib.BlockCipherMode.extend(),t=r.Encryptor=r.extend({processBlock:function(e,r){var t=this._cipher,i=t.blockSize,o=this._iv,n=this._counter;o&&(n=this._counter=o.slice(0),this._iv=void 0);var c=n.slice(0);t.encryptBlock(c,0),n[i-1]=0|n[i-1]+1;for(var s=0;i>s;s++)e[r+s]^=c[s]}});return r.Decryptor=t,r}(),e.mode.CTR});
},{"./cipher-core":2,"./core":3}],16:[function(require,module,exports){
(function(e,r){"object"==typeof exports?module.exports=exports=r(require("./core"),require("./cipher-core")):"function"==typeof define&&define.amd?define(["./core","./cipher-core"],r):r(e.CryptoJS)})(this,function(e){return e.mode.ECB=function(){var r=e.lib.BlockCipherMode.extend();return r.Encryptor=r.extend({processBlock:function(e,r){this._cipher.encryptBlock(e,r)}}),r.Decryptor=r.extend({processBlock:function(e,r){this._cipher.decryptBlock(e,r)}}),r}(),e.mode.ECB});
},{"./cipher-core":2,"./core":3}],17:[function(require,module,exports){
(function(e,r){"object"==typeof exports?module.exports=exports=r(require("./core"),require("./cipher-core")):"function"==typeof define&&define.amd?define(["./core","./cipher-core"],r):r(e.CryptoJS)})(this,function(e){return e.mode.OFB=function(){var r=e.lib.BlockCipherMode.extend(),t=r.Encryptor=r.extend({processBlock:function(e,r){var t=this._cipher,i=t.blockSize,n=this._iv,o=this._keystream;n&&(o=this._keystream=n.slice(0),this._iv=void 0),t.encryptBlock(o,0);for(var c=0;i>c;c++)e[r+c]^=o[c]}});return r.Decryptor=t,r}(),e.mode.OFB});
},{"./cipher-core":2,"./core":3}],18:[function(require,module,exports){
(function(e,r){"object"==typeof exports?module.exports=exports=r(require("./core"),require("./cipher-core")):"function"==typeof define&&define.amd?define(["./core","./cipher-core"],r):r(e.CryptoJS)})(this,function(e){return e.pad.AnsiX923={pad:function(e,r){var t=e.sigBytes,i=4*r,n=i-t%i,o=t+n-1;e.clamp(),e.words[o>>>2]|=n<<24-8*(o%4),e.sigBytes+=n},unpad:function(e){var r=255&e.words[e.sigBytes-1>>>2];e.sigBytes-=r}},e.pad.Ansix923});
},{"./cipher-core":2,"./core":3}],19:[function(require,module,exports){
(function(e,r){"object"==typeof exports?module.exports=exports=r(require("./core"),require("./cipher-core")):"function"==typeof define&&define.amd?define(["./core","./cipher-core"],r):r(e.CryptoJS)})(this,function(e){return e.pad.Iso10126={pad:function(r,t){var i=4*t,o=i-r.sigBytes%i;r.concat(e.lib.WordArray.random(o-1)).concat(e.lib.WordArray.create([o<<24],1))},unpad:function(e){var r=255&e.words[e.sigBytes-1>>>2];e.sigBytes-=r}},e.pad.Iso10126});
},{"./cipher-core":2,"./core":3}],20:[function(require,module,exports){
(function(e,r){"object"==typeof exports?module.exports=exports=r(require("./core"),require("./cipher-core")):"function"==typeof define&&define.amd?define(["./core","./cipher-core"],r):r(e.CryptoJS)})(this,function(e){return e.pad.Iso97971={pad:function(r,t){r.concat(e.lib.WordArray.create([2147483648],1)),e.pad.ZeroPadding.pad(r,t)},unpad:function(r){e.pad.ZeroPadding.unpad(r),r.sigBytes--}},e.pad.Iso97971});
},{"./cipher-core":2,"./core":3}],21:[function(require,module,exports){
(function(e,r){"object"==typeof exports?module.exports=exports=r(require("./core"),require("./cipher-core")):"function"==typeof define&&define.amd?define(["./core","./cipher-core"],r):r(e.CryptoJS)})(this,function(e){return e.pad.NoPadding={pad:function(){},unpad:function(){}},e.pad.NoPadding});
},{"./cipher-core":2,"./core":3}],22:[function(require,module,exports){
(function(e,r){"object"==typeof exports?module.exports=exports=r(require("./core"),require("./cipher-core")):"function"==typeof define&&define.amd?define(["./core","./cipher-core"],r):r(e.CryptoJS)})(this,function(e){return e.pad.ZeroPadding={pad:function(e,r){var t=4*r;e.clamp(),e.sigBytes+=t-(e.sigBytes%t||t)},unpad:function(e){for(var r=e.words,t=e.sigBytes-1;!(255&r[t>>>2]>>>24-8*(t%4));)t--;e.sigBytes=t+1}},e.pad.ZeroPadding});
},{"./cipher-core":2,"./core":3}],23:[function(require,module,exports){
(function(e,r){"object"==typeof exports?module.exports=exports=r(require("./core"),require("./sha1"),require("./hmac")):"function"==typeof define&&define.amd?define(["./core","./sha1","./hmac"],r):r(e.CryptoJS)})(this,function(e){return function(){var r=e,t=r.lib,n=t.Base,i=t.WordArray,o=r.algo,a=o.SHA1,s=o.HMAC,c=o.PBKDF2=n.extend({cfg:n.extend({keySize:4,hasher:a,iterations:1}),init:function(e){this.cfg=this.cfg.extend(e)},compute:function(e,r){for(var t=this.cfg,n=s.create(t.hasher,e),o=i.create(),a=i.create([1]),c=o.words,f=a.words,u=t.keySize,h=t.iterations;u>c.length;){var d=n.update(r).finalize(a);n.reset();for(var p=d.words,l=p.length,y=d,m=1;h>m;m++){y=n.finalize(y),n.reset();for(var g=y.words,v=0;l>v;v++)p[v]^=g[v]}o.concat(d),f[0]++}return o.sigBytes=4*u,o}});r.PBKDF2=function(e,r,t){return c.create(t).compute(e,r)}}(),e.PBKDF2});
},{"./core":3,"./hmac":9,"./sha1":28}],24:[function(require,module,exports){
(function(e,r){"object"==typeof exports?module.exports=exports=r(require("./core"),require("./enc-base64"),require("./md5"),require("./evpkdf"),require("./cipher-core")):"function"==typeof define&&define.amd?define(["./core","./enc-base64","./md5","./evpkdf","./cipher-core"],r):r(e.CryptoJS)})(this,function(e){return function(){function r(){for(var e=this._X,r=this._C,t=0;8>t;t++)s[t]=r[t];r[0]=0|r[0]+1295307597+this._b,r[1]=0|r[1]+3545052371+(r[0]>>>0<s[0]>>>0?1:0),r[2]=0|r[2]+886263092+(r[1]>>>0<s[1]>>>0?1:0),r[3]=0|r[3]+1295307597+(r[2]>>>0<s[2]>>>0?1:0),r[4]=0|r[4]+3545052371+(r[3]>>>0<s[3]>>>0?1:0),r[5]=0|r[5]+886263092+(r[4]>>>0<s[4]>>>0?1:0),r[6]=0|r[6]+1295307597+(r[5]>>>0<s[5]>>>0?1:0),r[7]=0|r[7]+3545052371+(r[6]>>>0<s[6]>>>0?1:0),this._b=r[7]>>>0<s[7]>>>0?1:0;for(var t=0;8>t;t++){var i=e[t]+r[t],o=65535&i,n=i>>>16,c=((o*o>>>17)+o*n>>>15)+n*n,f=(0|(4294901760&i)*i)+(0|(65535&i)*i);a[t]=c^f}e[0]=0|a[0]+(a[7]<<16|a[7]>>>16)+(a[6]<<16|a[6]>>>16),e[1]=0|a[1]+(a[0]<<8|a[0]>>>24)+a[7],e[2]=0|a[2]+(a[1]<<16|a[1]>>>16)+(a[0]<<16|a[0]>>>16),e[3]=0|a[3]+(a[2]<<8|a[2]>>>24)+a[1],e[4]=0|a[4]+(a[3]<<16|a[3]>>>16)+(a[2]<<16|a[2]>>>16),e[5]=0|a[5]+(a[4]<<8|a[4]>>>24)+a[3],e[6]=0|a[6]+(a[5]<<16|a[5]>>>16)+(a[4]<<16|a[4]>>>16),e[7]=0|a[7]+(a[6]<<8|a[6]>>>24)+a[5]}var t=e,i=t.lib,o=i.StreamCipher,n=t.algo,c=[],s=[],a=[],f=n.RabbitLegacy=o.extend({_doReset:function(){var e=this._key.words,t=this.cfg.iv,i=this._X=[e[0],e[3]<<16|e[2]>>>16,e[1],e[0]<<16|e[3]>>>16,e[2],e[1]<<16|e[0]>>>16,e[3],e[2]<<16|e[1]>>>16],o=this._C=[e[2]<<16|e[2]>>>16,4294901760&e[0]|65535&e[1],e[3]<<16|e[3]>>>16,4294901760&e[1]|65535&e[2],e[0]<<16|e[0]>>>16,4294901760&e[2]|65535&e[3],e[1]<<16|e[1]>>>16,4294901760&e[3]|65535&e[0]];this._b=0;for(var n=0;4>n;n++)r.call(this);for(var n=0;8>n;n++)o[n]^=i[7&n+4];if(t){var c=t.words,s=c[0],a=c[1],f=16711935&(s<<8|s>>>24)|4278255360&(s<<24|s>>>8),u=16711935&(a<<8|a>>>24)|4278255360&(a<<24|a>>>8),h=f>>>16|4294901760&u,d=u<<16|65535&f;o[0]^=f,o[1]^=h,o[2]^=u,o[3]^=d,o[4]^=f,o[5]^=h,o[6]^=u,o[7]^=d;for(var n=0;4>n;n++)r.call(this)}},_doProcessBlock:function(e,t){var i=this._X;r.call(this),c[0]=i[0]^i[5]>>>16^i[3]<<16,c[1]=i[2]^i[7]>>>16^i[5]<<16,c[2]=i[4]^i[1]>>>16^i[7]<<16,c[3]=i[6]^i[3]>>>16^i[1]<<16;for(var o=0;4>o;o++)c[o]=16711935&(c[o]<<8|c[o]>>>24)|4278255360&(c[o]<<24|c[o]>>>8),e[t+o]^=c[o]},blockSize:4,ivSize:2});t.RabbitLegacy=o._createHelper(f)}(),e.RabbitLegacy});
},{"./cipher-core":2,"./core":3,"./enc-base64":4,"./evpkdf":6,"./md5":12}],25:[function(require,module,exports){
(function(e,r){"object"==typeof exports?module.exports=exports=r(require("./core"),require("./enc-base64"),require("./md5"),require("./evpkdf"),require("./cipher-core")):"function"==typeof define&&define.amd?define(["./core","./enc-base64","./md5","./evpkdf","./cipher-core"],r):r(e.CryptoJS)})(this,function(e){return function(){function r(){for(var e=this._X,r=this._C,t=0;8>t;t++)s[t]=r[t];r[0]=0|r[0]+1295307597+this._b,r[1]=0|r[1]+3545052371+(r[0]>>>0<s[0]>>>0?1:0),r[2]=0|r[2]+886263092+(r[1]>>>0<s[1]>>>0?1:0),r[3]=0|r[3]+1295307597+(r[2]>>>0<s[2]>>>0?1:0),r[4]=0|r[4]+3545052371+(r[3]>>>0<s[3]>>>0?1:0),r[5]=0|r[5]+886263092+(r[4]>>>0<s[4]>>>0?1:0),r[6]=0|r[6]+1295307597+(r[5]>>>0<s[5]>>>0?1:0),r[7]=0|r[7]+3545052371+(r[6]>>>0<s[6]>>>0?1:0),this._b=r[7]>>>0<s[7]>>>0?1:0;for(var t=0;8>t;t++){var i=e[t]+r[t],o=65535&i,n=i>>>16,c=((o*o>>>17)+o*n>>>15)+n*n,f=(0|(4294901760&i)*i)+(0|(65535&i)*i);a[t]=c^f}e[0]=0|a[0]+(a[7]<<16|a[7]>>>16)+(a[6]<<16|a[6]>>>16),e[1]=0|a[1]+(a[0]<<8|a[0]>>>24)+a[7],e[2]=0|a[2]+(a[1]<<16|a[1]>>>16)+(a[0]<<16|a[0]>>>16),e[3]=0|a[3]+(a[2]<<8|a[2]>>>24)+a[1],e[4]=0|a[4]+(a[3]<<16|a[3]>>>16)+(a[2]<<16|a[2]>>>16),e[5]=0|a[5]+(a[4]<<8|a[4]>>>24)+a[3],e[6]=0|a[6]+(a[5]<<16|a[5]>>>16)+(a[4]<<16|a[4]>>>16),e[7]=0|a[7]+(a[6]<<8|a[6]>>>24)+a[5]}var t=e,i=t.lib,o=i.StreamCipher,n=t.algo,c=[],s=[],a=[],f=n.Rabbit=o.extend({_doReset:function(){for(var e=this._key.words,t=this.cfg.iv,i=0;4>i;i++)e[i]=16711935&(e[i]<<8|e[i]>>>24)|4278255360&(e[i]<<24|e[i]>>>8);var o=this._X=[e[0],e[3]<<16|e[2]>>>16,e[1],e[0]<<16|e[3]>>>16,e[2],e[1]<<16|e[0]>>>16,e[3],e[2]<<16|e[1]>>>16],n=this._C=[e[2]<<16|e[2]>>>16,4294901760&e[0]|65535&e[1],e[3]<<16|e[3]>>>16,4294901760&e[1]|65535&e[2],e[0]<<16|e[0]>>>16,4294901760&e[2]|65535&e[3],e[1]<<16|e[1]>>>16,4294901760&e[3]|65535&e[0]];this._b=0;for(var i=0;4>i;i++)r.call(this);for(var i=0;8>i;i++)n[i]^=o[7&i+4];if(t){var c=t.words,s=c[0],a=c[1],f=16711935&(s<<8|s>>>24)|4278255360&(s<<24|s>>>8),u=16711935&(a<<8|a>>>24)|4278255360&(a<<24|a>>>8),h=f>>>16|4294901760&u,d=u<<16|65535&f;n[0]^=f,n[1]^=h,n[2]^=u,n[3]^=d,n[4]^=f,n[5]^=h,n[6]^=u,n[7]^=d;for(var i=0;4>i;i++)r.call(this)}},_doProcessBlock:function(e,t){var i=this._X;r.call(this),c[0]=i[0]^i[5]>>>16^i[3]<<16,c[1]=i[2]^i[7]>>>16^i[5]<<16,c[2]=i[4]^i[1]>>>16^i[7]<<16,c[3]=i[6]^i[3]>>>16^i[1]<<16;for(var o=0;4>o;o++)c[o]=16711935&(c[o]<<8|c[o]>>>24)|4278255360&(c[o]<<24|c[o]>>>8),e[t+o]^=c[o]},blockSize:4,ivSize:2});t.Rabbit=o._createHelper(f)}(),e.Rabbit});
},{"./cipher-core":2,"./core":3,"./enc-base64":4,"./evpkdf":6,"./md5":12}],26:[function(require,module,exports){
(function(e,r){"object"==typeof exports?module.exports=exports=r(require("./core"),require("./enc-base64"),require("./md5"),require("./evpkdf"),require("./cipher-core")):"function"==typeof define&&define.amd?define(["./core","./enc-base64","./md5","./evpkdf","./cipher-core"],r):r(e.CryptoJS)})(this,function(e){return function(){function r(){for(var e=this._S,r=this._i,t=this._j,i=0,o=0;4>o;o++){r=(r+1)%256,t=(t+e[r])%256;var n=e[r];e[r]=e[t],e[t]=n,i|=e[(e[r]+e[t])%256]<<24-8*o}return this._i=r,this._j=t,i}var t=e,i=t.lib,o=i.StreamCipher,n=t.algo,c=n.RC4=o.extend({_doReset:function(){for(var e=this._key,r=e.words,t=e.sigBytes,i=this._S=[],o=0;256>o;o++)i[o]=o;for(var o=0,n=0;256>o;o++){var c=o%t,s=255&r[c>>>2]>>>24-8*(c%4);n=(n+i[o]+s)%256;var a=i[o];i[o]=i[n],i[n]=a}this._i=this._j=0},_doProcessBlock:function(e,t){e[t]^=r.call(this)},keySize:8,ivSize:0});t.RC4=o._createHelper(c);var s=n.RC4Drop=c.extend({cfg:c.cfg.extend({drop:192}),_doReset:function(){c._doReset.call(this);for(var e=this.cfg.drop;e>0;e--)r.call(this)}});t.RC4Drop=o._createHelper(s)}(),e.RC4});
},{"./cipher-core":2,"./core":3,"./enc-base64":4,"./evpkdf":6,"./md5":12}],27:[function(require,module,exports){
(function(e,r){"object"==typeof exports?module.exports=exports=r(require("./core")):"function"==typeof define&&define.amd?define(["./core"],r):r(e.CryptoJS)})(this,function(e){return function(){function r(e,r,t){return e^r^t}function t(e,r,t){return e&r|~e&t}function n(e,r,t){return(e|~r)^t}function i(e,r,t){return e&t|r&~t}function o(e,r,t){return e^(r|~t)}function s(e,r){return e<<r|e>>>32-r}var a=e,c=a.lib,f=c.WordArray,u=c.Hasher,h=a.algo,d=f.create([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,7,4,13,1,10,6,15,3,12,0,9,5,2,14,11,8,3,10,14,4,9,15,8,1,2,7,0,6,13,11,5,12,1,9,11,10,0,8,12,4,13,3,7,15,14,5,6,2,4,0,5,9,7,12,2,10,14,1,3,8,11,6,15,13]),p=f.create([5,14,7,0,9,2,11,4,13,6,15,8,1,10,3,12,6,11,3,7,0,13,5,10,14,15,8,12,4,9,1,2,15,5,1,3,7,14,6,9,11,8,12,2,10,0,4,13,8,6,4,1,3,11,15,0,5,12,2,13,9,7,10,14,12,15,10,4,1,5,8,7,6,2,13,14,0,3,9,11]),l=f.create([11,14,15,12,5,8,7,9,11,13,14,15,6,7,9,8,7,6,8,13,11,9,7,15,7,12,15,9,11,7,13,12,11,13,6,7,14,9,13,15,14,8,13,6,5,12,7,5,11,12,14,15,14,15,9,8,9,14,5,6,8,6,5,12,9,15,5,11,6,8,13,12,5,12,13,14,11,8,5,6]),y=f.create([8,9,9,11,13,15,15,5,7,7,8,11,14,14,12,6,9,13,15,7,12,8,9,11,7,7,12,7,6,15,13,11,9,7,15,11,8,6,6,14,12,13,5,14,13,13,7,5,15,5,8,11,14,14,6,14,6,9,12,9,12,5,15,8,8,5,12,9,12,5,14,6,8,13,6,5,15,13,11,11]),m=f.create([0,1518500249,1859775393,2400959708,2840853838]),x=f.create([1352829926,1548603684,1836072691,2053994217,0]),g=h.RIPEMD160=u.extend({_doReset:function(){this._hash=f.create([1732584193,4023233417,2562383102,271733878,3285377520])},_doProcessBlock:function(e,a){for(var c=0;16>c;c++){var f=a+c,u=e[f];e[f]=16711935&(u<<8|u>>>24)|4278255360&(u<<24|u>>>8)}var h,g,v,_,w,q,H,S,b,A,B=this._hash.words,C=m.words,j=x.words,J=d.words,z=p.words,M=l.words,W=y.words;q=h=B[0],H=g=B[1],S=v=B[2],b=_=B[3],A=w=B[4];for(var D,c=0;80>c;c+=1)D=0|h+e[a+J[c]],D+=16>c?r(g,v,_)+C[0]:32>c?t(g,v,_)+C[1]:48>c?n(g,v,_)+C[2]:64>c?i(g,v,_)+C[3]:o(g,v,_)+C[4],D=0|D,D=s(D,M[c]),D=0|D+w,h=w,w=_,_=s(v,10),v=g,g=D,D=0|q+e[a+z[c]],D+=16>c?o(H,S,b)+j[0]:32>c?i(H,S,b)+j[1]:48>c?n(H,S,b)+j[2]:64>c?t(H,S,b)+j[3]:r(H,S,b)+j[4],D=0|D,D=s(D,W[c]),D=0|D+A,q=A,A=b,b=s(S,10),S=H,H=D;D=0|B[1]+v+b,B[1]=0|B[2]+_+A,B[2]=0|B[3]+w+q,B[3]=0|B[4]+h+H,B[4]=0|B[0]+g+S,B[0]=D},_doFinalize:function(){var e=this._data,r=e.words,t=8*this._nDataBytes,n=8*e.sigBytes;r[n>>>5]|=128<<24-n%32,r[(n+64>>>9<<4)+14]=16711935&(t<<8|t>>>24)|4278255360&(t<<24|t>>>8),e.sigBytes=4*(r.length+1),this._process();for(var i=this._hash,o=i.words,s=0;5>s;s++){var a=o[s];o[s]=16711935&(a<<8|a>>>24)|4278255360&(a<<24|a>>>8)}return i},clone:function(){var e=u.clone.call(this);return e._hash=this._hash.clone(),e}});a.RIPEMD160=u._createHelper(g),a.HmacRIPEMD160=u._createHmacHelper(g)}(Math),e.RIPEMD160});
},{"./core":3}],28:[function(require,module,exports){
(function(e,r){"object"==typeof exports?module.exports=exports=r(require("./core")):"function"==typeof define&&define.amd?define(["./core"],r):r(e.CryptoJS)})(this,function(e){return function(){var r=e,t=r.lib,n=t.WordArray,i=t.Hasher,o=r.algo,s=[],c=o.SHA1=i.extend({_doReset:function(){this._hash=new n.init([1732584193,4023233417,2562383102,271733878,3285377520])},_doProcessBlock:function(e,r){for(var t=this._hash.words,n=t[0],i=t[1],o=t[2],c=t[3],a=t[4],f=0;80>f;f++){if(16>f)s[f]=0|e[r+f];else{var u=s[f-3]^s[f-8]^s[f-14]^s[f-16];s[f]=u<<1|u>>>31}var d=(n<<5|n>>>27)+a+s[f];d+=20>f?(i&o|~i&c)+1518500249:40>f?(i^o^c)+1859775393:60>f?(i&o|i&c|o&c)-1894007588:(i^o^c)-899497514,a=c,c=o,o=i<<30|i>>>2,i=n,n=d}t[0]=0|t[0]+n,t[1]=0|t[1]+i,t[2]=0|t[2]+o,t[3]=0|t[3]+c,t[4]=0|t[4]+a},_doFinalize:function(){var e=this._data,r=e.words,t=8*this._nDataBytes,n=8*e.sigBytes;return r[n>>>5]|=128<<24-n%32,r[(n+64>>>9<<4)+14]=Math.floor(t/4294967296),r[(n+64>>>9<<4)+15]=t,e.sigBytes=4*r.length,this._process(),this._hash},clone:function(){var e=i.clone.call(this);return e._hash=this._hash.clone(),e}});r.SHA1=i._createHelper(c),r.HmacSHA1=i._createHmacHelper(c)}(),e.SHA1});
},{"./core":3}],29:[function(require,module,exports){
(function(e,r){"object"==typeof exports?module.exports=exports=r(require("./core"),require("./sha256")):"function"==typeof define&&define.amd?define(["./core","./sha256"],r):r(e.CryptoJS)})(this,function(e){return function(){var r=e,t=r.lib,n=t.WordArray,i=r.algo,o=i.SHA256,s=i.SHA224=o.extend({_doReset:function(){this._hash=new n.init([3238371032,914150663,812702999,4144912697,4290775857,1750603025,1694076839,3204075428])},_doFinalize:function(){var e=o._doFinalize.call(this);return e.sigBytes-=4,e}});r.SHA224=o._createHelper(s),r.HmacSHA224=o._createHmacHelper(s)}(),e.SHA224});
},{"./core":3,"./sha256":30}],30:[function(require,module,exports){
(function(e,r){"object"==typeof exports?module.exports=exports=r(require("./core")):"function"==typeof define&&define.amd?define(["./core"],r):r(e.CryptoJS)})(this,function(e){return function(r){var t=e,n=t.lib,i=n.WordArray,o=n.Hasher,s=t.algo,c=[],a=[];(function(){function e(e){for(var t=r.sqrt(e),n=2;t>=n;n++)if(!(e%n))return!1;return!0}function t(e){return 0|4294967296*(e-(0|e))}for(var n=2,i=0;64>i;)e(n)&&(8>i&&(c[i]=t(r.pow(n,.5))),a[i]=t(r.pow(n,1/3)),i++),n++})();var f=[],u=s.SHA256=o.extend({_doReset:function(){this._hash=new i.init(c.slice(0))},_doProcessBlock:function(e,r){for(var t=this._hash.words,n=t[0],i=t[1],o=t[2],s=t[3],c=t[4],u=t[5],d=t[6],p=t[7],h=0;64>h;h++){if(16>h)f[h]=0|e[r+h];else{var y=f[h-15],l=(y<<25|y>>>7)^(y<<14|y>>>18)^y>>>3,m=f[h-2],x=(m<<15|m>>>17)^(m<<13|m>>>19)^m>>>10;f[h]=l+f[h-7]+x+f[h-16]}var v=c&u^~c&d,q=n&i^n&o^i&o,g=(n<<30|n>>>2)^(n<<19|n>>>13)^(n<<10|n>>>22),_=(c<<26|c>>>6)^(c<<21|c>>>11)^(c<<7|c>>>25),b=p+_+v+a[h]+f[h],S=g+q;p=d,d=u,u=c,c=0|s+b,s=o,o=i,i=n,n=0|b+S}t[0]=0|t[0]+n,t[1]=0|t[1]+i,t[2]=0|t[2]+o,t[3]=0|t[3]+s,t[4]=0|t[4]+c,t[5]=0|t[5]+u,t[6]=0|t[6]+d,t[7]=0|t[7]+p},_doFinalize:function(){var e=this._data,t=e.words,n=8*this._nDataBytes,i=8*e.sigBytes;return t[i>>>5]|=128<<24-i%32,t[(i+64>>>9<<4)+14]=r.floor(n/4294967296),t[(i+64>>>9<<4)+15]=n,e.sigBytes=4*t.length,this._process(),this._hash},clone:function(){var e=o.clone.call(this);return e._hash=this._hash.clone(),e}});t.SHA256=o._createHelper(u),t.HmacSHA256=o._createHmacHelper(u)}(Math),e.SHA256});
},{"./core":3}],31:[function(require,module,exports){
(function(e,r){"object"==typeof exports?module.exports=exports=r(require("./core"),require("./x64-core")):"function"==typeof define&&define.amd?define(["./core","./x64-core"],r):r(e.CryptoJS)})(this,function(e){return function(r){var t=e,n=t.lib,i=n.WordArray,o=n.Hasher,a=t.x64,s=a.Word,c=t.algo,f=[],u=[],h=[];(function(){for(var e=1,r=0,t=0;24>t;t++){f[e+5*r]=(t+1)*(t+2)/2%64;var n=r%5,i=(2*e+3*r)%5;e=n,r=i}for(var e=0;5>e;e++)for(var r=0;5>r;r++)u[e+5*r]=r+5*((2*e+3*r)%5);for(var o=1,a=0;24>a;a++){for(var c=0,d=0,p=0;7>p;p++){if(1&o){var l=(1<<p)-1;32>l?d^=1<<l:c^=1<<l-32}128&o?o=113^o<<1:o<<=1}h[a]=s.create(c,d)}})();var d=[];(function(){for(var e=0;25>e;e++)d[e]=s.create()})();var p=c.SHA3=o.extend({cfg:o.cfg.extend({outputLength:512}),_doReset:function(){for(var e=this._state=[],r=0;25>r;r++)e[r]=new s.init;this.blockSize=(1600-2*this.cfg.outputLength)/32},_doProcessBlock:function(e,r){for(var t=this._state,n=this.blockSize/2,i=0;n>i;i++){var o=e[r+2*i],a=e[r+2*i+1];o=16711935&(o<<8|o>>>24)|4278255360&(o<<24|o>>>8),a=16711935&(a<<8|a>>>24)|4278255360&(a<<24|a>>>8);var s=t[i];s.high^=a,s.low^=o}for(var c=0;24>c;c++){for(var p=0;5>p;p++){for(var l=0,y=0,m=0;5>m;m++){var s=t[p+5*m];l^=s.high,y^=s.low}var v=d[p];v.high=l,v.low=y}for(var p=0;5>p;p++)for(var g=d[(p+4)%5],x=d[(p+1)%5],w=x.high,_=x.low,l=g.high^(w<<1|_>>>31),y=g.low^(_<<1|w>>>31),m=0;5>m;m++){var s=t[p+5*m];s.high^=l,s.low^=y}for(var q=1;25>q;q++){var s=t[q],H=s.high,S=s.low,b=f[q];if(32>b)var l=H<<b|S>>>32-b,y=S<<b|H>>>32-b;else var l=S<<b-32|H>>>64-b,y=H<<b-32|S>>>64-b;var A=d[u[q]];A.high=l,A.low=y}var B=d[0],C=t[0];B.high=C.high,B.low=C.low;for(var p=0;5>p;p++)for(var m=0;5>m;m++){var q=p+5*m,s=t[q],j=d[q],z=d[(p+1)%5+5*m],J=d[(p+2)%5+5*m];s.high=j.high^~z.high&J.high,s.low=j.low^~z.low&J.low}var s=t[0],M=h[c];s.high^=M.high,s.low^=M.low}},_doFinalize:function(){var e=this._data,t=e.words;8*this._nDataBytes;var n=8*e.sigBytes,o=32*this.blockSize;t[n>>>5]|=1<<24-n%32,t[(r.ceil((n+1)/o)*o>>>5)-1]|=128,e.sigBytes=4*t.length,this._process();for(var a=this._state,s=this.cfg.outputLength/8,c=s/8,f=[],u=0;c>u;u++){var h=a[u],d=h.high,p=h.low;d=16711935&(d<<8|d>>>24)|4278255360&(d<<24|d>>>8),p=16711935&(p<<8|p>>>24)|4278255360&(p<<24|p>>>8),f.push(p),f.push(d)}return new i.init(f,s)},clone:function(){for(var e=o.clone.call(this),r=e._state=this._state.slice(0),t=0;25>t;t++)r[t]=r[t].clone();return e}});t.SHA3=o._createHelper(p),t.HmacSHA3=o._createHmacHelper(p)}(Math),e.SHA3});
},{"./core":3,"./x64-core":35}],32:[function(require,module,exports){
(function(e,r){"object"==typeof exports?module.exports=exports=r(require("./core"),require("./x64-core"),require("./sha512")):"function"==typeof define&&define.amd?define(["./core","./x64-core","./sha512"],r):r(e.CryptoJS)})(this,function(e){return function(){var r=e,t=r.x64,n=t.Word,i=t.WordArray,o=r.algo,s=o.SHA512,c=o.SHA384=s.extend({_doReset:function(){this._hash=new i.init([new n.init(3418070365,3238371032),new n.init(1654270250,914150663),new n.init(2438529370,812702999),new n.init(355462360,4144912697),new n.init(1731405415,4290775857),new n.init(2394180231,1750603025),new n.init(3675008525,1694076839),new n.init(1203062813,3204075428)])},_doFinalize:function(){var e=s._doFinalize.call(this);return e.sigBytes-=16,e}});r.SHA384=s._createHelper(c),r.HmacSHA384=s._createHmacHelper(c)}(),e.SHA384});
},{"./core":3,"./sha512":33,"./x64-core":35}],33:[function(require,module,exports){
(function(e,r){"object"==typeof exports?module.exports=exports=r(require("./core"),require("./x64-core")):"function"==typeof define&&define.amd?define(["./core","./x64-core"],r):r(e.CryptoJS)})(this,function(e){return function(){function r(){return s.create.apply(s,arguments)}var t=e,n=t.lib,i=n.Hasher,o=t.x64,s=o.Word,a=o.WordArray,c=t.algo,f=[r(1116352408,3609767458),r(1899447441,602891725),r(3049323471,3964484399),r(3921009573,2173295548),r(961987163,4081628472),r(1508970993,3053834265),r(2453635748,2937671579),r(2870763221,3664609560),r(3624381080,2734883394),r(310598401,1164996542),r(607225278,1323610764),r(1426881987,3590304994),r(1925078388,4068182383),r(2162078206,991336113),r(2614888103,633803317),r(3248222580,3479774868),r(3835390401,2666613458),r(4022224774,944711139),r(264347078,2341262773),r(604807628,2007800933),r(770255983,1495990901),r(1249150122,1856431235),r(1555081692,3175218132),r(1996064986,2198950837),r(2554220882,3999719339),r(2821834349,766784016),r(2952996808,2566594879),r(3210313671,3203337956),r(3336571891,1034457026),r(3584528711,2466948901),r(113926993,3758326383),r(338241895,168717936),r(666307205,1188179964),r(773529912,1546045734),r(1294757372,1522805485),r(1396182291,2643833823),r(1695183700,2343527390),r(1986661051,1014477480),r(2177026350,1206759142),r(2456956037,344077627),r(2730485921,1290863460),r(2820302411,3158454273),r(3259730800,3505952657),r(3345764771,106217008),r(3516065817,3606008344),r(3600352804,1432725776),r(4094571909,1467031594),r(275423344,851169720),r(430227734,3100823752),r(506948616,1363258195),r(659060556,3750685593),r(883997877,3785050280),r(958139571,3318307427),r(1322822218,3812723403),r(1537002063,2003034995),r(1747873779,3602036899),r(1955562222,1575990012),r(2024104815,1125592928),r(2227730452,2716904306),r(2361852424,442776044),r(2428436474,593698344),r(2756734187,3733110249),r(3204031479,2999351573),r(3329325298,3815920427),r(3391569614,3928383900),r(3515267271,566280711),r(3940187606,3454069534),r(4118630271,4000239992),r(116418474,1914138554),r(174292421,2731055270),r(289380356,3203993006),r(460393269,320620315),r(685471733,587496836),r(852142971,1086792851),r(1017036298,365543100),r(1126000580,2618297676),r(1288033470,3409855158),r(1501505948,4234509866),r(1607167915,987167468),r(1816402316,1246189591)],u=[];(function(){for(var e=0;80>e;e++)u[e]=r()})();var h=c.SHA512=i.extend({_doReset:function(){this._hash=new a.init([new s.init(1779033703,4089235720),new s.init(3144134277,2227873595),new s.init(1013904242,4271175723),new s.init(2773480762,1595750129),new s.init(1359893119,2917565137),new s.init(2600822924,725511199),new s.init(528734635,4215389547),new s.init(1541459225,327033209)])},_doProcessBlock:function(e,r){for(var t=this._hash.words,n=t[0],i=t[1],o=t[2],s=t[3],a=t[4],c=t[5],h=t[6],d=t[7],p=n.high,l=n.low,y=i.high,m=i.low,x=o.high,g=o.low,v=s.high,w=s.low,_=a.high,q=a.low,H=c.high,S=c.low,b=h.high,A=h.low,B=d.high,C=d.low,j=p,J=l,z=y,W=m,U=x,k=g,M=v,D=w,F=_,P=q,R=H,I=S,O=b,L=A,E=B,X=C,$=0;80>$;$++){var T=u[$];if(16>$)var G=T.high=0|e[r+2*$],K=T.low=0|e[r+2*$+1];else{var N=u[$-15],Q=N.high,V=N.low,Y=(Q>>>1|V<<31)^(Q>>>8|V<<24)^Q>>>7,Z=(V>>>1|Q<<31)^(V>>>8|Q<<24)^(V>>>7|Q<<25),er=u[$-2],rr=er.high,tr=er.low,nr=(rr>>>19|tr<<13)^(rr<<3|tr>>>29)^rr>>>6,ir=(tr>>>19|rr<<13)^(tr<<3|rr>>>29)^(tr>>>6|rr<<26),or=u[$-7],sr=or.high,ar=or.low,cr=u[$-16],fr=cr.high,ur=cr.low,K=Z+ar,G=Y+sr+(Z>>>0>K>>>0?1:0),K=K+ir,G=G+nr+(ir>>>0>K>>>0?1:0),K=K+ur,G=G+fr+(ur>>>0>K>>>0?1:0);T.high=G,T.low=K}var hr=F&R^~F&O,dr=P&I^~P&L,pr=j&z^j&U^z&U,lr=J&W^J&k^W&k,yr=(j>>>28|J<<4)^(j<<30|J>>>2)^(j<<25|J>>>7),mr=(J>>>28|j<<4)^(J<<30|j>>>2)^(J<<25|j>>>7),xr=(F>>>14|P<<18)^(F>>>18|P<<14)^(F<<23|P>>>9),gr=(P>>>14|F<<18)^(P>>>18|F<<14)^(P<<23|F>>>9),vr=f[$],wr=vr.high,_r=vr.low,qr=X+gr,Hr=E+xr+(X>>>0>qr>>>0?1:0),qr=qr+dr,Hr=Hr+hr+(dr>>>0>qr>>>0?1:0),qr=qr+_r,Hr=Hr+wr+(_r>>>0>qr>>>0?1:0),qr=qr+K,Hr=Hr+G+(K>>>0>qr>>>0?1:0),Sr=mr+lr,br=yr+pr+(mr>>>0>Sr>>>0?1:0);E=O,X=L,O=R,L=I,R=F,I=P,P=0|D+qr,F=0|M+Hr+(D>>>0>P>>>0?1:0),M=U,D=k,U=z,k=W,z=j,W=J,J=0|qr+Sr,j=0|Hr+br+(qr>>>0>J>>>0?1:0)}l=n.low=l+J,n.high=p+j+(J>>>0>l>>>0?1:0),m=i.low=m+W,i.high=y+z+(W>>>0>m>>>0?1:0),g=o.low=g+k,o.high=x+U+(k>>>0>g>>>0?1:0),w=s.low=w+D,s.high=v+M+(D>>>0>w>>>0?1:0),q=a.low=q+P,a.high=_+F+(P>>>0>q>>>0?1:0),S=c.low=S+I,c.high=H+R+(I>>>0>S>>>0?1:0),A=h.low=A+L,h.high=b+O+(L>>>0>A>>>0?1:0),C=d.low=C+X,d.high=B+E+(X>>>0>C>>>0?1:0)},_doFinalize:function(){var e=this._data,r=e.words,t=8*this._nDataBytes,n=8*e.sigBytes;r[n>>>5]|=128<<24-n%32,r[(n+128>>>10<<5)+30]=Math.floor(t/4294967296),r[(n+128>>>10<<5)+31]=t,e.sigBytes=4*r.length,this._process();var i=this._hash.toX32();return i},clone:function(){var e=i.clone.call(this);return e._hash=this._hash.clone(),e},blockSize:32});t.SHA512=i._createHelper(h),t.HmacSHA512=i._createHmacHelper(h)}(),e.SHA512});
},{"./core":3,"./x64-core":35}],34:[function(require,module,exports){
(function(e,r){"object"==typeof exports?module.exports=exports=r(require("./core"),require("./enc-base64"),require("./md5"),require("./evpkdf"),require("./cipher-core")):"function"==typeof define&&define.amd?define(["./core","./enc-base64","./md5","./evpkdf","./cipher-core"],r):r(e.CryptoJS)})(this,function(e){return function(){function r(e,r){var t=(this._lBlock>>>e^this._rBlock)&r;this._rBlock^=t,this._lBlock^=t<<e}function t(e,r){var t=(this._rBlock>>>e^this._lBlock)&r;this._lBlock^=t,this._rBlock^=t<<e}var i=e,o=i.lib,n=o.WordArray,c=o.BlockCipher,s=i.algo,a=[57,49,41,33,25,17,9,1,58,50,42,34,26,18,10,2,59,51,43,35,27,19,11,3,60,52,44,36,63,55,47,39,31,23,15,7,62,54,46,38,30,22,14,6,61,53,45,37,29,21,13,5,28,20,12,4],f=[14,17,11,24,1,5,3,28,15,6,21,10,23,19,12,4,26,8,16,7,27,20,13,2,41,52,31,37,47,55,30,40,51,45,33,48,44,49,39,56,34,53,46,42,50,36,29,32],u=[1,2,4,6,8,10,12,14,15,17,19,21,23,25,27,28],h=[{0:8421888,268435456:32768,536870912:8421378,805306368:2,1073741824:512,1342177280:8421890,1610612736:8389122,1879048192:8388608,2147483648:514,2415919104:8389120,2684354560:33280,2952790016:8421376,3221225472:32770,3489660928:8388610,3758096384:0,4026531840:33282,134217728:0,402653184:8421890,671088640:33282,939524096:32768,1207959552:8421888,1476395008:512,1744830464:8421378,2013265920:2,2281701376:8389120,2550136832:33280,2818572288:8421376,3087007744:8389122,3355443200:8388610,3623878656:32770,3892314112:514,4160749568:8388608,1:32768,268435457:2,536870913:8421888,805306369:8388608,1073741825:8421378,1342177281:33280,1610612737:512,1879048193:8389122,2147483649:8421890,2415919105:8421376,2684354561:8388610,2952790017:33282,3221225473:514,3489660929:8389120,3758096385:32770,4026531841:0,134217729:8421890,402653185:8421376,671088641:8388608,939524097:512,1207959553:32768,1476395009:8388610,1744830465:2,2013265921:33282,2281701377:32770,2550136833:8389122,2818572289:514,3087007745:8421888,3355443201:8389120,3623878657:0,3892314113:33280,4160749569:8421378},{0:1074282512,16777216:16384,33554432:524288,50331648:1074266128,67108864:1073741840,83886080:1074282496,100663296:1073758208,117440512:16,134217728:540672,150994944:1073758224,167772160:1073741824,184549376:540688,201326592:524304,218103808:0,234881024:16400,251658240:1074266112,8388608:1073758208,25165824:540688,41943040:16,58720256:1073758224,75497472:1074282512,92274688:1073741824,109051904:524288,125829120:1074266128,142606336:524304,159383552:0,176160768:16384,192937984:1074266112,209715200:1073741840,226492416:540672,243269632:1074282496,260046848:16400,268435456:0,285212672:1074266128,301989888:1073758224,318767104:1074282496,335544320:1074266112,352321536:16,369098752:540688,385875968:16384,402653184:16400,419430400:524288,436207616:524304,452984832:1073741840,469762048:540672,486539264:1073758208,503316480:1073741824,520093696:1074282512,276824064:540688,293601280:524288,310378496:1074266112,327155712:16384,343932928:1073758208,360710144:1074282512,377487360:16,394264576:1073741824,411041792:1074282496,427819008:1073741840,444596224:1073758224,461373440:524304,478150656:0,494927872:16400,511705088:1074266128,528482304:540672},{0:260,1048576:0,2097152:67109120,3145728:65796,4194304:65540,5242880:67108868,6291456:67174660,7340032:67174400,8388608:67108864,9437184:67174656,10485760:65792,11534336:67174404,12582912:67109124,13631488:65536,14680064:4,15728640:256,524288:67174656,1572864:67174404,2621440:0,3670016:67109120,4718592:67108868,5767168:65536,6815744:65540,7864320:260,8912896:4,9961472:256,11010048:67174400,12058624:65796,13107200:65792,14155776:67109124,15204352:67174660,16252928:67108864,16777216:67174656,17825792:65540,18874368:65536,19922944:67109120,20971520:256,22020096:67174660,23068672:67108868,24117248:0,25165824:67109124,26214400:67108864,27262976:4,28311552:65792,29360128:67174400,30408704:260,31457280:65796,32505856:67174404,17301504:67108864,18350080:260,19398656:67174656,20447232:0,21495808:65540,22544384:67109120,23592960:256,24641536:67174404,25690112:65536,26738688:67174660,27787264:65796,28835840:67108868,29884416:67109124,30932992:67174400,31981568:4,33030144:65792},{0:2151682048,65536:2147487808,131072:4198464,196608:2151677952,262144:0,327680:4198400,393216:2147483712,458752:4194368,524288:2147483648,589824:4194304,655360:64,720896:2147487744,786432:2151678016,851968:4160,917504:4096,983040:2151682112,32768:2147487808,98304:64,163840:2151678016,229376:2147487744,294912:4198400,360448:2151682112,425984:0,491520:2151677952,557056:4096,622592:2151682048,688128:4194304,753664:4160,819200:2147483648,884736:4194368,950272:4198464,1015808:2147483712,1048576:4194368,1114112:4198400,1179648:2147483712,1245184:0,1310720:4160,1376256:2151678016,1441792:2151682048,1507328:2147487808,1572864:2151682112,1638400:2147483648,1703936:2151677952,1769472:4198464,1835008:2147487744,1900544:4194304,1966080:64,2031616:4096,1081344:2151677952,1146880:2151682112,1212416:0,1277952:4198400,1343488:4194368,1409024:2147483648,1474560:2147487808,1540096:64,1605632:2147483712,1671168:4096,1736704:2147487744,1802240:2151678016,1867776:4160,1933312:2151682048,1998848:4194304,2064384:4198464},{0:128,4096:17039360,8192:262144,12288:536870912,16384:537133184,20480:16777344,24576:553648256,28672:262272,32768:16777216,36864:537133056,40960:536871040,45056:553910400,49152:553910272,53248:0,57344:17039488,61440:553648128,2048:17039488,6144:553648256,10240:128,14336:17039360,18432:262144,22528:537133184,26624:553910272,30720:536870912,34816:537133056,38912:0,43008:553910400,47104:16777344,51200:536871040,55296:553648128,59392:16777216,63488:262272,65536:262144,69632:128,73728:536870912,77824:553648256,81920:16777344,86016:553910272,90112:537133184,94208:16777216,98304:553910400,102400:553648128,106496:17039360,110592:537133056,114688:262272,118784:536871040,122880:0,126976:17039488,67584:553648256,71680:16777216,75776:17039360,79872:537133184,83968:536870912,88064:17039488,92160:128,96256:553910272,100352:262272,104448:553910400,108544:0,112640:553648128,116736:16777344,120832:262144,124928:537133056,129024:536871040},{0:268435464,256:8192,512:270532608,768:270540808,1024:268443648,1280:2097152,1536:2097160,1792:268435456,2048:0,2304:268443656,2560:2105344,2816:8,3072:270532616,3328:2105352,3584:8200,3840:270540800,128:270532608,384:270540808,640:8,896:2097152,1152:2105352,1408:268435464,1664:268443648,1920:8200,2176:2097160,2432:8192,2688:268443656,2944:270532616,3200:0,3456:270540800,3712:2105344,3968:268435456,4096:268443648,4352:270532616,4608:270540808,4864:8200,5120:2097152,5376:268435456,5632:268435464,5888:2105344,6144:2105352,6400:0,6656:8,6912:270532608,7168:8192,7424:268443656,7680:270540800,7936:2097160,4224:8,4480:2105344,4736:2097152,4992:268435464,5248:268443648,5504:8200,5760:270540808,6016:270532608,6272:270540800,6528:270532616,6784:8192,7040:2105352,7296:2097160,7552:0,7808:268435456,8064:268443656},{0:1048576,16:33555457,32:1024,48:1049601,64:34604033,80:0,96:1,112:34603009,128:33555456,144:1048577,160:33554433,176:34604032,192:34603008,208:1025,224:1049600,240:33554432,8:34603009,24:0,40:33555457,56:34604032,72:1048576,88:33554433,104:33554432,120:1025,136:1049601,152:33555456,168:34603008,184:1048577,200:1024,216:34604033,232:1,248:1049600,256:33554432,272:1048576,288:33555457,304:34603009,320:1048577,336:33555456,352:34604032,368:1049601,384:1025,400:34604033,416:1049600,432:1,448:0,464:34603008,480:33554433,496:1024,264:1049600,280:33555457,296:34603009,312:1,328:33554432,344:1048576,360:1025,376:34604032,392:33554433,408:34603008,424:0,440:34604033,456:1049601,472:1024,488:33555456,504:1048577},{0:134219808,1:131072,2:134217728,3:32,4:131104,5:134350880,6:134350848,7:2048,8:134348800,9:134219776,10:133120,11:134348832,12:2080,13:0,14:134217760,15:133152,2147483648:2048,2147483649:134350880,2147483650:134219808,2147483651:134217728,2147483652:134348800,2147483653:133120,2147483654:133152,2147483655:32,2147483656:134217760,2147483657:2080,2147483658:131104,2147483659:134350848,2147483660:0,2147483661:134348832,2147483662:134219776,2147483663:131072,16:133152,17:134350848,18:32,19:2048,20:134219776,21:134217760,22:134348832,23:131072,24:0,25:131104,26:134348800,27:134219808,28:134350880,29:133120,30:2080,31:134217728,2147483664:131072,2147483665:2048,2147483666:134348832,2147483667:133152,2147483668:32,2147483669:134348800,2147483670:134217728,2147483671:134219808,2147483672:134350880,2147483673:134217760,2147483674:134219776,2147483675:0,2147483676:133120,2147483677:2080,2147483678:131104,2147483679:134350848}],p=[4160749569,528482304,33030144,2064384,129024,8064,504,2147483679],d=s.DES=c.extend({_doReset:function(){for(var e=this._key,r=e.words,t=[],i=0;56>i;i++){var o=a[i]-1;t[i]=1&r[o>>>5]>>>31-o%32}for(var n=this._subKeys=[],c=0;16>c;c++){for(var s=n[c]=[],h=u[c],i=0;24>i;i++)s[0|i/6]|=t[(f[i]-1+h)%28]<<31-i%6,s[4+(0|i/6)]|=t[28+(f[i+24]-1+h)%28]<<31-i%6;s[0]=s[0]<<1|s[0]>>>31;for(var i=1;7>i;i++)s[i]=s[i]>>>4*(i-1)+3;s[7]=s[7]<<5|s[7]>>>27}for(var p=this._invSubKeys=[],i=0;16>i;i++)p[i]=n[15-i]},encryptBlock:function(e,r){this._doCryptBlock(e,r,this._subKeys)},decryptBlock:function(e,r){this._doCryptBlock(e,r,this._invSubKeys)},_doCryptBlock:function(e,i,o){this._lBlock=e[i],this._rBlock=e[i+1],r.call(this,4,252645135),r.call(this,16,65535),t.call(this,2,858993459),t.call(this,8,16711935),r.call(this,1,1431655765);for(var n=0;16>n;n++){for(var c=o[n],s=this._lBlock,a=this._rBlock,f=0,u=0;8>u;u++)f|=h[u][((a^c[u])&p[u])>>>0];this._lBlock=a,this._rBlock=s^f}var d=this._lBlock;this._lBlock=this._rBlock,this._rBlock=d,r.call(this,1,1431655765),t.call(this,8,16711935),t.call(this,2,858993459),r.call(this,16,65535),r.call(this,4,252645135),e[i]=this._lBlock,e[i+1]=this._rBlock},keySize:2,ivSize:2,blockSize:2});i.DES=c._createHelper(d);var l=s.TripleDES=c.extend({_doReset:function(){var e=this._key,r=e.words;this._des1=d.createEncryptor(n.create(r.slice(0,2))),this._des2=d.createEncryptor(n.create(r.slice(2,4))),this._des3=d.createEncryptor(n.create(r.slice(4,6)))},encryptBlock:function(e,r){this._des1.encryptBlock(e,r),this._des2.decryptBlock(e,r),this._des3.encryptBlock(e,r)},decryptBlock:function(e,r){this._des3.decryptBlock(e,r),this._des2.encryptBlock(e,r),this._des1.decryptBlock(e,r)},keySize:6,ivSize:2,blockSize:2});i.TripleDES=c._createHelper(l)}(),e.TripleDES});
},{"./cipher-core":2,"./core":3,"./enc-base64":4,"./evpkdf":6,"./md5":12}],35:[function(require,module,exports){
(function(e,r){"object"==typeof exports?module.exports=exports=r(require("./core")):"function"==typeof define&&define.amd?define(["./core"],r):r(e.CryptoJS)})(this,function(e){return function(r){var t=e,i=t.lib,n=i.Base,o=i.WordArray,c=t.x64={};c.Word=n.extend({init:function(e,r){this.high=e,this.low=r}}),c.WordArray=n.extend({init:function(e,t){e=this.words=e||[],this.sigBytes=t!=r?t:8*e.length},toX32:function(){for(var e=this.words,r=e.length,t=[],i=0;r>i;i++){var n=e[i];t.push(n.high),t.push(n.low)}return o.create(t,this.sigBytes)},clone:function(){for(var e=n.clone.call(this),r=e.words=this.words.slice(0),t=r.length,i=0;t>i;i++)r[i]=r[i].clone();return e}})}(),e});
},{"./core":3}],36:[function(require,module,exports){
var process=require("__browserify_process");!function(globals){
'use strict'

//*** UMD BEGIN
if (typeof define !== 'undefined' && define.amd) { //require.js / AMD
  define([], function() {
    return secureRandom
  })
} else if (typeof module !== 'undefined' && module.exports) { //CommonJS
  module.exports = secureRandom
} else { //script / browser
  globals.secureRandom = secureRandom
}
//*** UMD END

//options.array is the only valid option
function secureRandom(count, options) {
  options = options || {}
  //we check for process.pid to prevent browserify from tricking us
  if (typeof process != 'undefined' && typeof process.pid == 'number') {
    return nodeRandom(count, options)
  } else {
    if (!window.crypto) throw new Error("Your browser does not support window.crypto.")
    return browserRandom(count, options)
  }
}

function nodeRandom(count, options) {
  var crypto = require('crypto')
  var buf = crypto.randomBytes(count)

  if (options.array) 
    var ret = []
  else
    var ret = new Uint8Array(count)

  for (var i = 0; i < count; ++i) {
    ret[i] = buf.readUInt8(i)
  }

  return ret
}

function browserRandom(count, options) {
  var nativeArr = new Uint8Array(count)
  window.crypto.getRandomValues(nativeArr)

  if (options.array) {
    var ret = []
    for (var i = 0; i < nativeArr.length; ++i) {
      ret[i] = nativeArr[i]
    }
  } else {
    ret = nativeArr
  }

  return ret
}

}(this);

},{"__browserify_process":59,"crypto":57}],37:[function(require,module,exports){
var base58 = require('./base58');
var convert = require('./convert');
var util = require('./util');
var mainnet = require('./network').mainnet.addressVersion;

var Address = function (bytes, version) {
    if (!(this instanceof Address)) { return new Address(bytes, version); }
    if (arguments[0] instanceof Address) {
        this.hash = arguments[0].hash;
        this.version = arguments[0].version;
    }
    else if (typeof bytes === 'string') {
        this.hash =
              bytes.length <= 35     ? base58.checkDecode(bytes)
            : bytes.length <= 40     ? convert.hexToBytes(bytes)
            :                          util.error('invalid or unrecognized input');

        this.version = version || this.hash.version || mainnet;
    }
    else {
        this.hash = bytes;
        this.version = version || bytes.version || mainnet;
    }
};

/**
 * Serialize this object as a standard Bitcoin address.
 *
 * Returns the address as a base58-encoded string in the standardized format.
 */
Address.prototype.toString = function () {
    return base58.checkEncode(this.hash.slice(0), this.version);
};

Address.getVersion = function(string) {
    return base58.decode(string)[0];
}

Address.validate = function(string) {
    try {
        base58.checkDecode(string);
        return true;
    } catch (e) {
        return false;
    }
};

module.exports = Address;

},{"./base58":38,"./convert":39,"./network":48,"./util":52}],38:[function(require,module,exports){

// https://en.bitcoin.it/wiki/Base58Check_encoding

var BigInteger = require('./jsbn/jsbn');
var Crypto = require('crypto-js');
var SHA256 = Crypto.SHA256;
var WordArray = Crypto.lib.WordArray;
var convert = require('./convert');

var alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
var base = BigInteger.valueOf(58);

var positions = {};
for (var i=0 ; i < alphabet.length ; ++i) {
    positions[alphabet[i]] = i;
}

// Convert a byte array to a base58-encoded string.
// Written by Mike Hearn for BitcoinJ.
//   Copyright (c) 2011 Google Inc.
// Ported to JavaScript by Stefan Thomas.
module.exports.encode = function (input) {
    var bi = BigInteger.fromByteArrayUnsigned(input);
    var chars = [];

    while (bi.compareTo(base) >= 0) {
        var mod = bi.mod(base);
        chars.push(alphabet[mod.intValue()]);
        bi = bi.subtract(mod).divide(base);
    }
    chars.push(alphabet[bi.intValue()]);

    // Convert leading zeros too.
    for (var i = 0; i < input.length; i++) {
        if (input[i] == 0x00) {
            chars.push(alphabet[0]);
        } else break;
    }

    return chars.reverse().join('');
},

// decode a base58 string into a byte array
// input should be a base58 encoded string
// @return Array
module.exports.decode = function (input) {

  var base = BigInteger.valueOf(58);

  var length = input.length;
  var num = BigInteger.valueOf(0);
  var leading_zero = 0;
  var seen_other = false;
  for (var i=0; i<length ; ++i) {
      var chr = input[i];
      var p = positions[chr];

      // if we encounter an invalid character, decoding fails
      if (p === undefined) {
          throw new Error('invalid base58 string: ' + input);
      }

      num = num.multiply(base).add(BigInteger.valueOf(p));

      if (chr == '1' && !seen_other) {
          ++leading_zero;
      }
      else {
          seen_other = true;
      }
  }

  var bytes = num.toByteArrayUnsigned();

  // remove leading zeros
  while (leading_zero-- > 0) {
      bytes.unshift(0);
  }

  return bytes;
}

module.exports.checkEncode = function(input, vbyte) {
    vbyte = vbyte || 0;
    var front = [vbyte].concat(input)
    return module.exports.encode(front.concat(getChecksum(front)));
}

module.exports.checkDecode = function(input) {
    var bytes = module.exports.decode(input),
        front = bytes.slice(0,bytes.length-4),
        back = bytes.slice(bytes.length-4);
    var checksum = getChecksum(front)
    if (""+checksum != ""+back) {
        throw new Error("Checksum failed");
    }
    var o = front.slice(1);
    o.version = front[0];
    return o;
}

function getChecksum(bytes) {
  var wordArray = convert.bytesToWordArray(bytes)
  return convert.hexToBytes(SHA256(SHA256(wordArray)).toString()).slice(0,4);
}

module.exports.getChecksum = getChecksum


},{"./convert":39,"./jsbn/jsbn":45,"crypto-js":10}],39:[function(require,module,exports){
var Crypto = require('crypto-js');
var WordArray = Crypto.lib.WordArray;
var base64map = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

exports.lpad = function lpad(str, padString, length) {
    while (str.length < length) str = padString + str;
    return str;
}

/**
 * Convert a byte array to a hex string
 */
exports.bytesToHex = function(bytes) {
    return bytes.map(function(x) {
        return exports.lpad(x.toString(16), '0', 2)
    }).join('');
};

/**
 * Convert a hex string to a byte array
 */
exports.hexToBytes = function(hex) {
    return hex.match(/../g).map(function(x) {
        return parseInt(x,16)
    });
}

/**
 * Convert a byte array to a base-64 string
 */
exports.bytesToBase64 = function(bytes) {
    var base64 = []

    for (var i = 0; i < bytes.length; i += 3) {
        var triplet = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];

        for (var j = 0; j < 4; j++) {
            if (i * 8 + j * 6 <= bytes.length * 8) {
                base64.push(base64map.charAt((triplet >>> 6 * (3 - j)) & 0x3F));
            } else {
                base64.push('=');
            }
        }
    }

    return base64.join('');
}

/**
 * Convert a base-64 string to a byte array
 */
exports.base64ToBytes = function(base64) {
    // Remove non-base-64 characters
    base64 = base64.replace(/[^A-Z0-9+\/]/ig, '');

    var bytes = []
    , imod4 = 0

    for (var i = 0; i < base64.length; imod4 = ++i % 4) {
        if (!imod4) continue

        bytes.push(
            (
                (base64map.indexOf(base64.charAt(i - 1)) & (Math.pow(2, -2 * imod4 + 8) - 1)) <<
                (imod4 * 2)
            ) |
                (base64map.indexOf(base64.charAt(i)) >>> (6 - imod4 * 2))
        );
    }

    return bytes;
}

/**
 * Hex only (allowing bin would be potentially risky, as 01010101 = \x01 * 4 or 85)
 */
exports.coerceToBytes = function(input) {
    if (typeof input != 'string') return input
    return exports.hexToBytes(input);
}

exports.binToBytes = function(bin) {
    return bin.match(/......../g).map(function(x) {
        return parseInt(x,2)
    });
}

exports.bytesToBin = function(bytes) {
    return bytes.map(function(x) {
        return exports.lpad(x.toString(2), '0', 8)
    }).join('');
}

exports.bytesToString = function(bytes) {
    return bytes.map(function(x){
        return String.fromCharCode(x)
    }).join('');
}

exports.stringToBytes = function(string) {
    return string.split('').map(function(x) {
        return x.charCodeAt(0)
    });
}

/**
 * Create a byte array representing a number with the given length
 */
exports.numToBytes = function(num, bytes) {
    if (bytes === undefined) bytes = 8;
    if (bytes === 0) return [];
    return [num % 256].concat(module.exports.numToBytes(Math.floor(num / 256), bytes - 1));
}

/**
 * Convert a byte array to the number that it represents
 */
exports.bytesToNum = function(bytes) {
    if (bytes.length === 0) return 0;
    return bytes[0] + 256 * module.exports.bytesToNum(bytes.slice(1));
}

/**
 * Turn an integer into a "var_int".
 *
 * "var_int" is a variable length integer used by Bitcoin's binary format.
 *
 * Returns a byte array.
 */
exports.numToVarInt = function(num) {
    if (num < 253) return [num];
    if (num < 65536) return [253].concat(exports.numToBytes(num, 2));
    if (num < 4294967296) return [254].concat(exports.numToBytes(num, 4));
    return [253].concat(exports.numToBytes(num, 8));
}

exports.bytesToWords = function (bytes) {
    var words = [];
    for (var i = 0, b = 0; i < bytes.length; i++, b += 8) {
        words[b >>> 5] |= bytes[i] << (24 - b % 32);
    }
    return words;
}

exports.wordsToBytes = function (words) {
    var bytes = [];
    for (var b = 0; b < words.length * 32; b += 8) {
        bytes.push((words[b >>> 5] >>> (24 - b % 32)) & 0xFF);
    }
    return bytes;
}

exports.bytesToWordArray = function (bytes) {
  return new WordArray.init(exports.bytesToWords(bytes), bytes.length)
}

exports.wordArrayToBytes = function (wordArray) {
  return exports.wordsToBytes(wordArray.words)
}


},{"crypto-js":10}],40:[function(require,module,exports){
var sec = require('./jsbn/sec');
var rng = require('secure-random');
var BigInteger = require('./jsbn/jsbn');
var convert = require('./convert')
var HmacSHA256 = require('crypto-js/hmac-sha256');

var ECPointFp = require('./jsbn/ec').ECPointFp;

var ecparams = sec("secp256k1");
var P_OVER_FOUR = null;

function implShamirsTrick(P, k, Q, l)
{
  var m = Math.max(k.bitLength(), l.bitLength());
  var Z = P.add2D(Q);
  var R = P.curve.getInfinity();

  for (var i = m - 1; i >= 0; --i) {
    R = R.twice2D();

    R.z = BigInteger.ONE;

    if (k.testBit(i)) {
      if (l.testBit(i)) {
        R = R.add2D(Z);
      } else {
        R = R.add2D(P);
      }
    } else {
      if (l.testBit(i)) {
        R = R.add2D(Q);
      }
    }
  }

  return R;
};

function deterministicGenerateK(hash,key) {
    var vArr = [];
    var kArr = [];
    for (var i = 0;i < 32;i++) vArr.push(1);
    for (var i = 0;i < 32;i++) kArr.push(0);
    var v = convert.bytesToWordArray(vArr)
    var k = convert.bytesToWordArray(kArr)

    k = HmacSHA256(convert.bytesToWordArray(vArr.concat([0]).concat(key).concat(hash)), k)
    v = HmacSHA256(v, k)
    vArr = convert.wordArrayToBytes(v)
    k = HmacSHA256(convert.bytesToWordArray(vArr.concat([1]).concat(key).concat(hash)), k)
    v = HmacSHA256(v,k)
    v = HmacSHA256(v,k)
    vArr = convert.wordArrayToBytes(v)
    return BigInteger.fromByteArrayUnsigned(vArr);
}

var ECDSA = {
  getBigRandom: function (limit) {
    return new BigInteger(limit.bitLength(), rng)
      .mod(limit.subtract(BigInteger.ONE))
      .add(BigInteger.ONE)
    ;
  },
  sign: function (hash, priv) {
    var d = priv;
    var n = ecparams.getN();
    var e = BigInteger.fromByteArrayUnsigned(hash);

    var k = deterministicGenerateK(hash,priv.toByteArrayUnsigned())
    var G = ecparams.getG();
    var Q = G.multiply(k);
    var r = Q.getX().toBigInteger().mod(n);

    var s = k.modInverse(n).multiply(e.add(d.multiply(r))).mod(n);

    return ECDSA.serializeSig(r, s);
  },

  verify: function (hash, sig, pubkey) {
    var r,s;
    if (Array.isArray(sig)) {
      var obj = ECDSA.parseSig(sig);
      r = obj.r;
      s = obj.s;
    } else if ("object" === typeof sig && sig.r && sig.s) {
      r = sig.r;
      s = sig.s;
    } else {
      throw new Error("Invalid value for signature");
    }

    var Q;
    if (pubkey instanceof ECPointFp) {
      Q = pubkey;
    } else if (Array.isArray(pubkey)) {
      Q = ECPointFp.decodeFrom(ecparams.getCurve(), pubkey);
    } else {
      throw new Error("Invalid format for pubkey value, must be byte array or ECPointFp");
    }
    var e = BigInteger.fromByteArrayUnsigned(hash);

    return ECDSA.verifyRaw(e, r, s, Q);
  },

  verifyRaw: function (e, r, s, Q) {
    var n = ecparams.getN();
    var G = ecparams.getG();

    if (r.compareTo(BigInteger.ONE) < 0 ||
        r.compareTo(n) >= 0)
      return false;

    if (s.compareTo(BigInteger.ONE) < 0 ||
        s.compareTo(n) >= 0)
      return false;

    var c = s.modInverse(n);

    var u1 = e.multiply(c).mod(n);
    var u2 = r.multiply(c).mod(n);

    // TODO(!!!): For some reason Shamir's trick isn't working with
    // signed message verification!? Probably an implementation
    // error!
    //var point = implShamirsTrick(G, u1, Q, u2);
    var point = G.multiply(u1).add(Q.multiply(u2));

    var v = point.getX().toBigInteger().mod(n);

    return v.equals(r);
  },

  /**
   * Serialize a signature into DER format.
   *
   * Takes two BigIntegers representing r and s and returns a byte array.
   */
  serializeSig: function (r, s) {
    var rBa = r.toByteArraySigned();
    var sBa = s.toByteArraySigned();

    var sequence = [];
    sequence.push(0x02); // INTEGER
    sequence.push(rBa.length);
    sequence = sequence.concat(rBa);

    sequence.push(0x02); // INTEGER
    sequence.push(sBa.length);
    sequence = sequence.concat(sBa);

    sequence.unshift(sequence.length);
    sequence.unshift(0x30); // SEQUENCE

    return sequence;
  },

  /**
   * Parses a byte array containing a DER-encoded signature.
   *
   * This function will return an object of the form:
   *
   * {
   *   r: BigInteger,
   *   s: BigInteger
   * }
   */
  parseSig: function (sig) {
    var cursor;
    if (sig[0] != 0x30)
      throw new Error("Signature not a valid DERSequence");

    cursor = 2;
    if (sig[cursor] != 0x02)
      throw new Error("First element in signature must be a DERInteger");;
    var rBa = sig.slice(cursor+2, cursor+2+sig[cursor+1]);

    cursor += 2+sig[cursor+1];
    if (sig[cursor] != 0x02)
      throw new Error("Second element in signature must be a DERInteger");
    var sBa = sig.slice(cursor+2, cursor+2+sig[cursor+1]);

    cursor += 2+sig[cursor+1];

    //if (cursor != sig.length)
    //  throw new Error("Extra bytes in signature");

    var r = BigInteger.fromByteArrayUnsigned(rBa);
    var s = BigInteger.fromByteArrayUnsigned(sBa);

    return {r: r, s: s};
  },

  parseSigCompact: function (sig) {
    if (sig.length !== 65) {
      throw new Error("Signature has the wrong length");
    }

    // Signature is prefixed with a type byte storing three bits of
    // information.
    var i = sig[0] - 27;
    if (i < 0 || i > 7) {
      throw new Error("Invalid signature type");
    }

    var n = ecparams.getN();
    var r = BigInteger.fromByteArrayUnsigned(sig.slice(1, 33)).mod(n);
    var s = BigInteger.fromByteArrayUnsigned(sig.slice(33, 65)).mod(n);

    return {r: r, s: s, i: i};
  },

  /**
   * Recover a public key from a signature.
   *
   * See SEC 1: Elliptic Curve Cryptography, section 4.1.6, "Public
   * Key Recovery Operation".
   *
   * http://www.secg.org/download/aid-780/sec1-v2.pdf
   */
  recoverPubKey: function (r, s, hash, i) {
    // The recovery parameter i has two bits.
    i = i & 3;

    // The less significant bit specifies whether the y coordinate
    // of the compressed point is even or not.
    var isYEven = i & 1;

    // The more significant bit specifies whether we should use the
    // first or second candidate key.
    var isSecondKey = i >> 1;

    var n = ecparams.getN();
    var G = ecparams.getG();
    var curve = ecparams.getCurve();
    var p = curve.getQ();
    var a = curve.getA().toBigInteger();
    var b = curve.getB().toBigInteger();

    // We precalculate (p + 1) / 4 where p is if the field order
    if (!P_OVER_FOUR) {
      P_OVER_FOUR = p.add(BigInteger.ONE).divide(BigInteger.valueOf(4));
    }

    // 1.1 Compute x
    var x = isSecondKey ? r.add(n) : r;

    // 1.3 Convert x to point
    var alpha = x.multiply(x).multiply(x).add(a.multiply(x)).add(b).mod(p);
    var beta = alpha.modPow(P_OVER_FOUR, p);

    var xorOdd = beta.isEven() ? (i % 2) : ((i+1) % 2);
    // If beta is even, but y isn't or vice versa, then convert it,
    // otherwise we're done and y == beta.
    var y = (beta.isEven() ? !isYEven : isYEven) ? beta : p.subtract(beta);

    // 1.4 Check that nR is at infinity
    var R = new ECPointFp(curve,
                          curve.fromBigInteger(x),
                          curve.fromBigInteger(y));
    R.validate();

    // 1.5 Compute e from M
    var e = BigInteger.fromByteArrayUnsigned(hash);
    var eNeg = BigInteger.ZERO.subtract(e).mod(n);

    // 1.6 Compute Q = r^-1 (sR - eG)
    var rInv = r.modInverse(n);
    var Q = implShamirsTrick(R, s, G, eNeg).multiply(rInv);

    Q.validate();
    if (!ECDSA.verifyRaw(e, r, s, Q)) {
      throw new Error("Pubkey recovery unsuccessful");
    }

    // TODO (shtylman) this is stupid because this file and eckey
    // have circular dependencies
    var ECPubKey = require('./eckey').ECPubKey;
    return ECPubKey(Q);
  },

  /**
   * Calculate pubkey extraction parameter.
   *
   * When extracting a pubkey from a signature, we have to
   * distinguish four different cases. Rather than putting this
   * burden on the verifier, Bitcoin includes a 2-bit value with the
   * signature.
   *
   * This function simply tries all four cases and returns the value
   * that resulted in a successful pubkey recovery.
   */
  calcPubkeyRecoveryParam: function (origPubkey, r, s, hash)
  {
    var address = origPubkey.getBitcoinAddress().toString();
    for (var i = 0; i < 4; i++) {
      var pubkey = ECDSA.recoverPubKey(r, s, hash, i);
      pubkey.compressed = origPubkey.compressed;
      if (pubkey.getBitcoinAddress().toString() == address) {
        return i;
      }
    }

    throw new Error("Unable to find valid recovery factor");
  }
};

module.exports = ECDSA;


},{"./convert":39,"./eckey":41,"./jsbn/ec":44,"./jsbn/jsbn":45,"./jsbn/sec":46,"crypto-js/hmac-sha256":8,"secure-random":36}],41:[function(require,module,exports){
var BigInteger = require('./jsbn/jsbn');
var sec = require('./jsbn/sec');
var base58 = require('./base58');
var util = require('./util');
var convert = require('./convert');
var Address = require('./address');
var ecdsa = require('./ecdsa');
var ECPointFp = require('./jsbn/ec').ECPointFp;
var Network = require('./network')
var mainnet = Network.mainnet.addressVersion
var testnet = Network.testnet.addressVersion

var ecparams = sec("secp256k1");

// input can be nothing, array of bytes, hex string, or base58 string
var ECKey = function (input,compressed,version) {
    if (!(this instanceof ECKey)) { return new ECKey(input,compressed); }
    if (!input) {
        // Generate new key
        var n = ecparams.getN();
        this.priv = ecdsa.getBigRandom(n);
        this.compressed = compressed || false;
        this.version = version || mainnet;
    }
    else this.import(input,compressed,version)
};

ECKey.prototype.import = function (input,compressed,version) {
    function has(li,v) { return li.indexOf(v) >= 0 }
    function fromBin(x) { return BigInteger.fromByteArrayUnsigned(x) }
    this.priv =
          input instanceof ECKey                   ? input.priv
        : input instanceof BigInteger              ? input.mod(ecparams.getN())
        : Array.isArray(input)                      ? fromBin(input.slice(0,32))
        : typeof input != "string"                 ? null
        : input.length == 44                       ? fromBin(convert.base64ToBytes(input))
        : input.length == 51 && input[0] == '5'    ? fromBin(base58.checkDecode(input))
        : input.length == 51 && input[0] == '9'    ? fromBin(base58.checkDecode(input))
        : input.length == 52 && has('LK',input[0]) ? fromBin(base58.checkDecode(input).slice(0,32))
        : input.length == 52 && input[0] == 'c'    ? fromBin(base58.checkDecode(input).slice(0,32))
        : has([64,65],input.length)                ? fromBin(convert.hexToBytes(input.slice(0,64)))
                                                   : null

    this.compressed =
          compressed !== undefined                 ? compressed
        : input instanceof ECKey                   ? input.compressed
        : input instanceof BigInteger              ? false
        : Array.isArray(input)                      ? false
        : typeof input != "string"                 ? null
        : input.length == 44                       ? false
        : input.length == 51 && input[0] == '5'    ? false
        : input.length == 51 && input[0] == '9'    ? false
        : input.length == 52 && has('LK',input[0]) ? true
        : input.length == 52 && input[0] == 'c'    ? true
        : input.length == 64                       ? false
        : input.length == 65                       ? true
                                                   : null

    this.version = 
          version !== undefined                    ? version
        : input instanceof ECKey                   ? input.version
        : input instanceof BigInteger              ? mainnet
        : Array.isArray(input)                      ? mainnet
        : typeof input != "string"                 ? null
        : input.length == 44                       ? mainnet
        : input.length == 51 && input[0] == '5'    ? mainnet
        : input.length == 51 && input[0] == '9'    ? testnet
        : input.length == 52 && has('LK',input[0]) ? mainnet
        : input.length == 52 && input[0] == 'c'    ? testnet
        : input.length == 64                       ? mainnet
        : input.length == 65                       ? mainnet
                                                   : null
};

ECKey.prototype.getPub = function(compressed) {
    if (compressed === undefined) compressed = this.compressed
    return ECPubKey(ecparams.getG().multiply(this.priv),compressed,this.version)
}

/**
 * @deprecated Reserved keyword, factory pattern. Use toHex, toBytes, etc.
 */
ECKey.prototype['export'] = function(format) {
    format || (format = 'hex')
    return this['to' + format.substr(0, 1).toUpperCase() + format.substr(1)]()
};

ECKey.prototype.toBin = function() {
    return convert.bytesToString(this.toBytes())
}

ECKey.prototype.toBase58 = function() {
    return base58.checkEncode(this.toBytes(), ECKey.version_bytes[this.version])
}

ECKey.prototype.toWif = ECKey.prototype.toBase58

ECKey.prototype.toHex = function() {
    return convert.bytesToHex(this.toBytes())
}

ECKey.prototype.toBytes = function() {
    var bytes = this.priv.toByteArrayUnsigned();
    if (this.compressed) bytes.push(1)
    return bytes
}

ECKey.prototype.toBase64 = function() {
    return convert.bytesToBase64(this.toBytes())
}

ECKey.prototype.toString = ECKey.prototype.toBase58

ECKey.prototype.getBitcoinAddress = function() {
    return this.getPub().getBitcoinAddress(this.version)
}

ECKey.prototype.add = function(key) {
    return ECKey(this.priv.add(ECKey(key).priv),this.compressed)
}

ECKey.prototype.multiply = function(key) {
    return ECKey(this.priv.multiply(ECKey(key).priv),this.compressed)
}

ECKey.version_bytes = {
  0: 128,
  111: 239
}

var ECPubKey = function(input,compressed,version) {
    if (!(this instanceof ECPubKey)) { return new ECPubKey(input,compressed,version); }
    if (!input) {
        // Generate new key
        var n = ecparams.getN();
        this.pub = ecparams.getG().multiply(ecdsa.getBigRandom(n))
        this.compressed = compressed || false;
        this.version = version || mainnet;
    }
    else this.import(input,compressed,version)
}

ECPubKey.prototype.import = function(input,compressed,version) {
    var decode = function(x) { return ECPointFp.decodeFrom(ecparams.getCurve(), x) }
    this.pub =
          input instanceof ECPointFp ? input
        : input instanceof ECKey     ? ecparams.getG().multiply(input.priv)
        : input instanceof ECPubKey  ? input.pub
        : typeof input == "string"   ? decode(convert.hexToBytes(input))
        : Array.isArray(input)        ? decode(input)
                                     : ecparams.getG().multiply(ecdsa.getBigRandom(ecparams.getN()))

    this.compressed =
          compressed                 ? compressed
        : input instanceof ECPointFp ? input.compressed
        : input instanceof ECPubKey  ? input.compressed
                                     : (this.pub[0] < 4)

    this.version =
          version                    ? version
        : input instanceof ECPointFp ? input.version
        : input instanceof ECPubKey  ? input.version
                                     : mainnet
}

ECPubKey.prototype.add = function(key) {
    return ECPubKey(this.pub.add(ECPubKey(key).pub),this.compressed,this.version)
}

ECPubKey.prototype.multiply = function(key) {
    return ECPubKey(this.pub.multiply(ECKey(key).priv),this.compressed,this.version)
}

ECPubKey.prototype['export'] = function(format) {
    format || (format = 'hex')
    return this['to' + format.substr(0, 1).toUpperCase() + format.substr(1)]()
}

ECPubKey.prototype.toBytes = function(compressed) {
    if (compressed === undefined) compressed = this.compressed
    return this.pub.getEncoded(compressed)
}

ECPubKey.prototype.toHex = function() {
    return convert.bytesToHex(this.toBytes())
}

ECPubKey.prototype.toBin = function() {
    return convert.bytesToString(this.toBytes())
}

ECPubKey.prototype.toBase58 = function() {
    return base58.checkEncode(this.toBytes(), this.version)
}

ECPubKey.prototype.toWif = ECPubKey.prototype.toBase58

ECPubKey.prototype.toString = function() {
    return this.getBitcoinAddress().toString()
}

ECPubKey.prototype.getBitcoinAddress = function() {
    return new Address(util.sha256ripe160(this.toBytes()), this.version);
}

ECKey.prototype.sign = function (hash) {
  return ecdsa.sign(hash, this.priv);
};

ECKey.prototype.verify = function (hash, sig) {
  return ecdsa.verify(hash, sig, this.getPub()['export']('bytes'));
};

/**
 * Parse an exported private key contained in a string.
 */


module.exports = { ECKey: ECKey, ECPubKey: ECPubKey };

},{"./address":37,"./base58":38,"./convert":39,"./ecdsa":40,"./jsbn/ec":44,"./jsbn/jsbn":45,"./jsbn/sec":46,"./network":48,"./util":52}],42:[function(require,module,exports){
var convert = require('./convert.js')
var base58 = require('./base58.js')
var assert = require('assert')
var format = require('util').format
var util = require('./util.js')
var Crypto = require('crypto-js');
var HmacSHA512 = Crypto.HmacSHA512
var ECKey = require('./eckey.js').ECKey
var ECPubKey = require('./eckey.js').ECPubKey
var Address = require('./address.js')
var Network = require('./network')

var HDWallet = module.exports = function(seed, network) {
    if (seed === undefined) return

    var seedWords = convert.bytesToWordArray(seed)
    var I = convert.wordArrayToBytes(HmacSHA512(seedWords, 'Bitcoin seed'))
    this.chaincode = I.slice(32)
    this.network = network || 'mainnet'
    if(!Network.hasOwnProperty(this.network)) {
      throw new Error("Unknown network: " + this.network)
    }

    this.priv = new ECKey(I.slice(0, 32).concat([1]), true, this.getKeyVersion())
    this.pub = this.priv.getPub()
    this.index = 0
    this.depth = 0
}

HDWallet.HIGHEST_BIT = 0x80000000
HDWallet.LENGTH = 78

function arrayEqual(a, b) {
    return !(a < b || a > b)
}

HDWallet.getChecksum = base58.getChecksum;

HDWallet.fromSeedHex = function(hex, network) {
    return new HDWallet(convert.hexToBytes(hex), network)
}

HDWallet.fromSeedString = function(string, network) {
    return new HDWallet(convert.stringToBytes(string), network)
}

HDWallet.fromBase58 = function(input) {
    var buffer = base58.decode(input)

    if (buffer.length == HDWallet.LENGTH + 4) {
        var expectedChecksum = buffer.slice(HDWallet.LENGTH, HDWallet.LENGTH + 4)
        buffer = buffer.slice(0, HDWallet.LENGTH)
        var actualChecksum = HDWallet.getChecksum(buffer)

        if (!arrayEqual(expectedChecksum, actualChecksum)) {
            throw new Error('Checksum mismatch')
        }
    }

    return HDWallet.fromBytes(buffer)
}

HDWallet.fromHex = function(input) {
    return HDWallet.fromBytes(convert.hexToBytes(input))
}

HDWallet.fromBytes = function(input) {
    // This 78 byte structure can be encoded like other Bitcoin data in Base58. (+32 bits checksum)
    if (input.length != HDWallet.LENGTH) {
        throw new Error(format('Invalid input length, %s. Expected %s.', input.length, HDWallet.LENGTH))
    }

    var hd = new HDWallet()

    // 4 byte: version bytes (mainnet: 0x0488B21E public, 0x0488ADE4 private;
    // testnet: 0x043587CF public, 0x04358394 private)
    var versionBytes = input.slice(0, 4)
    var versionWord = convert.bytesToWords(versionBytes)[0]
    var type

    for(var name in Network) {
        var network = Network[name]
        for(var t in network.hdVersions) {
            if (versionWord != network.hdVersions[t]) continue
            type = t
            hd.network = name
        }
    }

    if (!hd.network) {
        throw new Error(format('Could not find version %s', convert.bytesToHex(versionBytes)))
    }

    // 1 byte: depth: 0x00 for master nodes, 0x01 for level-1 descendants, ...
    hd.depth = input[4]

    // 4 bytes: the fingerprint of the parent's key (0x00000000 if master key)
    hd.parentFingerprint = input.slice(5, 9)
    assert((hd.depth === 0) == arrayEqual(hd.parentFingerprint, [0, 0, 0, 0]))

    // 4 bytes: child number. This is the number i in xi = xpar/i, with xi the key being serialized.
    // This is encoded in MSB order. (0x00000000 if master key)
    hd.index = convert.bytesToNum(input.slice(9, 13).reverse())
    assert(hd.depth > 0 || hd.index === 0)

    // 32 bytes: the chain code
    hd.chaincode = input.slice(13, 45)

    // 33 bytes: the public key or private key data (0x02 + X or 0x03 + X for
    // public keys, 0x00 + k for private keys)
    if (type == 'priv') {
        hd.priv = new ECKey(input.slice(46, 78).concat([1]), true, hd.getKeyVersion())
        hd.pub = hd.priv.getPub()
    } else {
        hd.pub = new ECPubKey(input.slice(45, 78), true, hd.getKeyVersion())
    }

    return hd
}

HDWallet.prototype.getIdentifier = function() {
    return util.sha256ripe160(this.pub.toBytes())
}

HDWallet.prototype.getFingerprint = function() {
    return this.getIdentifier().slice(0, 4)
}

HDWallet.prototype.getBitcoinAddress = function() {
    return new Address(util.sha256ripe160(this.pub.toBytes()), this.getKeyVersion())
}

HDWallet.prototype.toBytes = function(priv) {
    var buffer = []

    // Version
    // 4 byte: version bytes (mainnet: 0x0488B21E public, 0x0488ADE4 private; testnet: 0x043587CF public,
    // 0x04358394 private)
    var version = Network[this.network].hdVersions[priv ? 'priv' : 'pub']
    var vBytes = convert.wordsToBytes([version])

    buffer = buffer.concat(vBytes)
    assert.equal(buffer.length, 4)

    // Depth
    // 1 byte: depth: 0x00 for master nodes, 0x01 for level-1 descendants, ....
    buffer.push(this.depth)
    assert.equal(buffer.length, 4 + 1)

    // 4 bytes: the fingerprint of the parent's key (0x00000000 if master key)
    buffer = buffer.concat(this.depth ? this.parentFingerprint : [0, 0, 0, 0])
    assert.equal(buffer.length, 4 + 1 + 4)

    // 4 bytes: child number. This is the number i in xi = xpar/i, with xi the key being serialized.
    // This is encoded in MSB order. (0x00000000 if master key)
    buffer = buffer.concat(convert.numToBytes(this.index, 4).reverse())
    assert.equal(buffer.length, 4 + 1 + 4 + 4)

    // 32 bytes: the chain code
    buffer = buffer.concat(this.chaincode)
    assert.equal(buffer.length, 4 + 1 + 4 + 4 + 32)

    // 33 bytes: the public key or private key data
    // (0x02 + X or 0x03 + X for public keys, 0x00 + k for private keys)
    if (priv) {
        assert(this.priv, 'Cannot serialize to private without private key')
        buffer.push(0)
        buffer = buffer.concat(this.priv.toBytes().slice(0, 32))
    } else {
        buffer = buffer.concat(this.pub.toBytes(true))
    }

    return buffer
}

HDWallet.prototype.toHex = function(priv) {
    var bytes = this.toBytes(priv)
    return convert.bytesToHex(bytes)
}

HDWallet.prototype.toBase58 = function(priv) {
    var buffer = this.toBytes(priv)
    , checksum = HDWallet.getChecksum(buffer)
    buffer = buffer.concat(checksum)
    return base58.encode(buffer)
}

HDWallet.prototype.derive = function(i) {
    var I
    , iBytes = convert.numToBytes(i, 4).reverse()
    , cPar = this.chaincode
    , usePriv = i >= HDWallet.HIGHEST_BIT
    , SHA512 = Crypto.algo.SHA512

    if (usePriv) {
        assert(this.priv, 'Private derive on public key')

        // If 1, private derivation is used:
        // let I = HMAC-SHA512(Key = cpar, Data = 0x00 || kpar || i) [Note:]
        var kPar = this.priv.toBytes().slice(0, 32)
        I = util.HmacFromBytesToBytes(SHA512, [0].concat(kPar, iBytes), cPar)
    } else {
        // If 0, public derivation is used:
        // let I = HMAC-SHA512(Key = cpar, Data = χ(kpar*G) || i)
        var KPar = this.pub.toBytes(true)
        I = util.HmacFromBytesToBytes(SHA512, KPar.concat(iBytes), cPar)
    }

    // Split I = IL || IR into two 32-byte sequences, IL and IR.
    var IL = I.slice(0, 32)
    , IR = I.slice(32)

    var hd = new HDWallet()
    hd.network = this.network

    if (this.priv) {
        // ki = IL + kpar (mod n).
        hd.priv = this.priv.add(new ECKey(IL.concat([1])))
        hd.priv.compressed = true
        hd.priv.version = this.getKeyVersion()
        hd.pub = hd.priv.getPub()
    } else {
        // Ki = (IL + kpar)*G = IL*G + Kpar
        hd.pub = this.pub.add(new ECKey(IL.concat([1]), true, this.getKeyVersion()).getPub())
    }

    // ci = IR.
    hd.chaincode = IR
    hd.parentFingerprint = this.getFingerprint()
    hd.depth = this.depth + 1
    hd.index = i
    hd.pub.compressed = true
    return hd
}

HDWallet.prototype.derivePrivate = function(index) {
    return this.derive(index + HDWallet.HIGHEST_BIT)
}

HDWallet.prototype.getKeyVersion = function() {
    return Network[this.network].addressVersion
}

HDWallet.prototype.toString = HDWallet.prototype.toBase58


},{"./address.js":37,"./base58.js":38,"./convert.js":39,"./eckey.js":41,"./network":48,"./util.js":52,"assert":54,"crypto-js":10,"util":61}],43:[function(require,module,exports){
var Key = require('./eckey');

module.exports = {
    Address: require('./address'),
    Key: Key.ECKey,
    ECKey: Key.ECKey,
    ECPubKey: Key.ECPubKey,
    Message: require('./message'),
    BigInteger: require('./jsbn/jsbn'),
    Crypto: require('crypto-js'), //should we expose this at all?
    Script: require('./script'),
    Opcode: require('./opcode'),
    Transaction: require('./transaction').Transaction,
    Util: require('./util'),
    TransactionIn: require('./transaction').TransactionIn,
    TransactionOut: require('./transaction').TransactionOut,
    ECPointFp: require('./jsbn/ec').ECPointFp,
    Wallet: require('./wallet'),
    network: require('./network'),

    ecdsa: require('./ecdsa'),
    HDWallet: require('./hdwallet.js'),

    // base58 encoding/decoding to bytes
    base58: require('./base58'),

    // conversions
    convert: require('./convert')
}

},{"./address":37,"./base58":38,"./convert":39,"./ecdsa":40,"./eckey":41,"./hdwallet.js":42,"./jsbn/ec":44,"./jsbn/jsbn":45,"./message":47,"./network":48,"./opcode":49,"./script":50,"./transaction":51,"./util":52,"./wallet":53,"crypto-js":10}],44:[function(require,module,exports){
// Basic Javascript Elliptic Curve implementation
// Ported loosely from BouncyCastle's Java EC code
// Only Fp curves implemented for now

var BigInteger = require('./jsbn'),
    sec = require('./sec');

// ----------------
// ECFieldElementFp

// constructor
function ECFieldElementFp(q,x) {
    this.x = x;
    // TODO if(x.compareTo(q) >= 0) error
    this.q = q;
}

function feFpEquals(other) {
    if(other == this) return true;
    return (this.q.equals(other.q) && this.x.equals(other.x));
}

function feFpToBigInteger() {
    return this.x;
}

function feFpNegate() {
    return new ECFieldElementFp(this.q, this.x.negate().mod(this.q));
}

function feFpAdd(b) {
    return new ECFieldElementFp(this.q, this.x.add(b.toBigInteger()).mod(this.q));
}

function feFpSubtract(b) {
    return new ECFieldElementFp(this.q, this.x.subtract(b.toBigInteger()).mod(this.q));
}

function feFpMultiply(b) {
    return new ECFieldElementFp(this.q, this.x.multiply(b.toBigInteger()).mod(this.q));
}

function feFpSquare() {
    return new ECFieldElementFp(this.q, this.x.square().mod(this.q));
}

function feFpDivide(b) {
    return new ECFieldElementFp(this.q, this.x.multiply(b.toBigInteger().modInverse(this.q)).mod(this.q));
}

ECFieldElementFp.prototype.equals = feFpEquals;
ECFieldElementFp.prototype.toBigInteger = feFpToBigInteger;
ECFieldElementFp.prototype.negate = feFpNegate;
ECFieldElementFp.prototype.add = feFpAdd;
ECFieldElementFp.prototype.subtract = feFpSubtract;
ECFieldElementFp.prototype.multiply = feFpMultiply;
ECFieldElementFp.prototype.square = feFpSquare;
ECFieldElementFp.prototype.divide = feFpDivide;

// ----------------
// ECPointFp

// constructor
function ECPointFp(curve,x,y,z) {
    this.curve = curve;
    this.x = x;
    this.y = y;
    // Projective coordinates: either zinv == null or z * zinv == 1
    // z and zinv are just BigIntegers, not fieldElements
    if(z == null) {
      this.z = BigInteger.ONE;
    }
    else {
      this.z = z;
    }
    this.zinv = null;
    //TODO: compression flag
}

function pointFpGetX() {
    if(this.zinv == null) {
      this.zinv = this.z.modInverse(this.curve.q);
    }
    return this.curve.fromBigInteger(this.x.toBigInteger().multiply(this.zinv).mod(this.curve.q));
}

function pointFpGetY() {
    if(this.zinv == null) {
      this.zinv = this.z.modInverse(this.curve.q);
    }
    return this.curve.fromBigInteger(this.y.toBigInteger().multiply(this.zinv).mod(this.curve.q));
}

function pointFpEquals(other) {
    if(other == this) return true;
    if(this.isInfinity()) return other.isInfinity();
    if(other.isInfinity()) return this.isInfinity();
    var u, v;
    // u = Y2 * Z1 - Y1 * Z2
    u = other.y.toBigInteger().multiply(this.z).subtract(this.y.toBigInteger().multiply(other.z)).mod(this.curve.q);
    if(!u.equals(BigInteger.ZERO)) return false;
    // v = X2 * Z1 - X1 * Z2
    v = other.x.toBigInteger().multiply(this.z).subtract(this.x.toBigInteger().multiply(other.z)).mod(this.curve.q);
    return v.equals(BigInteger.ZERO);
}

function pointFpIsInfinity() {
    if((this.x == null) && (this.y == null)) return true;
    return this.z.equals(BigInteger.ZERO) && !this.y.toBigInteger().equals(BigInteger.ZERO);
}

function pointFpNegate() {
    return new ECPointFp(this.curve, this.x, this.y.negate(), this.z);
}

function pointFpAdd(b) {
    if(this.isInfinity()) return b;
    if(b.isInfinity()) return this;

    // u = Y2 * Z1 - Y1 * Z2
    var u = b.y.toBigInteger().multiply(this.z).subtract(this.y.toBigInteger().multiply(b.z)).mod(this.curve.q);
    // v = X2 * Z1 - X1 * Z2
    var v = b.x.toBigInteger().multiply(this.z).subtract(this.x.toBigInteger().multiply(b.z)).mod(this.curve.q);

    if(BigInteger.ZERO.equals(v)) {
        if(BigInteger.ZERO.equals(u)) {
            return this.twice(); // this == b, so double
        }
	return this.curve.getInfinity(); // this = -b, so infinity
    }

    var THREE = new BigInteger("3");
    var x1 = this.x.toBigInteger();
    var y1 = this.y.toBigInteger();
    var x2 = b.x.toBigInteger();
    var y2 = b.y.toBigInteger();

    var v2 = v.square();
    var v3 = v2.multiply(v);
    var x1v2 = x1.multiply(v2);
    var zu2 = u.square().multiply(this.z);

    // x3 = v * (z2 * (z1 * u^2 - 2 * x1 * v^2) - v^3)
    var x3 = zu2.subtract(x1v2.shiftLeft(1)).multiply(b.z).subtract(v3).multiply(v).mod(this.curve.q);
    // y3 = z2 * (3 * x1 * u * v^2 - y1 * v^3 - z1 * u^3) + u * v^3
    var y3 = x1v2.multiply(THREE).multiply(u).subtract(y1.multiply(v3)).subtract(zu2.multiply(u)).multiply(b.z).add(u.multiply(v3)).mod(this.curve.q);
    // z3 = v^3 * z1 * z2
    var z3 = v3.multiply(this.z).multiply(b.z).mod(this.curve.q);

    return new ECPointFp(this.curve, this.curve.fromBigInteger(x3), this.curve.fromBigInteger(y3), z3);
}

function pointFpTwice() {
    if(this.isInfinity()) return this;
    if(this.y.toBigInteger().signum() == 0) return this.curve.getInfinity();

    // TODO: optimized handling of constants
    var THREE = new BigInteger("3");
    var x1 = this.x.toBigInteger();
    var y1 = this.y.toBigInteger();

    var y1z1 = y1.multiply(this.z);
    var y1sqz1 = y1z1.multiply(y1).mod(this.curve.q);
    var a = this.curve.a.toBigInteger();

    // w = 3 * x1^2 + a * z1^2
    var w = x1.square().multiply(THREE);
    if(!BigInteger.ZERO.equals(a)) {
      w = w.add(this.z.square().multiply(a));
    }
    w = w.mod(this.curve.q);
    // x3 = 2 * y1 * z1 * (w^2 - 8 * x1 * y1^2 * z1)
    var x3 = w.square().subtract(x1.shiftLeft(3).multiply(y1sqz1)).shiftLeft(1).multiply(y1z1).mod(this.curve.q);
    // y3 = 4 * y1^2 * z1 * (3 * w * x1 - 2 * y1^2 * z1) - w^3
    var y3 = w.multiply(THREE).multiply(x1).subtract(y1sqz1.shiftLeft(1)).shiftLeft(2).multiply(y1sqz1).subtract(w.square().multiply(w)).mod(this.curve.q);
    // z3 = 8 * (y1 * z1)^3
    var z3 = y1z1.square().multiply(y1z1).shiftLeft(3).mod(this.curve.q);

    return new ECPointFp(this.curve, this.curve.fromBigInteger(x3), this.curve.fromBigInteger(y3), z3);
}

// Simple NAF (Non-Adjacent Form) multiplication algorithm
// TODO: modularize the multiplication algorithm
function pointFpMultiply(k) {
    if(this.isInfinity()) return this;
    if(k.signum() == 0) return this.curve.getInfinity();

    var e = k;
    var h = e.multiply(new BigInteger("3"));

    var neg = this.negate();
    var R = this;

    var i;
    for(i = h.bitLength() - 2; i > 0; --i) {
	R = R.twice();

	var hBit = h.testBit(i);
	var eBit = e.testBit(i);

	if (hBit != eBit) {
	    R = R.add(hBit ? this : neg);
	}
    }

    return R;
}

// Compute this*j + x*k (simultaneous multiplication)
function pointFpMultiplyTwo(j,x,k) {
  var i;
  if(j.bitLength() > k.bitLength())
    i = j.bitLength() - 1;
  else
    i = k.bitLength() - 1;

  var R = this.curve.getInfinity();
  var both = this.add(x);
  while(i >= 0) {
    R = R.twice();
    if(j.testBit(i)) {
      if(k.testBit(i)) {
        R = R.add(both);
      }
      else {
        R = R.add(this);
      }
    }
    else {
      if(k.testBit(i)) {
        R = R.add(x);
      }
    }
    --i;
  }

  return R;
}

ECPointFp.prototype.getX = pointFpGetX;
ECPointFp.prototype.getY = pointFpGetY;
ECPointFp.prototype.equals = pointFpEquals;
ECPointFp.prototype.isInfinity = pointFpIsInfinity;
ECPointFp.prototype.negate = pointFpNegate;
ECPointFp.prototype.add = pointFpAdd;
ECPointFp.prototype.twice = pointFpTwice;
ECPointFp.prototype.multiply = pointFpMultiply;
ECPointFp.prototype.multiplyTwo = pointFpMultiplyTwo;

// ----------------
// ECCurveFp

// constructor
function ECCurveFp(q,a,b) {
    this.q = q;
    this.a = this.fromBigInteger(a);
    this.b = this.fromBigInteger(b);
    this.infinity = new ECPointFp(this, null, null);
}

function curveFpGetQ() {
    return this.q;
}

function curveFpGetA() {
    return this.a;
}

function curveFpGetB() {
    return this.b;
}

function curveFpEquals(other) {
    if(other == this) return true;
    return(this.q.equals(other.q) && this.a.equals(other.a) && this.b.equals(other.b));
}

function curveFpGetInfinity() {
    return this.infinity;
}

function curveFpFromBigInteger(x) {
    return new ECFieldElementFp(this.q, x);
}

// for now, work with hex strings because they're easier in JS
function curveFpDecodePointHex(s) {
    switch(parseInt(s.substr(0,2), 16)) { // first byte
    case 0:
	return this.infinity;
    case 2:
    case 3:
	// point compression not supported yet
	return null;
    case 4:
    case 6:
    case 7:
	var len = (s.length - 2) / 2;
	var xHex = s.substr(2, len);
	var yHex = s.substr(len+2, len);

	return new ECPointFp(this,
			     this.fromBigInteger(new BigInteger(xHex, 16)),
			     this.fromBigInteger(new BigInteger(yHex, 16)));

    default: // unsupported
	return null;
    }
}

ECCurveFp.prototype.getQ = curveFpGetQ;
ECCurveFp.prototype.getA = curveFpGetA;
ECCurveFp.prototype.getB = curveFpGetB;
ECCurveFp.prototype.equals = curveFpEquals;
ECCurveFp.prototype.getInfinity = curveFpGetInfinity;
ECCurveFp.prototype.fromBigInteger = curveFpFromBigInteger;
ECCurveFp.prototype.decodePointHex = curveFpDecodePointHex;

// prepends 0 if bytes < len
// cuts off start if bytes > len
function integerToBytes(i, len) {
  var bytes = i.toByteArrayUnsigned();

  if (len < bytes.length) {
    bytes = bytes.slice(bytes.length-len);
  } else while (len > bytes.length) {
    bytes.unshift(0);
  }

  return bytes;
};

ECFieldElementFp.prototype.getByteLength = function () {
  return Math.floor((this.toBigInteger().bitLength() + 7) / 8);
};

ECPointFp.prototype.getEncoded = function (compressed) {
  var x = this.getX().toBigInteger();
  var y = this.getY().toBigInteger();

  // Get value as a 32-byte Buffer
  // Fixed length based on a patch by bitaddress.org and Casascius
  var enc = integerToBytes(x, 32);

  if (compressed) {
    if (y.isEven()) {
      // Compressed even pubkey
      // M = 02 || X
      enc.unshift(0x02);
    } else {
      // Compressed uneven pubkey
      // M = 03 || X
      enc.unshift(0x03);
    }
  } else {
    // Uncompressed pubkey
    // M = 04 || X || Y
    enc.unshift(0x04);
    enc = enc.concat(integerToBytes(y, 32));
  }
  return enc;
};

ECPointFp.decodeFrom = function (ecparams, enc) {
  var type = enc[0];
  var dataLen = enc.length-1;

  // Extract x and y as byte arrays
  if (type == 4) {
    var xBa = enc.slice(1, 1 + dataLen/2),
        yBa = enc.slice(1 + dataLen/2, 1 + dataLen),
        x = BigInteger.fromByteArrayUnsigned(xBa),
        y = BigInteger.fromByteArrayUnsigned(yBa);
  }
  else {
    var xBa = enc.slice(1),
        x = BigInteger.fromByteArrayUnsigned(xBa),
        p = ecparams.getQ(),
        xCubedPlus7 = x.multiply(x).multiply(x).add(new BigInteger('7')).mod(p),
        pPlus1Over4 = p.add(new BigInteger('1'))
                       .divide(new BigInteger('4')),
        y = xCubedPlus7.modPow(pPlus1Over4,p);
    if (y.mod(new BigInteger('2')).toString() != ''+(type % 2)) {
        y = p.subtract(y)
    }
  }

  // Prepend zero byte to prevent interpretation as negative integer

  // Convert to BigIntegers

  // Return point
  return new ECPointFp(ecparams,
                       ecparams.fromBigInteger(x),
                       ecparams.fromBigInteger(y));
};

ECPointFp.prototype.add2D = function (b) {
  if(this.isInfinity()) return b;
  if(b.isInfinity()) return this;

  if (this.x.equals(b.x)) {
    if (this.y.equals(b.y)) {
      // this = b, i.e. this must be doubled
      return this.twice();
    }
    // this = -b, i.e. the result is the point at infinity
    return this.curve.getInfinity();
  }

  var x_x = b.x.subtract(this.x);
  var y_y = b.y.subtract(this.y);
  var gamma = y_y.divide(x_x);

  var x3 = gamma.square().subtract(this.x).subtract(b.x);
  var y3 = gamma.multiply(this.x.subtract(x3)).subtract(this.y);

  return new ECPointFp(this.curve, x3, y3);
};

ECPointFp.prototype.twice2D = function () {
  if (this.isInfinity()) return this;
  if (this.y.toBigInteger().signum() == 0) {
    // if y1 == 0, then (x1, y1) == (x1, -y1)
    // and hence this = -this and thus 2(x1, y1) == infinity
    return this.curve.getInfinity();
  }

  var TWO = this.curve.fromBigInteger(BigInteger.valueOf(2));
  var THREE = this.curve.fromBigInteger(BigInteger.valueOf(3));
  var gamma = this.x.square().multiply(THREE).add(this.curve.a).divide(this.y.multiply(TWO));

  var x3 = gamma.square().subtract(this.x.multiply(TWO));
  var y3 = gamma.multiply(this.x.subtract(x3)).subtract(this.y);

  return new ECPointFp(this.curve, x3, y3);
};

ECPointFp.prototype.multiply2D = function (k) {
  if(this.isInfinity()) return this;
  if(k.signum() == 0) return this.curve.getInfinity();

  var e = k;
  var h = e.multiply(new BigInteger("3"));

  var neg = this.negate();
  var R = this;

  var i;
  for (i = h.bitLength() - 2; i > 0; --i) {
    R = R.twice();

    var hBit = h.testBit(i);
    var eBit = e.testBit(i);

    if (hBit != eBit) {
      R = R.add2D(hBit ? this : neg);
    }
  }

  return R;
};

ECPointFp.prototype.isOnCurve = function () {
  var x = this.getX().toBigInteger();
  var y = this.getY().toBigInteger();
  var a = this.curve.getA().toBigInteger();
  var b = this.curve.getB().toBigInteger();
  var n = this.curve.getQ();
  var lhs = y.multiply(y).mod(n);
  var rhs = x.multiply(x).multiply(x)
    .add(a.multiply(x)).add(b).mod(n);
  return lhs.equals(rhs);
};

ECPointFp.prototype.toString = function () {
  return '('+this.getX().toBigInteger().toString()+','+
    this.getY().toBigInteger().toString()+')';
};

/**
 * Validate an elliptic curve point.
 *
 * See SEC 1, section 3.2.2.1: Elliptic Curve Public Key Validation Primitive
 */
ECPointFp.prototype.validate = function () {
  var n = this.curve.getQ();

  // Check Q != O
  if (this.isInfinity()) {
    throw new Error("Point is at infinity.");
  }

  // Check coordinate bounds
  var x = this.getX().toBigInteger();
  var y = this.getY().toBigInteger();
  if (x.compareTo(BigInteger.ONE) < 0 ||
      x.compareTo(n.subtract(BigInteger.ONE)) > 0) {
    throw new Error('x coordinate out of bounds');
  }
  if (y.compareTo(BigInteger.ONE) < 0 ||
      y.compareTo(n.subtract(BigInteger.ONE)) > 0) {
    throw new Error('y coordinate out of bounds');
  }

  // Check y^2 = x^3 + ax + b (mod n)
  if (!this.isOnCurve()) {
    throw new Error("Point is not on the curve.");
  }

  // Check nQ = 0 (Q is a scalar multiple of G)
  if (this.multiply(n).isInfinity()) {
    // TODO: This check doesn't work - fix.
    throw new Error("Point is not a scalar multiple of G.");
  }

  return true;
};


module.exports = ECCurveFp;
module.exports.ECPointFp = ECPointFp;

},{"./jsbn":45,"./sec":46}],45:[function(require,module,exports){
// Copyright (c) 2005  Tom Wu
// All Rights Reserved.
// See "LICENSE" for details.

// Basic JavaScript BN library - subset useful for RSA encryption.

// Bits per digit
var dbits;

// JavaScript engine analysis
var canary = 0xdeadbeefcafe;
var j_lm = ((canary&0xffffff)==0xefcafe);

// (public) Constructor
function BigInteger(a,b,c) {
  if (!(this instanceof BigInteger)) {
    return new BigInteger(a, b, c);
  }

  if(a != null) {
    if("number" == typeof a) this.fromNumber(a,b,c);
    else if(b == null && "string" != typeof a) this.fromString(a,256);
    else this.fromString(a,b);
  }
}

var proto = BigInteger.prototype;

// return new, unset BigInteger
function nbi() { return new BigInteger(null); }

// am: Compute w_j += (x*this_i), propagate carries,
// c is initial carry, returns final carry.
// c < 3*dvalue, x < 2*dvalue, this_i < dvalue
// We need to select the fastest one that works in this environment.

// am1: use a single mult and divide to get the high bits,
// max digit bits should be 26 because
// max internal value = 2*dvalue^2-2*dvalue (< 2^53)
function am1(i,x,w,j,c,n) {
  while(--n >= 0) {
    var v = x*this[i++]+w[j]+c;
    c = Math.floor(v/0x4000000);
    w[j++] = v&0x3ffffff;
  }
  return c;
}
// am2 avoids a big mult-and-extract completely.
// Max digit bits should be <= 30 because we do bitwise ops
// on values up to 2*hdvalue^2-hdvalue-1 (< 2^31)
function am2(i,x,w,j,c,n) {
  var xl = x&0x7fff, xh = x>>15;
  while(--n >= 0) {
    var l = this[i]&0x7fff;
    var h = this[i++]>>15;
    var m = xh*l+h*xl;
    l = xl*l+((m&0x7fff)<<15)+w[j]+(c&0x3fffffff);
    c = (l>>>30)+(m>>>15)+xh*h+(c>>>30);
    w[j++] = l&0x3fffffff;
  }
  return c;
}
// Alternately, set max digit bits to 28 since some
// browsers slow down when dealing with 32-bit numbers.
function am3(i,x,w,j,c,n) {
  var xl = x&0x3fff, xh = x>>14;
  while(--n >= 0) {
    var l = this[i]&0x3fff;
    var h = this[i++]>>14;
    var m = xh*l+h*xl;
    l = xl*l+((m&0x3fff)<<14)+w[j]+c;
    c = (l>>28)+(m>>14)+xh*h;
    w[j++] = l&0xfffffff;
  }
  return c;
}

// wtf?
BigInteger.prototype.am = am1;
dbits = 26;

/*
if(j_lm && (navigator.appName == "Microsoft Internet Explorer")) {
  BigInteger.prototype.am = am2;
  dbits = 30;
}
else if(j_lm && (navigator.appName != "Netscape")) {
  BigInteger.prototype.am = am1;
  dbits = 26;
}
else { // Mozilla/Netscape seems to prefer am3
  BigInteger.prototype.am = am3;
  dbits = 28;
}
*/

BigInteger.prototype.DB = dbits;
BigInteger.prototype.DM = ((1<<dbits)-1);
var DV = BigInteger.prototype.DV = (1<<dbits);

var BI_FP = 52;
BigInteger.prototype.FV = Math.pow(2,BI_FP);
BigInteger.prototype.F1 = BI_FP-dbits;
BigInteger.prototype.F2 = 2*dbits-BI_FP;

// Digit conversions
var BI_RM = "0123456789abcdefghijklmnopqrstuvwxyz";
var BI_RC = new Array();
var rr,vv;
rr = "0".charCodeAt(0);
for(vv = 0; vv <= 9; ++vv) BI_RC[rr++] = vv;
rr = "a".charCodeAt(0);
for(vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;
rr = "A".charCodeAt(0);
for(vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;

function int2char(n) { return BI_RM.charAt(n); }
function intAt(s,i) {
  var c = BI_RC[s.charCodeAt(i)];
  return (c==null)?-1:c;
}

// (protected) copy this to r
function bnpCopyTo(r) {
  for(var i = this.t-1; i >= 0; --i) r[i] = this[i];
  r.t = this.t;
  r.s = this.s;
}

// (protected) set from integer value x, -DV <= x < DV
function bnpFromInt(x) {
  this.t = 1;
  this.s = (x<0)?-1:0;
  if(x > 0) this[0] = x;
  else if(x < -1) this[0] = x+DV;
  else this.t = 0;
}

// return bigint initialized to value
function nbv(i) { var r = nbi(); r.fromInt(i); return r; }

// (protected) set from string and radix
function bnpFromString(s,b) {
  var self = this;

  var k;
  if(b == 16) k = 4;
  else if(b == 8) k = 3;
  else if(b == 256) k = 8; // byte array
  else if(b == 2) k = 1;
  else if(b == 32) k = 5;
  else if(b == 4) k = 2;
  else { self.fromRadix(s,b); return; }
  self.t = 0;
  self.s = 0;
  var i = s.length, mi = false, sh = 0;
  while(--i >= 0) {
    var x = (k==8)?s[i]&0xff:intAt(s,i);
    if(x < 0) {
      if(s.charAt(i) == "-") mi = true;
      continue;
    }
    mi = false;
    if(sh == 0)
      self[self.t++] = x;
    else if(sh+k > self.DB) {
      self[self.t-1] |= (x&((1<<(self.DB-sh))-1))<<sh;
      self[self.t++] = (x>>(self.DB-sh));
    }
    else
      self[self.t-1] |= x<<sh;
    sh += k;
    if(sh >= self.DB) sh -= self.DB;
  }
  if(k == 8 && (s[0]&0x80) != 0) {
    self.s = -1;
    if(sh > 0) self[self.t-1] |= ((1<<(self.DB-sh))-1)<<sh;
  }
  self.clamp();
  if(mi) BigInteger.ZERO.subTo(self,self);
}

// (protected) clamp off excess high words
function bnpClamp() {
  var c = this.s&this.DM;
  while(this.t > 0 && this[this.t-1] == c) --this.t;
}

// (public) return string representation in given radix
function bnToString(b) {
  var self = this;
  if(self.s < 0) return "-"+self.negate().toString(b);
  var k;
  if(b == 16) k = 4;
  else if(b == 8) k = 3;
  else if(b == 2) k = 1;
  else if(b == 32) k = 5;
  else if(b == 4) k = 2;
  else return self.toRadix(b);
  var km = (1<<k)-1, d, m = false, r = "", i = self.t;
  var p = self.DB-(i*self.DB)%k;
  if(i-- > 0) {
    if(p < self.DB && (d = self[i]>>p) > 0) { m = true; r = int2char(d); }
    while(i >= 0) {
      if(p < k) {
        d = (self[i]&((1<<p)-1))<<(k-p);
        d |= self[--i]>>(p+=self.DB-k);
      }
      else {
        d = (self[i]>>(p-=k))&km;
        if(p <= 0) { p += self.DB; --i; }
      }
      if(d > 0) m = true;
      if(m) r += int2char(d);
    }
  }
  return m?r:"0";
}

// (public) -this
function bnNegate() { var r = nbi(); BigInteger.ZERO.subTo(this,r); return r; }

// (public) |this|
function bnAbs() { return (this.s<0)?this.negate():this; }

// (public) return + if this > a, - if this < a, 0 if equal
function bnCompareTo(a) {
  var r = this.s-a.s;
  if(r != 0) return r;
  var i = this.t;
  r = i-a.t;
  if(r != 0) return (this.s<0)?-r:r;
  while(--i >= 0) if((r=this[i]-a[i]) != 0) return r;
  return 0;
}

// returns bit length of the integer x
function nbits(x) {
  var r = 1, t;
  if((t=x>>>16) != 0) { x = t; r += 16; }
  if((t=x>>8) != 0) { x = t; r += 8; }
  if((t=x>>4) != 0) { x = t; r += 4; }
  if((t=x>>2) != 0) { x = t; r += 2; }
  if((t=x>>1) != 0) { x = t; r += 1; }
  return r;
}

// (public) return the number of bits in "this"
function bnBitLength() {
  if(this.t <= 0) return 0;
  return this.DB*(this.t-1)+nbits(this[this.t-1]^(this.s&this.DM));
}

// (protected) r = this << n*DB
function bnpDLShiftTo(n,r) {
  var i;
  for(i = this.t-1; i >= 0; --i) r[i+n] = this[i];
  for(i = n-1; i >= 0; --i) r[i] = 0;
  r.t = this.t+n;
  r.s = this.s;
}

// (protected) r = this >> n*DB
function bnpDRShiftTo(n,r) {
  for(var i = n; i < this.t; ++i) r[i-n] = this[i];
  r.t = Math.max(this.t-n,0);
  r.s = this.s;
}

// (protected) r = this << n
function bnpLShiftTo(n,r) {
  var self = this;
  var bs = n%self.DB;
  var cbs = self.DB-bs;
  var bm = (1<<cbs)-1;
  var ds = Math.floor(n/self.DB), c = (self.s<<bs)&self.DM, i;
  for(i = self.t-1; i >= 0; --i) {
    r[i+ds+1] = (self[i]>>cbs)|c;
    c = (self[i]&bm)<<bs;
  }
  for(i = ds-1; i >= 0; --i) r[i] = 0;
  r[ds] = c;
  r.t = self.t+ds+1;
  r.s = self.s;
  r.clamp();
}

// (protected) r = this >> n
function bnpRShiftTo(n,r) {
  var self = this;
  r.s = self.s;
  var ds = Math.floor(n/self.DB);
  if(ds >= self.t) { r.t = 0; return; }
  var bs = n%self.DB;
  var cbs = self.DB-bs;
  var bm = (1<<bs)-1;
  r[0] = self[ds]>>bs;
  for(var i = ds+1; i < self.t; ++i) {
    r[i-ds-1] |= (self[i]&bm)<<cbs;
    r[i-ds] = self[i]>>bs;
  }
  if(bs > 0) r[self.t-ds-1] |= (self.s&bm)<<cbs;
  r.t = self.t-ds;
  r.clamp();
}

// (protected) r = this - a
function bnpSubTo(a,r) {
  var self = this;
  var i = 0, c = 0, m = Math.min(a.t,self.t);
  while(i < m) {
    c += self[i]-a[i];
    r[i++] = c&self.DM;
    c >>= self.DB;
  }
  if(a.t < self.t) {
    c -= a.s;
    while(i < self.t) {
      c += self[i];
      r[i++] = c&self.DM;
      c >>= self.DB;
    }
    c += self.s;
  }
  else {
    c += self.s;
    while(i < a.t) {
      c -= a[i];
      r[i++] = c&self.DM;
      c >>= self.DB;
    }
    c -= a.s;
  }
  r.s = (c<0)?-1:0;
  if(c < -1) r[i++] = self.DV+c;
  else if(c > 0) r[i++] = c;
  r.t = i;
  r.clamp();
}

// (protected) r = this * a, r != this,a (HAC 14.12)
// "this" should be the larger one if appropriate.
function bnpMultiplyTo(a,r) {
  var x = this.abs(), y = a.abs();
  var i = x.t;
  r.t = i+y.t;
  while(--i >= 0) r[i] = 0;
  for(i = 0; i < y.t; ++i) r[i+x.t] = x.am(0,y[i],r,i,0,x.t);
  r.s = 0;
  r.clamp();
  if(this.s != a.s) BigInteger.ZERO.subTo(r,r);
}

// (protected) r = this^2, r != this (HAC 14.16)
function bnpSquareTo(r) {
  var x = this.abs();
  var i = r.t = 2*x.t;
  while(--i >= 0) r[i] = 0;
  for(i = 0; i < x.t-1; ++i) {
    var c = x.am(i,x[i],r,2*i,0,1);
    if((r[i+x.t]+=x.am(i+1,2*x[i],r,2*i+1,c,x.t-i-1)) >= x.DV) {
      r[i+x.t] -= x.DV;
      r[i+x.t+1] = 1;
    }
  }
  if(r.t > 0) r[r.t-1] += x.am(i,x[i],r,2*i,0,1);
  r.s = 0;
  r.clamp();
}

// (protected) divide this by m, quotient and remainder to q, r (HAC 14.20)
// r != q, this != m.  q or r may be null.
function bnpDivRemTo(m,q,r) {
  var self = this;
  var pm = m.abs();
  if(pm.t <= 0) return;
  var pt = self.abs();
  if(pt.t < pm.t) {
    if(q != null) q.fromInt(0);
    if(r != null) self.copyTo(r);
    return;
  }
  if(r == null) r = nbi();
  var y = nbi(), ts = self.s, ms = m.s;
  var nsh = self.DB-nbits(pm[pm.t-1]);	// normalize modulus
  if(nsh > 0) { pm.lShiftTo(nsh,y); pt.lShiftTo(nsh,r); }
  else { pm.copyTo(y); pt.copyTo(r); }
  var ys = y.t;
  var y0 = y[ys-1];
  if(y0 == 0) return;
  var yt = y0*(1<<self.F1)+((ys>1)?y[ys-2]>>self.F2:0);
  var d1 = self.FV/yt, d2 = (1<<self.F1)/yt, e = 1<<self.F2;
  var i = r.t, j = i-ys, t = (q==null)?nbi():q;
  y.dlShiftTo(j,t);
  if(r.compareTo(t) >= 0) {
    r[r.t++] = 1;
    r.subTo(t,r);
  }
  BigInteger.ONE.dlShiftTo(ys,t);
  t.subTo(y,y);	// "negative" y so we can replace sub with am later
  while(y.t < ys) y[y.t++] = 0;
  while(--j >= 0) {
    // Estimate quotient digit
    var qd = (r[--i]==y0)?self.DM:Math.floor(r[i]*d1+(r[i-1]+e)*d2);
    if((r[i]+=y.am(0,qd,r,j,0,ys)) < qd) {	// Try it out
      y.dlShiftTo(j,t);
      r.subTo(t,r);
      while(r[i] < --qd) r.subTo(t,r);
    }
  }
  if(q != null) {
    r.drShiftTo(ys,q);
    if(ts != ms) BigInteger.ZERO.subTo(q,q);
  }
  r.t = ys;
  r.clamp();
  if(nsh > 0) r.rShiftTo(nsh,r);	// Denormalize remainder
  if(ts < 0) BigInteger.ZERO.subTo(r,r);
}

// (public) this mod a
function bnMod(a) {
  var r = nbi();
  this.abs().divRemTo(a,null,r);
  if(this.s < 0 && r.compareTo(BigInteger.ZERO) > 0) a.subTo(r,r);
  return r;
}

// Modular reduction using "classic" algorithm
function Classic(m) { this.m = m; }
function cConvert(x) {
  if(x.s < 0 || x.compareTo(this.m) >= 0) return x.mod(this.m);
  else return x;
}
function cRevert(x) { return x; }
function cReduce(x) { x.divRemTo(this.m,null,x); }
function cMulTo(x,y,r) { x.multiplyTo(y,r); this.reduce(r); }
function cSqrTo(x,r) { x.squareTo(r); this.reduce(r); }

Classic.prototype.convert = cConvert;
Classic.prototype.revert = cRevert;
Classic.prototype.reduce = cReduce;
Classic.prototype.mulTo = cMulTo;
Classic.prototype.sqrTo = cSqrTo;

// (protected) return "-1/this % 2^DB"; useful for Mont. reduction
// justification:
//         xy == 1 (mod m)
//         xy =  1+km
//   xy(2-xy) = (1+km)(1-km)
// x[y(2-xy)] = 1-k^2m^2
// x[y(2-xy)] == 1 (mod m^2)
// if y is 1/x mod m, then y(2-xy) is 1/x mod m^2
// should reduce x and y(2-xy) by m^2 at each step to keep size bounded.
// JS multiply "overflows" differently from C/C++, so care is needed here.
function bnpInvDigit() {
  if(this.t < 1) return 0;
  var x = this[0];
  if((x&1) == 0) return 0;
  var y = x&3;		// y == 1/x mod 2^2
  y = (y*(2-(x&0xf)*y))&0xf;	// y == 1/x mod 2^4
  y = (y*(2-(x&0xff)*y))&0xff;	// y == 1/x mod 2^8
  y = (y*(2-(((x&0xffff)*y)&0xffff)))&0xffff;	// y == 1/x mod 2^16
  // last step - calculate inverse mod DV directly;
  // assumes 16 < DB <= 32 and assumes ability to handle 48-bit ints
  y = (y*(2-x*y%this.DV))%this.DV;		// y == 1/x mod 2^dbits
  // we really want the negative inverse, and -DV < y < DV
  return (y>0)?this.DV-y:-y;
}

// Montgomery reduction
function Montgomery(m) {
  this.m = m;
  this.mp = m.invDigit();
  this.mpl = this.mp&0x7fff;
  this.mph = this.mp>>15;
  this.um = (1<<(m.DB-15))-1;
  this.mt2 = 2*m.t;
}

// xR mod m
function montConvert(x) {
  var r = nbi();
  x.abs().dlShiftTo(this.m.t,r);
  r.divRemTo(this.m,null,r);
  if(x.s < 0 && r.compareTo(BigInteger.ZERO) > 0) this.m.subTo(r,r);
  return r;
}

// x/R mod m
function montRevert(x) {
  var r = nbi();
  x.copyTo(r);
  this.reduce(r);
  return r;
}

// x = x/R mod m (HAC 14.32)
function montReduce(x) {
  while(x.t <= this.mt2)	// pad x so am has enough room later
    x[x.t++] = 0;
  for(var i = 0; i < this.m.t; ++i) {
    // faster way of calculating u0 = x[i]*mp mod DV
    var j = x[i]&0x7fff;
    var u0 = (j*this.mpl+(((j*this.mph+(x[i]>>15)*this.mpl)&this.um)<<15))&x.DM;
    // use am to combine the multiply-shift-add into one call
    j = i+this.m.t;
    x[j] += this.m.am(0,u0,x,i,0,this.m.t);
    // propagate carry
    while(x[j] >= x.DV) { x[j] -= x.DV; x[++j]++; }
  }
  x.clamp();
  x.drShiftTo(this.m.t,x);
  if(x.compareTo(this.m) >= 0) x.subTo(this.m,x);
}

// r = "x^2/R mod m"; x != r
function montSqrTo(x,r) { x.squareTo(r); this.reduce(r); }

// r = "xy/R mod m"; x,y != r
function montMulTo(x,y,r) { x.multiplyTo(y,r); this.reduce(r); }

Montgomery.prototype.convert = montConvert;
Montgomery.prototype.revert = montRevert;
Montgomery.prototype.reduce = montReduce;
Montgomery.prototype.mulTo = montMulTo;
Montgomery.prototype.sqrTo = montSqrTo;

// (protected) true iff this is even
function bnpIsEven() { return ((this.t>0)?(this[0]&1):this.s) == 0; }

// (protected) this^e, e < 2^32, doing sqr and mul with "r" (HAC 14.79)
function bnpExp(e,z) {
  if(e > 0xffffffff || e < 1) return BigInteger.ONE;
  var r = nbi(), r2 = nbi(), g = z.convert(this), i = nbits(e)-1;
  g.copyTo(r);
  while(--i >= 0) {
    z.sqrTo(r,r2);
    if((e&(1<<i)) > 0) z.mulTo(r2,g,r);
    else { var t = r; r = r2; r2 = t; }
  }
  return z.revert(r);
}

// (public) this^e % m, 0 <= e < 2^32
function bnModPowInt(e,m) {
  var z;
  if(e < 256 || m.isEven()) z = new Classic(m); else z = new Montgomery(m);
  return this.exp(e,z);
}

// protected
proto.copyTo = bnpCopyTo;
proto.fromInt = bnpFromInt;
proto.fromString = bnpFromString;
proto.clamp = bnpClamp;
proto.dlShiftTo = bnpDLShiftTo;
proto.drShiftTo = bnpDRShiftTo;
proto.lShiftTo = bnpLShiftTo;
proto.rShiftTo = bnpRShiftTo;
proto.subTo = bnpSubTo;
proto.multiplyTo = bnpMultiplyTo;
proto.squareTo = bnpSquareTo;
proto.divRemTo = bnpDivRemTo;
proto.invDigit = bnpInvDigit;
proto.isEven = bnpIsEven;
proto.exp = bnpExp;

// public
proto.toString = bnToString;
proto.negate = bnNegate;
proto.abs = bnAbs;
proto.compareTo = bnCompareTo;
proto.bitLength = bnBitLength;
proto.mod = bnMod;
proto.modPowInt = bnModPowInt;

//// jsbn2

function nbi() { return new BigInteger(null); }

// (public)
function bnClone() { var r = nbi(); this.copyTo(r); return r; }

// (public) return value as integer
function bnIntValue() {
  if(this.s < 0) {
    if(this.t == 1) return this[0]-this.DV;
    else if(this.t == 0) return -1;
  }
  else if(this.t == 1) return this[0];
  else if(this.t == 0) return 0;
  // assumes 16 < DB < 32
  return ((this[1]&((1<<(32-this.DB))-1))<<this.DB)|this[0];
}

// (public) return value as byte
function bnByteValue() { return (this.t==0)?this.s:(this[0]<<24)>>24; }

// (public) return value as short (assumes DB>=16)
function bnShortValue() { return (this.t==0)?this.s:(this[0]<<16)>>16; }

// (protected) return x s.t. r^x < DV
function bnpChunkSize(r) { return Math.floor(Math.LN2*this.DB/Math.log(r)); }

// (public) 0 if this == 0, 1 if this > 0
function bnSigNum() {
  if(this.s < 0) return -1;
  else if(this.t <= 0 || (this.t == 1 && this[0] <= 0)) return 0;
  else return 1;
}

// (protected) convert to radix string
function bnpToRadix(b) {
  if(b == null) b = 10;
  if(this.signum() == 0 || b < 2 || b > 36) return "0";
  var cs = this.chunkSize(b);
  var a = Math.pow(b,cs);
  var d = nbv(a), y = nbi(), z = nbi(), r = "";
  this.divRemTo(d,y,z);
  while(y.signum() > 0) {
    r = (a+z.intValue()).toString(b).substr(1) + r;
    y.divRemTo(d,y,z);
  }
  return z.intValue().toString(b) + r;
}

// (protected) convert from radix string
function bnpFromRadix(s,b) {
  var self = this;
  self.fromInt(0);
  if(b == null) b = 10;
  var cs = self.chunkSize(b);
  var d = Math.pow(b,cs), mi = false, j = 0, w = 0;
  for(var i = 0; i < s.length; ++i) {
    var x = intAt(s,i);
    if(x < 0) {
      if(s.charAt(i) == "-" && self.signum() == 0) mi = true;
      continue;
    }
    w = b*w+x;
    if(++j >= cs) {
      self.dMultiply(d);
      self.dAddOffset(w,0);
      j = 0;
      w = 0;
    }
  }
  if(j > 0) {
    self.dMultiply(Math.pow(b,j));
    self.dAddOffset(w,0);
  }
  if(mi) BigInteger.ZERO.subTo(self,self);
}

// (protected) alternate constructor
function bnpFromNumber(a,b,c) {
  var self = this;
  if("number" == typeof b) {
    // new BigInteger(int,int,RNG)
    if(a < 2) self.fromInt(1);
    else {
      self.fromNumber(a,c);
      if(!self.testBit(a-1))	// force MSB set
        self.bitwiseTo(BigInteger.ONE.shiftLeft(a-1),op_or,self);
      if(self.isEven()) self.dAddOffset(1,0); // force odd
      while(!self.isProbablePrime(b)) {
        self.dAddOffset(2,0);
        if(self.bitLength() > a) self.subTo(BigInteger.ONE.shiftLeft(a-1),self);
      }
    }
  }
  else {
    // new BigInteger(int,RNG)
    var t = a&7;
    var length = (a>>3)+1;
    var x = b(length, {array: true});
    if(t > 0) x[0] &= ((1<<t)-1); else x[0] = 0;
    self.fromString(x,256);
  }
}

// (public) convert to bigendian byte array
function bnToByteArray() {
  var self = this;
  var i = self.t, r = new Array();
  r[0] = self.s;
  var p = self.DB-(i*self.DB)%8, d, k = 0;
  if(i-- > 0) {
    if(p < self.DB && (d = self[i]>>p) != (self.s&self.DM)>>p)
      r[k++] = d|(self.s<<(self.DB-p));
    while(i >= 0) {
      if(p < 8) {
        d = (self[i]&((1<<p)-1))<<(8-p);
        d |= self[--i]>>(p+=self.DB-8);
      }
      else {
        d = (self[i]>>(p-=8))&0xff;
        if(p <= 0) { p += self.DB; --i; }
      }
      if((d&0x80) != 0) d |= -256;
      if(k === 0 && (self.s&0x80) != (d&0x80)) ++k;
      if(k > 0 || d != self.s) r[k++] = d;
    }
  }
  return r;
}

function bnEquals(a) { return(this.compareTo(a)==0); }
function bnMin(a) { return(this.compareTo(a)<0)?this:a; }
function bnMax(a) { return(this.compareTo(a)>0)?this:a; }

// (protected) r = this op a (bitwise)
function bnpBitwiseTo(a,op,r) {
  var self = this;
  var i, f, m = Math.min(a.t,self.t);
  for(i = 0; i < m; ++i) r[i] = op(self[i],a[i]);
  if(a.t < self.t) {
    f = a.s&self.DM;
    for(i = m; i < self.t; ++i) r[i] = op(self[i],f);
    r.t = self.t;
  }
  else {
    f = self.s&self.DM;
    for(i = m; i < a.t; ++i) r[i] = op(f,a[i]);
    r.t = a.t;
  }
  r.s = op(self.s,a.s);
  r.clamp();
}

// (public) this & a
function op_and(x,y) { return x&y; }
function bnAnd(a) { var r = nbi(); this.bitwiseTo(a,op_and,r); return r; }

// (public) this | a
function op_or(x,y) { return x|y; }
function bnOr(a) { var r = nbi(); this.bitwiseTo(a,op_or,r); return r; }

// (public) this ^ a
function op_xor(x,y) { return x^y; }
function bnXor(a) { var r = nbi(); this.bitwiseTo(a,op_xor,r); return r; }

// (public) this & ~a
function op_andnot(x,y) { return x&~y; }
function bnAndNot(a) { var r = nbi(); this.bitwiseTo(a,op_andnot,r); return r; }

// (public) ~this
function bnNot() {
  var r = nbi();
  for(var i = 0; i < this.t; ++i) r[i] = this.DM&~this[i];
  r.t = this.t;
  r.s = ~this.s;
  return r;
}

// (public) this << n
function bnShiftLeft(n) {
  var r = nbi();
  if(n < 0) this.rShiftTo(-n,r); else this.lShiftTo(n,r);
  return r;
}

// (public) this >> n
function bnShiftRight(n) {
  var r = nbi();
  if(n < 0) this.lShiftTo(-n,r); else this.rShiftTo(n,r);
  return r;
}

// return index of lowest 1-bit in x, x < 2^31
function lbit(x) {
  if(x == 0) return -1;
  var r = 0;
  if((x&0xffff) == 0) { x >>= 16; r += 16; }
  if((x&0xff) == 0) { x >>= 8; r += 8; }
  if((x&0xf) == 0) { x >>= 4; r += 4; }
  if((x&3) == 0) { x >>= 2; r += 2; }
  if((x&1) == 0) ++r;
  return r;
}

// (public) returns index of lowest 1-bit (or -1 if none)
function bnGetLowestSetBit() {
  for(var i = 0; i < this.t; ++i)
    if(this[i] != 0) return i*this.DB+lbit(this[i]);
  if(this.s < 0) return this.t*this.DB;
  return -1;
}

// return number of 1 bits in x
function cbit(x) {
  var r = 0;
  while(x != 0) { x &= x-1; ++r; }
  return r;
}

// (public) return number of set bits
function bnBitCount() {
  var r = 0, x = this.s&this.DM;
  for(var i = 0; i < this.t; ++i) r += cbit(this[i]^x);
  return r;
}

// (public) true iff nth bit is set
function bnTestBit(n) {
  var j = Math.floor(n/this.DB);
  if(j >= this.t) return(this.s!=0);
  return((this[j]&(1<<(n%this.DB)))!=0);
}

// (protected) this op (1<<n)
function bnpChangeBit(n,op) {
  var r = BigInteger.ONE.shiftLeft(n);
  this.bitwiseTo(r,op,r);
  return r;
}

// (public) this | (1<<n)
function bnSetBit(n) { return this.changeBit(n,op_or); }

// (public) this & ~(1<<n)
function bnClearBit(n) { return this.changeBit(n,op_andnot); }

// (public) this ^ (1<<n)
function bnFlipBit(n) { return this.changeBit(n,op_xor); }

// (protected) r = this + a
function bnpAddTo(a,r) {
  var self = this;

  var i = 0, c = 0, m = Math.min(a.t,self.t);
  while(i < m) {
    c += self[i]+a[i];
    r[i++] = c&self.DM;
    c >>= self.DB;
  }
  if(a.t < self.t) {
    c += a.s;
    while(i < self.t) {
      c += self[i];
      r[i++] = c&self.DM;
      c >>= self.DB;
    }
    c += self.s;
  }
  else {
    c += self.s;
    while(i < a.t) {
      c += a[i];
      r[i++] = c&self.DM;
      c >>= self.DB;
    }
    c += a.s;
  }
  r.s = (c<0)?-1:0;
  if(c > 0) r[i++] = c;
  else if(c < -1) r[i++] = self.DV+c;
  r.t = i;
  r.clamp();
}

// (public) this + a
function bnAdd(a) { var r = nbi(); this.addTo(a,r); return r; }

// (public) this - a
function bnSubtract(a) { var r = nbi(); this.subTo(a,r); return r; }

// (public) this * a
function bnMultiply(a) { var r = nbi(); this.multiplyTo(a,r); return r; }

// (public) this^2
function bnSquare() { var r = nbi(); this.squareTo(r); return r; }

// (public) this / a
function bnDivide(a) { var r = nbi(); this.divRemTo(a,r,null); return r; }

// (public) this % a
function bnRemainder(a) { var r = nbi(); this.divRemTo(a,null,r); return r; }

// (public) [this/a,this%a]
function bnDivideAndRemainder(a) {
  var q = nbi(), r = nbi();
  this.divRemTo(a,q,r);
  return new Array(q,r);
}

// (protected) this *= n, this >= 0, 1 < n < DV
function bnpDMultiply(n) {
  this[this.t] = this.am(0,n-1,this,0,0,this.t);
  ++this.t;
  this.clamp();
}

// (protected) this += n << w words, this >= 0
function bnpDAddOffset(n,w) {
  if(n == 0) return;
  while(this.t <= w) this[this.t++] = 0;
  this[w] += n;
  while(this[w] >= this.DV) {
    this[w] -= this.DV;
    if(++w >= this.t) this[this.t++] = 0;
    ++this[w];
  }
}

// A "null" reducer
function NullExp() {}
function nNop(x) { return x; }
function nMulTo(x,y,r) { x.multiplyTo(y,r); }
function nSqrTo(x,r) { x.squareTo(r); }

NullExp.prototype.convert = nNop;
NullExp.prototype.revert = nNop;
NullExp.prototype.mulTo = nMulTo;
NullExp.prototype.sqrTo = nSqrTo;

// (public) this^e
function bnPow(e) { return this.exp(e,new NullExp()); }

// (protected) r = lower n words of "this * a", a.t <= n
// "this" should be the larger one if appropriate.
function bnpMultiplyLowerTo(a,n,r) {
  var i = Math.min(this.t+a.t,n);
  r.s = 0; // assumes a,this >= 0
  r.t = i;
  while(i > 0) r[--i] = 0;
  var j;
  for(j = r.t-this.t; i < j; ++i) r[i+this.t] = this.am(0,a[i],r,i,0,this.t);
  for(j = Math.min(a.t,n); i < j; ++i) this.am(0,a[i],r,i,0,n-i);
  r.clamp();
}

// (protected) r = "this * a" without lower n words, n > 0
// "this" should be the larger one if appropriate.
function bnpMultiplyUpperTo(a,n,r) {
  --n;
  var i = r.t = this.t+a.t-n;
  r.s = 0; // assumes a,this >= 0
  while(--i >= 0) r[i] = 0;
  for(i = Math.max(n-this.t,0); i < a.t; ++i)
    r[this.t+i-n] = this.am(n-i,a[i],r,0,0,this.t+i-n);
  r.clamp();
  r.drShiftTo(1,r);
}

// Barrett modular reduction
function Barrett(m) {
  // setup Barrett
  this.r2 = nbi();
  this.q3 = nbi();
  BigInteger.ONE.dlShiftTo(2*m.t,this.r2);
  this.mu = this.r2.divide(m);
  this.m = m;
}

function barrettConvert(x) {
  if(x.s < 0 || x.t > 2*this.m.t) return x.mod(this.m);
  else if(x.compareTo(this.m) < 0) return x;
  else { var r = nbi(); x.copyTo(r); this.reduce(r); return r; }
}

function barrettRevert(x) { return x; }

// x = x mod m (HAC 14.42)
function barrettReduce(x) {
  var self = this;
  x.drShiftTo(self.m.t-1,self.r2);
  if(x.t > self.m.t+1) { x.t = self.m.t+1; x.clamp(); }
  self.mu.multiplyUpperTo(self.r2,self.m.t+1,self.q3);
  self.m.multiplyLowerTo(self.q3,self.m.t+1,self.r2);
  while(x.compareTo(self.r2) < 0) x.dAddOffset(1,self.m.t+1);
  x.subTo(self.r2,x);
  while(x.compareTo(self.m) >= 0) x.subTo(self.m,x);
}

// r = x^2 mod m; x != r
function barrettSqrTo(x,r) { x.squareTo(r); this.reduce(r); }

// r = x*y mod m; x,y != r
function barrettMulTo(x,y,r) { x.multiplyTo(y,r); this.reduce(r); }

Barrett.prototype.convert = barrettConvert;
Barrett.prototype.revert = barrettRevert;
Barrett.prototype.reduce = barrettReduce;
Barrett.prototype.mulTo = barrettMulTo;
Barrett.prototype.sqrTo = barrettSqrTo;

// (public) this^e % m (HAC 14.85)
function bnModPow(e,m) {
  var i = e.bitLength(), k, r = nbv(1), z;
  if(i <= 0) return r;
  else if(i < 18) k = 1;
  else if(i < 48) k = 3;
  else if(i < 144) k = 4;
  else if(i < 768) k = 5;
  else k = 6;
  if(i < 8)
    z = new Classic(m);
  else if(m.isEven())
    z = new Barrett(m);
  else
    z = new Montgomery(m);

  // precomputation
  var g = new Array(), n = 3, k1 = k-1, km = (1<<k)-1;
  g[1] = z.convert(this);
  if(k > 1) {
    var g2 = nbi();
    z.sqrTo(g[1],g2);
    while(n <= km) {
      g[n] = nbi();
      z.mulTo(g2,g[n-2],g[n]);
      n += 2;
    }
  }

  var j = e.t-1, w, is1 = true, r2 = nbi(), t;
  i = nbits(e[j])-1;
  while(j >= 0) {
    if(i >= k1) w = (e[j]>>(i-k1))&km;
    else {
      w = (e[j]&((1<<(i+1))-1))<<(k1-i);
      if(j > 0) w |= e[j-1]>>(this.DB+i-k1);
    }

    n = k;
    while((w&1) == 0) { w >>= 1; --n; }
    if((i -= n) < 0) { i += this.DB; --j; }
    if(is1) {	// ret == 1, don't bother squaring or multiplying it
      g[w].copyTo(r);
      is1 = false;
    }
    else {
      while(n > 1) { z.sqrTo(r,r2); z.sqrTo(r2,r); n -= 2; }
      if(n > 0) z.sqrTo(r,r2); else { t = r; r = r2; r2 = t; }
      z.mulTo(r2,g[w],r);
    }

    while(j >= 0 && (e[j]&(1<<i)) == 0) {
      z.sqrTo(r,r2); t = r; r = r2; r2 = t;
      if(--i < 0) { i = this.DB-1; --j; }
    }
  }
  return z.revert(r);
}

// (public) gcd(this,a) (HAC 14.54)
function bnGCD(a) {
  var x = (this.s<0)?this.negate():this.clone();
  var y = (a.s<0)?a.negate():a.clone();
  if(x.compareTo(y) < 0) { var t = x; x = y; y = t; }
  var i = x.getLowestSetBit(), g = y.getLowestSetBit();
  if(g < 0) return x;
  if(i < g) g = i;
  if(g > 0) {
    x.rShiftTo(g,x);
    y.rShiftTo(g,y);
  }
  while(x.signum() > 0) {
    if((i = x.getLowestSetBit()) > 0) x.rShiftTo(i,x);
    if((i = y.getLowestSetBit()) > 0) y.rShiftTo(i,y);
    if(x.compareTo(y) >= 0) {
      x.subTo(y,x);
      x.rShiftTo(1,x);
    }
    else {
      y.subTo(x,y);
      y.rShiftTo(1,y);
    }
  }
  if(g > 0) y.lShiftTo(g,y);
  return y;
}

// (protected) this % n, n < 2^26
function bnpModInt(n) {
  if(n <= 0) return 0;
  var d = this.DV%n, r = (this.s<0)?n-1:0;
  if(this.t > 0)
    if(d == 0) r = this[0]%n;
    else for(var i = this.t-1; i >= 0; --i) r = (d*r+this[i])%n;
  return r;
}

// (public) 1/this % m (HAC 14.61)
function bnModInverse(m) {
  var ac = m.isEven();
  if((this.isEven() && ac) || m.signum() == 0) return BigInteger.ZERO;
  var u = m.clone(), v = this.clone();
  var a = nbv(1), b = nbv(0), c = nbv(0), d = nbv(1);
  while(u.signum() != 0) {
    while(u.isEven()) {
      u.rShiftTo(1,u);
      if(ac) {
        if(!a.isEven() || !b.isEven()) { a.addTo(this,a); b.subTo(m,b); }
        a.rShiftTo(1,a);
      }
      else if(!b.isEven()) b.subTo(m,b);
      b.rShiftTo(1,b);
    }
    while(v.isEven()) {
      v.rShiftTo(1,v);
      if(ac) {
        if(!c.isEven() || !d.isEven()) { c.addTo(this,c); d.subTo(m,d); }
        c.rShiftTo(1,c);
      }
      else if(!d.isEven()) d.subTo(m,d);
      d.rShiftTo(1,d);
    }
    if(u.compareTo(v) >= 0) {
      u.subTo(v,u);
      if(ac) a.subTo(c,a);
      b.subTo(d,b);
    }
    else {
      v.subTo(u,v);
      if(ac) c.subTo(a,c);
      d.subTo(b,d);
    }
  }
  if(v.compareTo(BigInteger.ONE) != 0) return BigInteger.ZERO;
  if(d.compareTo(m) >= 0) return d.subtract(m);
  if(d.signum() < 0) d.addTo(m,d); else return d;
  if(d.signum() < 0) return d.add(m); else return d;
}

// protected
proto.chunkSize = bnpChunkSize;
proto.toRadix = bnpToRadix;
proto.fromRadix = bnpFromRadix;
proto.fromNumber = bnpFromNumber;
proto.bitwiseTo = bnpBitwiseTo;
proto.changeBit = bnpChangeBit;
proto.addTo = bnpAddTo;
proto.dMultiply = bnpDMultiply;
proto.dAddOffset = bnpDAddOffset;
proto.multiplyLowerTo = bnpMultiplyLowerTo;
proto.multiplyUpperTo = bnpMultiplyUpperTo;
proto.modInt = bnpModInt;

// public
proto.clone = bnClone;
proto.intValue = bnIntValue;
proto.byteValue = bnByteValue;
proto.shortValue = bnShortValue;
proto.signum = bnSigNum;
proto.toByteArray = bnToByteArray;
proto.equals = bnEquals;
proto.min = bnMin;
proto.max = bnMax;
proto.and = bnAnd;
proto.or = bnOr;
proto.xor = bnXor;
proto.andNot = bnAndNot;
proto.not = bnNot;
proto.shiftLeft = bnShiftLeft;
proto.shiftRight = bnShiftRight;
proto.getLowestSetBit = bnGetLowestSetBit;
proto.bitCount = bnBitCount;
proto.testBit = bnTestBit;
proto.setBit = bnSetBit;
proto.clearBit = bnClearBit;
proto.flipBit = bnFlipBit;
proto.add = bnAdd;
proto.subtract = bnSubtract;
proto.multiply = bnMultiply;
proto.divide = bnDivide;
proto.remainder = bnRemainder;
proto.divideAndRemainder = bnDivideAndRemainder;
proto.modPow = bnModPow;
proto.modInverse = bnModInverse;
proto.pow = bnPow;
proto.gcd = bnGCD;

// JSBN-specific extension
proto.square = bnSquare;

// BigInteger interfaces not implemented in jsbn:

// BigInteger(int signum, byte[] magnitude)
// double doubleValue()
// float floatValue()
// int hashCode()
// long longValue()
// static BigInteger valueOf(long val)

// "constants"
BigInteger.ZERO = nbv(0);
BigInteger.ONE = nbv(1);
BigInteger.valueOf = nbv;


/// bitcoinjs addons

/**
 * Turns a byte array into a big integer.
 *
 * This function will interpret a byte array as a big integer in big
 * endian notation and ignore leading zeros.
 */
BigInteger.fromByteArrayUnsigned = function(ba) {
  if (!ba.length) {
    return new BigInteger.valueOf(0);
  } else if (ba[0] & 0x80) {
    // Prepend a zero so the BigInteger class doesn't mistake this
    // for a negative integer.
    return new BigInteger([0].concat(ba));
  } else {
    return new BigInteger(ba);
  }
};

/**
 * Parse a signed big integer byte representation.
 *
 * For details on the format please see BigInteger.toByteArraySigned.
 */
BigInteger.fromByteArraySigned = function(ba) {
  // Check for negative value
  if (ba[0] & 0x80) {
    // Remove sign bit
    ba[0] &= 0x7f;

    return BigInteger.fromByteArrayUnsigned(ba).negate();
  } else {
    return BigInteger.fromByteArrayUnsigned(ba);
  }
};

/**
 * Returns a byte array representation of the big integer.
 *
 * This returns the absolute of the contained value in big endian
 * form. A value of zero results in an empty array.
 */
BigInteger.prototype.toByteArrayUnsigned = function() {
    var ba = this.abs().toByteArray();

    // Empty array, nothing to do
    if (!ba.length) {
        return ba;
    }

    // remove leading 0
    if (ba[0] === 0) {
        ba = ba.slice(1);
    }

    // all values must be positive
    for (var i=0 ; i<ba.length ; ++i) {
      ba[i] = (ba[i] < 0) ? ba[i] + 256 : ba[i];
    }

    return ba;
};

/*
 * Converts big integer to signed byte representation.
 *
 * The format for this value uses the most significant bit as a sign
 * bit. If the most significant bit is already occupied by the
 * absolute value, an extra byte is prepended and the sign bit is set
 * there.
 *
 * Examples:
 *
 *      0 =>     0x00
 *      1 =>     0x01
 *     -1 =>     0x81
 *    127 =>     0x7f
 *   -127 =>     0xff
 *    128 =>   0x0080
 *   -128 =>   0x8080
 *    255 =>   0x00ff
 *   -255 =>   0x80ff
 *  16300 =>   0x3fac
 * -16300 =>   0xbfac
 *  62300 => 0x00f35c
 * -62300 => 0x80f35c
*/
BigInteger.prototype.toByteArraySigned = function() {
  var val = this.toByteArrayUnsigned();
  var neg = this.s < 0;

  // if the first bit is set, we always unshift
  // either unshift 0x80 or 0x00
  if (val[0] & 0x80) {
    val.unshift((neg) ? 0x80 : 0x00);
  }
  // if the first bit isn't set, set it if negative
  else if (neg) {
    val[0] |= 0x80;
  }

  return val;
};

module.exports = BigInteger;

},{}],46:[function(require,module,exports){
// Named EC curves

// Requires ec.js, jsbn.js, and jsbn2.js

var ECCurveFp = require('./ec');
var BigInteger = require('./jsbn');

// ----------------
// X9ECParameters

// constructor
function X9ECParameters(curve,g,n,h) {
    this.curve = curve;
    this.g = g;
    this.n = n;
    this.h = h;
}

function x9getCurve() {
    return this.curve;
}

function x9getG() {
    return this.g;
}

function x9getN() {
    return this.n;
}

function x9getH() {
    return this.h;
}

X9ECParameters.prototype.getCurve = x9getCurve;
X9ECParameters.prototype.getG = x9getG;
X9ECParameters.prototype.getN = x9getN;
X9ECParameters.prototype.getH = x9getH;

// ----------------
// SECNamedCurves

function fromHex(s) { return new BigInteger(s, 16); }

function secp128r1() {
    // p = 2^128 - 2^97 - 1
    var p = fromHex("FFFFFFFDFFFFFFFFFFFFFFFFFFFFFFFF");
    var a = fromHex("FFFFFFFDFFFFFFFFFFFFFFFFFFFFFFFC");
    var b = fromHex("E87579C11079F43DD824993C2CEE5ED3");
    //byte[] S = Hex.decode("000E0D4D696E6768756151750CC03A4473D03679");
    var n = fromHex("FFFFFFFE0000000075A30D1B9038A115");
    var h = BigInteger.ONE;
    var curve = new ECCurveFp(p, a, b);
    var G = curve.decodePointHex("04"
                + "161FF7528B899B2D0C28607CA52C5B86"
		+ "CF5AC8395BAFEB13C02DA292DDED7A83");
    return new X9ECParameters(curve, G, n, h);
}

function secp160k1() {
    // p = 2^160 - 2^32 - 2^14 - 2^12 - 2^9 - 2^8 - 2^7 - 2^3 - 2^2 - 1
    var p = fromHex("FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFAC73");
    var a = BigInteger.ZERO;
    var b = fromHex("7");
    //byte[] S = null;
    var n = fromHex("0100000000000000000001B8FA16DFAB9ACA16B6B3");
    var h = BigInteger.ONE;
    var curve = new ECCurveFp(p, a, b);
    var G = curve.decodePointHex("04"
                + "3B4C382CE37AA192A4019E763036F4F5DD4D7EBB"
                + "938CF935318FDCED6BC28286531733C3F03C4FEE");
    return new X9ECParameters(curve, G, n, h);
}

function secp160r1() {
    // p = 2^160 - 2^31 - 1
    var p = fromHex("FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF7FFFFFFF");
    var a = fromHex("FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF7FFFFFFC");
    var b = fromHex("1C97BEFC54BD7A8B65ACF89F81D4D4ADC565FA45");
    //byte[] S = Hex.decode("1053CDE42C14D696E67687561517533BF3F83345");
    var n = fromHex("0100000000000000000001F4C8F927AED3CA752257");
    var h = BigInteger.ONE;
    var curve = new ECCurveFp(p, a, b);
    var G = curve.decodePointHex("04"
		+ "4A96B5688EF573284664698968C38BB913CBFC82"
		+ "23A628553168947D59DCC912042351377AC5FB32");
    return new X9ECParameters(curve, G, n, h);
}

function secp192k1() {
    // p = 2^192 - 2^32 - 2^12 - 2^8 - 2^7 - 2^6 - 2^3 - 1
    var p = fromHex("FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFEE37");
    var a = BigInteger.ZERO;
    var b = fromHex("3");
    //byte[] S = null;
    var n = fromHex("FFFFFFFFFFFFFFFFFFFFFFFE26F2FC170F69466A74DEFD8D");
    var h = BigInteger.ONE;
    var curve = new ECCurveFp(p, a, b);
    var G = curve.decodePointHex("04"
                + "DB4FF10EC057E9AE26B07D0280B7F4341DA5D1B1EAE06C7D"
                + "9B2F2F6D9C5628A7844163D015BE86344082AA88D95E2F9D");
    return new X9ECParameters(curve, G, n, h);
}

function secp192r1() {
    // p = 2^192 - 2^64 - 1
    var p = fromHex("FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFFFFFFFFFFFF");
    var a = fromHex("FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFFFFFFFFFFFC");
    var b = fromHex("64210519E59C80E70FA7E9AB72243049FEB8DEECC146B9B1");
    //byte[] S = Hex.decode("3045AE6FC8422F64ED579528D38120EAE12196D5");
    var n = fromHex("FFFFFFFFFFFFFFFFFFFFFFFF99DEF836146BC9B1B4D22831");
    var h = BigInteger.ONE;
    var curve = new ECCurveFp(p, a, b);
    var G = curve.decodePointHex("04"
                + "188DA80EB03090F67CBF20EB43A18800F4FF0AFD82FF1012"
                + "07192B95FFC8DA78631011ED6B24CDD573F977A11E794811");
    return new X9ECParameters(curve, G, n, h);
}

function secp224r1() {
    // p = 2^224 - 2^96 + 1
    var p = fromHex("FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF000000000000000000000001");
    var a = fromHex("FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFFFFFFFFFFFFFFFFFFFE");
    var b = fromHex("B4050A850C04B3ABF54132565044B0B7D7BFD8BA270B39432355FFB4");
    //byte[] S = Hex.decode("BD71344799D5C7FCDC45B59FA3B9AB8F6A948BC5");
    var n = fromHex("FFFFFFFFFFFFFFFFFFFFFFFFFFFF16A2E0B8F03E13DD29455C5C2A3D");
    var h = BigInteger.ONE;
    var curve = new ECCurveFp(p, a, b);
    var G = curve.decodePointHex("04"
                + "B70E0CBD6BB4BF7F321390B94A03C1D356C21122343280D6115C1D21"
                + "BD376388B5F723FB4C22DFE6CD4375A05A07476444D5819985007E34");
    return new X9ECParameters(curve, G, n, h);
}

function secp256k1() {
    // p = 2^256 - 2^32 - 2^9 - 2^8 - 2^7 - 2^6 - 2^4 - 1
    var p = fromHex("FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F");
    var a = BigInteger.ZERO;
    var b = fromHex("7");
    //byte[] S = null;
    var n = fromHex("FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141");
    var h = BigInteger.ONE;
    var curve = new ECCurveFp(p, a, b);
    var G = curve.decodePointHex("04"
                + "79BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798"
	            + "483ADA7726A3C4655DA4FBFC0E1108A8FD17B448A68554199C47D08FFB10D4B8");
    return new X9ECParameters(curve, G, n, h);
}

function secp256r1() {
    // p = 2^224 (2^32 - 1) + 2^192 + 2^96 - 1
    var p = fromHex("FFFFFFFF00000001000000000000000000000000FFFFFFFFFFFFFFFFFFFFFFFF");
    var a = fromHex("FFFFFFFF00000001000000000000000000000000FFFFFFFFFFFFFFFFFFFFFFFC");
    var b = fromHex("5AC635D8AA3A93E7B3EBBD55769886BC651D06B0CC53B0F63BCE3C3E27D2604B");
    //byte[] S = Hex.decode("C49D360886E704936A6678E1139D26B7819F7E90");
    var n = fromHex("FFFFFFFF00000000FFFFFFFFFFFFFFFFBCE6FAADA7179E84F3B9CAC2FC632551");
    var h = BigInteger.ONE;
    var curve = new ECCurveFp(p, a, b);
    var G = curve.decodePointHex("04"
                + "6B17D1F2E12C4247F8BCE6E563A440F277037D812DEB33A0F4A13945D898C296"
		+ "4FE342E2FE1A7F9B8EE7EB4A7C0F9E162BCE33576B315ECECBB6406837BF51F5");
    return new X9ECParameters(curve, G, n, h);
}

// TODO: make this into a proper hashtable
function getSECCurveByName(name) {
    if(name == "secp128r1") return secp128r1();
    if(name == "secp160k1") return secp160k1();
    if(name == "secp160r1") return secp160r1();
    if(name == "secp192k1") return secp192k1();
    if(name == "secp192r1") return secp192r1();
    if(name == "secp224r1") return secp224r1();
    if(name == "secp256k1") return secp256k1();
    if(name == "secp256r1") return secp256r1();
    return null;
}

module.exports = getSECCurveByName;

},{"./ec":44,"./jsbn":45}],47:[function(require,module,exports){
/// Implements Bitcoin's feature for signing arbitrary messages.

var SHA256 = require('crypto-js/sha256');
var ecdsa = require('./ecdsa');
var convert = require('./convert');

var Message = {};

Message.magicPrefix = "Bitcoin Signed Message:\n";

Message.makeMagicMessage = function (message) {
  var magicBytes = convert.stringToBytes(Message.magicPrefix);
  var messageBytes = convert.stringToBytes(message);

  var buffer = [];
  buffer = buffer.concat(convert.numToVarInt(magicBytes.length));
  buffer = buffer.concat(magicBytes);
  buffer = buffer.concat(convert.numToVarInt(messageBytes.length));
  buffer = buffer.concat(messageBytes);

  return buffer;
};

Message.getHash = function (message) {
  var buffer = Message.makeMagicMessage(message);
  return convert.wordArrayToBytes(SHA256(SHA256(convert.bytesToWordArray(buffer))));
};

Message.signMessage = function (key, message) {
  var hash = Message.getHash(message);

  var sig = key.sign(hash);

  var obj = ecdsa.parseSig(sig);

  var i = ecdsa.calcPubkeyRecoveryParam(key, obj.r, obj.s, hash);

  i += 27;
  if (key.compressed) i += 4;

  var rBa = obj.r.toByteArrayUnsigned();
  var sBa = obj.s.toByteArrayUnsigned();

  // Pad to 32 bytes per value
  while (rBa.length < 32) rBa.unshift(0);
  while (sBa.length < 32) sBa.unshift(0);

  sig = [i].concat(rBa).concat(sBa);

  return convert.bytesToHex(sig);
};

Message.verifyMessage = function (address, sig, message) {
  sig = convert.hexToBytes(sig);
  sig = ecdsa.parseSigCompact(sig);

  var hash = Message.getHash(message);

  var isCompressed = !!(sig.i & 4);
  var pubKey = ecdsa.recoverPubKey(sig.r, sig.s, hash, sig.i);
  pubKey.compressed = isCompressed;

  var expectedAddress = pubKey.getBitcoinAddress().toString();

  return (address === expectedAddress);
};

module.exports = Message;

},{"./convert":39,"./ecdsa":40,"crypto-js/sha256":30}],48:[function(require,module,exports){
module.exports = {
  mainnet: {
    addressVersion: 0,
    p2shVersion: 5,
    hdVersions: {
      pub: 0x0488B21E,
      priv: 0x0488ADE4
    }
  },
  testnet: {
    addressVersion: 111,
    p2shVersion: 196,
    hdVersions: {
      pub: 0x043587CF,
      priv: 0x04358394
    }
  }
};


},{}],49:[function(require,module,exports){
Opcode = {
    map: {
        // push value
        OP_0         : 0,
        OP_FALSE     : 0,
        OP_PUSHDATA1 : 76,
        OP_PUSHDATA2 : 77,
        OP_PUSHDATA4 : 78,
        OP_1NEGATE   : 79,
        OP_RESERVED  : 80,
        OP_1         : 81,
        OP_TRUE      : 81,
        OP_2         : 82,
        OP_3         : 83,
        OP_4         : 84,
        OP_5         : 85,
        OP_6         : 86,
        OP_7         : 87,
        OP_8         : 88,
        OP_9         : 89,
        OP_10        : 90,
        OP_11        : 91,
        OP_12        : 92,
        OP_13        : 93,
        OP_14        : 94,
        OP_15        : 95,
        OP_16        : 96,

        // control
        OP_NOP       : 97,
        OP_VER       : 98,
        OP_IF        : 99,
        OP_NOTIF     : 100,
        OP_VERIF     : 101,
        OP_VERNOTIF  : 102,
        OP_ELSE      : 103,
        OP_ENDIF     : 104,
        OP_VERIFY    : 105,
        OP_RETURN    : 106,

        // stack ops
        OP_TOALTSTACK   : 107,
        OP_FROMALTSTACK : 108,
        OP_2DROP        : 109,
        OP_2DUP         : 110,
        OP_3DUP         : 111,
        OP_2OVER        : 112,
        OP_2ROT         : 113,
        OP_2SWAP        : 114,
        OP_IFDUP        : 115,
        OP_DEPTH        : 116,
        OP_DROP         : 117,
        OP_DUP          : 118,
        OP_NIP          : 119,
        OP_OVER         : 120,
        OP_PICK         : 121,
        OP_ROLL         : 122,
        OP_ROT          : 123,
        OP_SWAP         : 124,
        OP_TUCK         : 125,

        // splice ops
        OP_CAT          : 126,
        OP_SUBSTR       : 127,
        OP_LEFT         : 128,
        OP_RIGHT        : 129,
        OP_SIZE         : 130,

        // bit logic
        OP_INVERT       : 131,
        OP_AND          : 132,
        OP_OR           : 133,
        OP_XOR          : 134,
        OP_EQUAL        : 135,
        OP_EQUALVERIFY  : 136,
        OP_RESERVED1    : 137,
        OP_RESERVED2    : 138,

        // numeric
        OP_1ADD         : 139,
        OP_1SUB         : 140,
        OP_2MUL         : 141,
        OP_2DIV         : 142,
        OP_NEGATE       : 143,
        OP_ABS          : 144,
        OP_NOT          : 145,
        OP_0NOTEQUAL    : 146,

        OP_ADD          : 147,
        OP_SUB          : 148,
        OP_MUL          : 149,
        OP_DIV          : 150,
        OP_MOD          : 151,
        OP_LSHIFT       : 152,
        OP_RSHIFT       : 153,

        OP_BOOLAND             : 154,
        OP_BOOLOR              : 155,
        OP_NUMEQUAL            : 156,
        OP_NUMEQUALVERIFY      : 157,
        OP_NUMNOTEQUAL         : 158,
        OP_LESSTHAN            : 159,
        OP_GREATERTHAN         : 160,
        OP_LESSTHANOREQUAL     : 161,
        OP_GREATERTHANOREQUAL  : 162,
        OP_MIN                 : 163,
        OP_MAX                 : 164,

        OP_WITHIN              : 165,

        // crypto
        OP_RIPEMD160           : 166,
        OP_SHA1                : 167,
        OP_SHA256              : 168,
        OP_HASH160             : 169,
        OP_HASH256             : 170,
        OP_CODESEPARATOR       : 171,
        OP_CHECKSIG            : 172,
        OP_CHECKSIGVERIFY      : 173,
        OP_CHECKMULTISIG       : 174,
        OP_CHECKMULTISIGVERIFY : 175,

        // expansion
        OP_NOP1  : 176,
        OP_NOP2  : 177,
        OP_NOP3  : 178,
        OP_NOP4  : 179,
        OP_NOP5  : 180,
        OP_NOP6  : 181,
        OP_NOP7  : 182,
        OP_NOP8  : 183,
        OP_NOP9  : 184,
        OP_NOP10 : 185,

        // template matching params
        OP_PUBKEYHASH    : 253,
        OP_PUBKEY        : 254,
        OP_INVALIDOPCODE : 255
    },
    reverseMap: []
}

for(var i in Opcode.map) {
    Opcode.reverseMap[Opcode.map[i]] = i
}

module.exports = Opcode

},{}],50:[function(require,module,exports){
var Opcode = require('./opcode');
var util = require('./util');
var convert = require('./convert');
var Address = require('./address');
var network = require('./network');

var Script = function(data) {
    this.buffer = data || [];
    if(!Array.isArray(this.buffer)) {
      throw new Error('expect Script to be initialized with Array, but got ' + data)
    }
    this.parse();
};

Script.fromHex = function(data) {
    return new Script(convert.hexToBytes(data))
};

Script.fromPubKey = function(str) {
    var script = new Script();
    var s = str.split(' ');
    for (var i in s) {
        if (Opcode.map.hasOwnProperty(s[i])) {
            script.writeOp(Opcode.map[s[i]]);
        } else {
            script.writeBytes(convert.hexToBytes(s[i]));
        }
    }
    return script;
};

Script.fromScriptSig = function(str) {
    var script = new Script();
    var s = str.split(' ');
    for (var i in s) {
        if (Opcode.map.hasOwnProperty(s[i])) {
            script.writeOp(Opcode.map[s[i]]);
        } else {
            script.writeBytes(convert.hexToBytes(s[i]));
        }
    }
    return script;
};

/**
 * Update the parsed script representation.
 *
 * Each Script object stores the script in two formats. First as a raw byte
 * array and second as an array of 'chunks', such as opcodes and pieces of
 * data.
 *
 * This method updates the chunks cache. Normally this is called by the
 * constructor and you don't need to worry about it. However, if you change
 * the script buffer manually, you should update the chunks using this method.
 */
Script.prototype.parse = function() {
    var self = this;

    this.chunks = [];

    // Cursor
    var i = 0;

    // Read n bytes and store result as a chunk
    function readChunk(n) {
        self.chunks.push(self.buffer.slice(i, i + n));
        i += n;
    }

    while (i < this.buffer.length) {
        var opcode = this.buffer[i++];
        if (opcode >= 0xF0) {
            // Two byte opcode
            opcode = (opcode << 8) | this.buffer[i++];
        }

        var len;
        if (opcode > 0 && opcode < Opcode.map.OP_PUSHDATA1) {
            // Read some bytes of data, opcode value is the length of data
            readChunk(opcode);
        } else if (opcode == Opcode.map.OP_PUSHDATA1) {
            len = this.buffer[i++];
            readChunk(len);
        } else if (opcode == Opcode.map.OP_PUSHDATA2) {
            len = (this.buffer[i++] << 8) | this.buffer[i++];
            readChunk(len);
        } else if (opcode == Opcode.map.OP_PUSHDATA4) {
            len = (this.buffer[i++] << 24) |
                (this.buffer[i++] << 16) |
                (this.buffer[i++] << 8) |
                this.buffer[i++];
            readChunk(len);
        } else {
            this.chunks.push(opcode);
        }
    }
};

/**
 * Compare the script to known templates of scriptPubKey.
 *
 * This method will compare the script to a small number of standard script
 * templates and return a string naming the detected type.
 *
 * Currently supported are:
 * Address:
 *   Paying to a Bitcoin address which is the hash of a pubkey.
 *   OP_DUP OP_HASH160 [pubKeyHash] OP_EQUALVERIFY OP_CHECKSIG
 *
 * Pubkey:
 *   Paying to a public key directly.
 *   [pubKey] OP_CHECKSIG
 *
 * Strange:
 *   Any other script (no template matched).
 */
Script.prototype.getOutType = function() {
    if (this.chunks[this.chunks.length - 1] == Opcode.map.OP_EQUAL &&
        this.chunks[0] == Opcode.map.OP_HASH160 &&
        this.chunks.length == 3) {
        // Transfer to M-OF-N
        return 'P2SH';
    } else if (this.chunks.length == 5 &&
        this.chunks[0] == Opcode.map.OP_DUP &&
        this.chunks[1] == Opcode.map.OP_HASH160 &&
        this.chunks[3] == Opcode.map.OP_EQUALVERIFY &&
        this.chunks[4] == Opcode.map.OP_CHECKSIG) {
        // Transfer to Bitcoin address
        return 'Pubkey';
    } else {
        return 'Strange';
    }
}

/**
 * Returns the address corresponding to this output in hash160 form.
 * Assumes strange scripts are P2SH
 */
Script.prototype.toScriptHash = function() {
    var outType = this.getOutType();

    if (outType == 'Pubkey') {
        return this.chunks[2]
    }

    if (outType == 'P2SH') {
        return util.sha256ripe160(this.buffer)
    }

    return util.sha256ripe160(this.buffer)
}

Script.prototype.toAddress = function() {
    var outType = this.getOutType();

    if (outType == 'Pubkey') {
        return new Address(this.chunks[2])
    }

    if (outType == 'P2SH') {
        return new Address(this.chunks[1], 5)
    }

    return new Address(this.chunks[1], 5)
}

/**
 * Compare the script to known templates of scriptSig.
 *
 * This method will compare the script to a small number of standard script
 * templates and return a string naming the detected type.
 *
 * WARNING: Use this method with caution. It merely represents a heuristic
 * based on common transaction formats. A non-standard transaction could
 * very easily match one of these templates by accident.
 *
 * Currently supported are:
 * Address:
 *   Paying to a Bitcoin address which is the hash of a pubkey.
 *   [sig] [pubKey]
 *
 * Pubkey:
 *   Paying to a public key directly.
 *   [sig]
 *
 * Multisig:
 *   Paying to M-of-N public keys.
 *
 * Strange:
 *   Any other script (no template matched).
 */
Script.prototype.getInType = function() {
    if (this.chunks.length == 1 &&
        Array.isArray(this.chunks[0])) {
        // Direct IP to IP transactions only have the signature in their scriptSig.
        // TODO: We could also check that the length of the data is correct.
        return 'Pubkey';
    } else if (this.chunks.length == 2 &&
        Array.isArray(this.chunks[0]) &&
        Array.isArray(this.chunks[1])) {
        return 'Address';
    } else if (this.chunks[0] == Opcode.map.OP_0 &&
        this.chunks.slice(1).reduce(function(t, chunk, i) {
            return t && Array.isArray(chunk) && (chunk[0] == 48 || i == this.chunks.length - 1);
        }, true)) {
        return 'Multisig';
    } else {
        return 'Strange';
    }
};

/**
 * Returns the affected public key for this input.
 *
 * This currently only works with payToPubKeyHash transactions. It will also
 * work in the future for standard payToScriptHash transactions that use a
 * single public key.
 *
 * However for multi-key and other complex transactions, this will only return
 * one of the keys or raise an error. Therefore, it is recommended for indexing
 * purposes to use Script#simpleInHash or Script#simpleOutHash instead.
 *
 * @deprecated
 */
Script.prototype.simpleInPubKey = function() {
    switch (this.getInType()) {
    case 'Address':
        return this.chunks[1];
    case 'Pubkey':
        // TODO: Theoretically, we could recover the pubkey from the sig here.
        //       See https://bitcointalk.org/?topic=6430.0
        throw new Error('Script does not contain pubkey');
    default:
        throw new Error('Encountered non-standard scriptSig');
    }
};

/**
 * Returns the affected address hash for this input.
 *
 * For standard transactions, this will return the hash of the pubKey that
 * can spend this output.
 *
 * In the future, for standard payToScriptHash inputs, this will return the
 * scriptHash.
 *
 * Note: This function provided for convenience. If you have the corresponding
 * scriptPubKey available, you are urged to use Script#simpleOutHash instead
 * as it is more reliable for non-standard payToScriptHash transactions.
 *
 * This method is useful for indexing transactions.
 */
Script.prototype.simpleInHash = function() {
    return util.sha256ripe160(this.simpleInPubKey());
};

/**
 * Old name for Script#simpleInHash.
 *
 * @deprecated
 */
Script.prototype.simpleInPubKeyHash = Script.prototype.simpleInHash;

/**
 * Add an op code to the script.
 */
Script.prototype.writeOp = function(opcode) {
    this.buffer.push(opcode);
    this.chunks.push(opcode);
};

/**
 * Add a data chunk to the script.
 */
Script.prototype.writeBytes = function(data) {
    if (data.length < Opcode.map.OP_PUSHDATA1) {
        this.buffer.push(data.length);
    } else if (data.length <= 0xff) {
        this.buffer.push(Opcode.map.OP_PUSHDATA1);
        this.buffer.push(data.length);
    } else if (data.length <= 0xffff) {
        this.buffer.push(Opcode.map.OP_PUSHDATA2);
        this.buffer.push(data.length & 0xff);
        this.buffer.push((data.length >>> 8) & 0xff);
    } else {
        this.buffer.push(Opcode.map.OP_PUSHDATA4);
        this.buffer.push(data.length & 0xff);
        this.buffer.push((data.length >>> 8) & 0xff);
        this.buffer.push((data.length >>> 16) & 0xff);
        this.buffer.push((data.length >>> 24) & 0xff);
    }
    this.buffer = this.buffer.concat(data);
    this.chunks.push(data);
};

/**
 * Create an output for an address
 */
Script.createOutputScript = function(address) {
    var script = new Script();
    address = new Address(address);
    if (address.version == network.mainnet.p2shVersion || address.version == network.testnet.p2shVersion) {
        // Standard pay-to-script-hash
        script.writeOp(Opcode.map.OP_HASH160);
        script.writeBytes(address.hash);
        script.writeOp(Opcode.map.OP_EQUAL);
    }
    else {
        // Standard pay-to-pubkey-hash
        script.writeOp(Opcode.map.OP_DUP);
        script.writeOp(Opcode.map.OP_HASH160);
        script.writeBytes(address.hash);
        script.writeOp(Opcode.map.OP_EQUALVERIFY);
        script.writeOp(Opcode.map.OP_CHECKSIG);
    }
    return script;
};

/**
 * Extract pubkeys from a multisig script
 */

Script.prototype.extractPubkeys = function() {
    return this.chunks.filter(function(chunk) {
        return(chunk[0] == 4 && chunk.length == 65 || chunk[0] < 4 && chunk.length == 33)
    });
}

/**
 * Create an m-of-n output script
 */
Script.createMultiSigOutputScript = function(m, pubkeys) {
    var script = new Script();

    pubkeys = pubkeys.sort();

    script.writeOp(Opcode.map.OP_1 + m - 1);

    for (var i = 0; i < pubkeys.length; ++i) {
        script.writeBytes(pubkeys[i]);
    }

    script.writeOp(Opcode.map.OP_1 + pubkeys.length - 1);

    script.writeOp(Opcode.map.OP_CHECKMULTISIG);

    return script;
};

/**
 * Create a standard payToPubKeyHash input.
 */
Script.createInputScript = function(signature, pubKey) {
    var script = new Script();
    script.writeBytes(signature);
    script.writeBytes(pubKey);
    return script;
};

/**
 * Create a multisig input
 */
Script.createMultiSigInputScript = function(signatures, script) {
    script = new Script(script);
    var k = script.chunks[0][0];

    //Not enough sigs
    if (signatures.length < k) return false;

    var inScript = new Script();
    inScript.writeOp(Opcode.map.OP_0);
    signatures.map(function(sig) {
        inScript.writeBytes(sig)
    });
    inScript.writeBytes(script.buffer);
    return inScript;
}

Script.prototype.clone = function() {
    return new Script(this.buffer);
};

module.exports = Script;

},{"./address":37,"./convert":39,"./network":48,"./opcode":49,"./util":52}],51:[function(require,module,exports){
var BigInteger = require('./jsbn/jsbn');
var Script = require('./script');
var util = require('./util');
var convert = require('./convert');
var Wallet = require('./wallet');
var ECKey = require('./eckey').ECKey;
var ECDSA = require('./ecdsa');
var Address = require('./address');
var Message = require('./message');
var SHA256 = require('crypto-js/sha256');

var Transaction = function (doc) {
    if (!(this instanceof Transaction)) { return new Transaction(doc); }
    this.version = 1;
    this.locktime = 0;
    this.ins = [];
    this.outs = [];
    this.timestamp = null;
    this.block = null;

    if (doc) {
        if (typeof doc == "string" || Array.isArray(doc)) {
            doc = Transaction.deserialize(doc)
        }
        if (doc.hash) this.hash = doc.hash;
        if (doc.version) this.version = doc.version;
        if (doc.locktime) this.locktime = doc.locktime;
        if (doc.ins && doc.ins.length) {
            for (var i = 0; i < doc.ins.length; i++) {
                this.addInput(new TransactionIn(doc.ins[i]));
            }
        }
        if (doc.outs && doc.outs.length) {
            for (var i = 0; i < doc.outs.length; i++) {
                this.addOutput(new TransactionOut(doc.outs[i]));
            }
        }
        if (doc.timestamp) this.timestamp = doc.timestamp;
        if (doc.block) this.block = doc.block;

        this.hash = this.hash || this.getHash()
    }
};

/**
 * Turn transaction data into Transaction objects.
 *
 * Takes an array of plain JavaScript objects containing transaction data and
 * returns an array of Transaction objects.
 */
Transaction.objectify = function (txs) {
  var objs = [];
  for (var i = 0; i < txs.length; i++) {
    objs.push(new Transaction(txs[i]));
  }
  return objs;
};

/**
 * Create a new txin.
 *
 * Can be called with any of:
 *
 * - An existing TransactionIn object
 * - A transaction and an index
 * - A transaction hash and an index
 * - A single string argument of the form txhash:index
 *
 * Note that this method does not sign the created input.
 */
Transaction.prototype.addInput = function (tx, outIndex) {
    if (arguments[0] instanceof TransactionIn) {
        this.ins.push(arguments[0]);
    }
    else if (arguments[0].length > 65) {
        var args = arguments[0].split(':');
        return this.addInput(args[0], args[1]);
    }
    else {
        var hash = typeof tx === "string" ? tx : tx.hash
        var hash = Array.isArray(hash) ? convert.bytesToHex(hash) : hash
        this.ins.push(new TransactionIn({
            outpoint: {
                hash: hash,
                index: outIndex
            },
            script: new Script(),
            sequence: 4294967295
        }));
    }
};

/**
 * Create a new txout.
 *
 * Can be called with:
 *
 * i) An existing TransactionOut object
 * ii) An address object or an address and a value
 * iii) An address:value string
 *
 */
Transaction.prototype.addOutput = function (address, value) {
    if (arguments[0] instanceof TransactionOut) {
       this.outs.push(arguments[0]);
       return;
    }
    if (arguments[0].indexOf(':') >= 0) {
        var args = arguments[0].split(':');
        address = args[0];
        value = parseInt(args[1]);
    }
    this.outs.push(new TransactionOut({
        value: value,
        script: Script.createOutputScript(address)
    }));
};

/**
 * Serialize this transaction.
 *
 * Returns the transaction as a byte array in the standard Bitcoin binary
 * format. This method is byte-perfect, i.e. the resulting byte array can
 * be hashed to get the transaction's standard Bitcoin hash.
 */
Transaction.prototype.serialize = function () {
    var buffer = [];
    buffer = buffer.concat(convert.numToBytes(parseInt(this.version),4));
    buffer = buffer.concat(convert.numToVarInt(this.ins.length));
    for (var i = 0; i < this.ins.length; i++) {
        var txin = this.ins[i];

        // Why do blockchain.info, blockexplorer.com, sx and just about everybody
        // else use little-endian hashes? No idea...
        buffer = buffer.concat(convert.hexToBytes(txin.outpoint.hash).reverse());

        buffer = buffer.concat(convert.numToBytes(parseInt(txin.outpoint.index),4));
        var scriptBytes = txin.script.buffer;
        buffer = buffer.concat(convert.numToVarInt(scriptBytes.length));
        buffer = buffer.concat(scriptBytes);
        buffer = buffer.concat(convert.numToBytes(parseInt(txin.sequence),4));
    }
    buffer = buffer.concat(convert.numToVarInt(this.outs.length));
    for (var i = 0; i < this.outs.length; i++) {
        var txout = this.outs[i];
        buffer = buffer.concat(convert.numToBytes(txout.value,8));
        var scriptBytes = txout.script.buffer;
        buffer = buffer.concat(convert.numToVarInt(scriptBytes.length));
        buffer = buffer.concat(scriptBytes);
    }
    buffer = buffer.concat(convert.numToBytes(parseInt(this.locktime),4));

    return buffer;
};

Transaction.prototype.serializeHex = function() {
    return convert.bytesToHex(this.serialize());
}

var OP_CODESEPARATOR = 171;

var SIGHASH_ALL = 1;
var SIGHASH_NONE = 2;
var SIGHASH_SINGLE = 3;
var SIGHASH_ANYONECANPAY = 80;

/**
 * Hash transaction for signing a specific input.
 *
 * Bitcoin uses a different hash for each signed transaction input. This
 * method copies the transaction, makes the necessary changes based on the
 * hashType, serializes and finally hashes the result. This hash can then be
 * used to sign the transaction input in question.
 */
Transaction.prototype.hashTransactionForSignature =
function (connectedScript, inIndex, hashType)
{
  var txTmp = this.clone();

  // In case concatenating two scripts ends up with two codeseparators,
  // or an extra one at the end, this prevents all those possible
  // incompatibilities.
  /*scriptCode = scriptCode.filter(function (val) {
   return val !== OP_CODESEPARATOR;
   });*/

  // Blank out other inputs' signatures
  for (var i = 0; i < txTmp.ins.length; i++) {
    txTmp.ins[i].script = new Script();
  }

  txTmp.ins[inIndex].script = connectedScript;

  // Blank out some of the outputs
  if ((hashType & 0x1f) == SIGHASH_NONE) {
    txTmp.outs = [];

    // Let the others update at will
    for (var i = 0; i < txTmp.ins.length; i++)
      if (i != inIndex)
        txTmp.ins[i].sequence = 0;
  } else if ((hashType & 0x1f) == SIGHASH_SINGLE) {
    // TODO: Implement
  }

  // Blank out other inputs completely, not recommended for open transactions
  if (hashType & SIGHASH_ANYONECANPAY) {
    txTmp.ins = [txTmp.ins[inIndex]];
  }

  var buffer = txTmp.serialize();

  buffer = buffer.concat(convert.numToBytes(parseInt(hashType),4));

  buffer = convert.bytesToWordArray(buffer);
  return convert.wordArrayToBytes(SHA256(SHA256(buffer)));
};

/**
 * Calculate and return the transaction's hash.
 * Reverses hash since blockchain.info, blockexplorer.com and others
 * use little-endian hashes for some stupid reason
 */
Transaction.prototype.getHash = function ()
{
  var buffer = convert.bytesToWordArray(this.serialize());
  return convert.wordArrayToBytes(SHA256(SHA256(buffer))).reverse();
};

/**
 * Create a copy of this transaction object.
 */
Transaction.prototype.clone = function ()
{
  var newTx = new Transaction();
  newTx.version = this.version;
  newTx.locktime = this.locktime;
  for (var i = 0; i < this.ins.length; i++) {
    var txin = this.ins[i].clone();
    newTx.addInput(txin);
  }
  for (var i = 0; i < this.outs.length; i++) {
    var txout = this.outs[i].clone();
    newTx.addOutput(txout);
  }
  return newTx;
};

/**
 * Analyze how this transaction affects a wallet.
 *
 * Returns an object with properties 'impact', 'type' and 'addr'.
 *
 * 'impact' is an object, see Transaction#calcImpact.
 *
 * 'type' can be one of the following:
 *
 * recv:
 *   This is an incoming transaction, the wallet received money.
 *   'addr' contains the first address in the wallet that receives money
 *   from this transaction.
 *
 * self:
 *   This is an internal transaction, money was sent within the wallet.
 *   'addr' is undefined.
 *
 * sent:
 *   This is an outgoing transaction, money was sent out from the wallet.
 *   'addr' contains the first external address, i.e. the recipient.
 *
 * other:
 *   This method was unable to detect what the transaction does. Either it
 */
Transaction.prototype.analyze = function (wallet) {
  if (!(wallet instanceof Wallet)) return null;

  var allFromMe = true,
  allToMe = true,
  firstRecvHash = null,
  firstMeRecvHash = null,
  firstSendHash = null;

  for (var i = this.outs.length-1; i >= 0; i--) {
    var txout = this.outs[i];
    var hash = txout.script.simpleOutPubKeyHash();
    if (!wallet.hasHash(hash)) {
      allToMe = false;
    } else {
      firstMeRecvHash = hash;
    }
    firstRecvHash = hash;
  }
  for (var i = this.ins.length-1; i >= 0; i--) {
    var txin = this.ins[i];
    firstSendHash = txin.script.simpleInPubKeyHash();
    if (!wallet.hasHash(firstSendHash)) {
      allFromMe = false;
      break;
    }
  }

  var impact = this.calcImpact(wallet);

  var analysis = {};

  analysis.impact = impact;

  if (impact.sign > 0 && impact.value > 0) {
    analysis.type = 'recv';
    analysis.addr = new Address(firstMeRecvHash);
  } else if (allFromMe && allToMe) {
    analysis.type = 'self';
  } else if (allFromMe) {
    analysis.type = 'sent';
    // TODO: Right now, firstRecvHash is the first output, which - if the
    //       transaction was not generated by this library could be the
    //       change address.
    analysis.addr = new Address(firstRecvHash);
  } else  {
    analysis.type = "other";
  }

  return analysis;
};

/**
 * Get a human-readable version of the data returned by Transaction#analyze.
 *
 * This is merely a convenience function. Clients should consider implementing
 * this themselves based on their UI, I18N, etc.
 */
Transaction.prototype.getDescription = function (wallet) {
  var analysis = this.analyze(wallet);

  if (!analysis) return "";

  switch (analysis.type) {
  case 'recv':
    return "Received with "+analysis.addr;
    break;

  case 'sent':
    return "Payment to "+analysis.addr;
    break;

  case 'self':
    return "Payment to yourself";
    break;

  case 'other':
  default:
    return "";
  }
};

/**
 * Get the total amount of a transaction's outputs.
 */
Transaction.prototype.getTotalOutValue = function () {
    return this.outs.reduce(function(t,o) { return t + o.value },0);
};

 /**
  * Old name for Transaction#getTotalOutValue.
  *
  * @deprecated
  */
 Transaction.prototype.getTotalValue = Transaction.prototype.getTotalOutValue;

/**
 * Calculates the impact a transaction has on this wallet.
 *
 * Based on the its public keys, the wallet will calculate the
 * credit or debit of this transaction.
 *
 * It will return an object with two properties:
 *  - sign: 1 or -1 depending on sign of the calculated impact.
 *  - value: amount of calculated impact
 *
 * @returns Object Impact on wallet
 */
Transaction.prototype.calcImpact = function (wallet) {
  if (!(wallet instanceof Wallet)) return 0;

  // Calculate credit to us from all outputs
  var valueOut = this.outs.filter(function(o) {
    return wallet.hasHash(convert.bytesToHex(o.script.simpleOutPubKeyHash()));
  })
  .reduce(function(t,o) { return t+o.value },0);

  var valueIn = this.ins.filter(function(i) {
    return wallet.hasHash(convert.bytesToHex(i.script.simpleInPubKeyHash()))
        && wallet.txIndex[i.outpoint.hash];
  })
  .reduce(function(t,i) {
    return t + wallet.txIndex[i.outpoint.hash].outs[i.outpoint.index].value
  },0);

  if (valueOut > valueIn) {
    return {
      sign: 1,
      value: valueOut - valueIn
    };
  } else {
    return {
      sign: -1,
      value: valueIn - valueOut
    };
  }
};

/**
 * Converts a serialized transaction into a transaction object
 */

Transaction.deserialize = function(buffer) {
    if (typeof buffer == "string") {
        buffer = convert.hexToBytes(buffer)
    }
    var pos = 0;
    var readAsInt = function(bytes) {
        if (bytes == 0) return 0;
        pos++;
        return buffer[pos-1] + readAsInt(bytes-1) * 256;
    }
    var readVarInt = function() {
        pos++;
        if (buffer[pos-1] < 253) {
            return buffer[pos-1];
        }
        return readAsInt(buffer[pos-1] - 251);
    }
    var readBytes = function(bytes) {
        pos += bytes;
        return buffer.slice(pos - bytes, pos);
    }
    var readVarString = function() {
        var size = readVarInt();
        return readBytes(size);
    }
    var obj = {
        ins: [],
        outs: []
    }
    obj.version = readAsInt(4);
    var ins = readVarInt();
    for (var i = 0; i < ins; i++) {
        obj.ins.push({
            outpoint: {
                hash: convert.bytesToHex(readBytes(32).reverse()),
                index: readAsInt(4)
            },
            script: new Script(readVarString()),
            sequence: readAsInt(4)
        });
    }
    var outs = readVarInt();
    for (var i = 0; i < outs; i++) {
        obj.outs.push({
            value: convert.bytesToNum(readBytes(8)),
            script: new Script(readVarString())
        });
    }
    obj.locktime = readAsInt(4);

    return new Transaction(obj);
}

/**
 * Signs a standard output at some index with the given key
 */

Transaction.prototype.sign = function(index, key, type) {
    type = type || SIGHASH_ALL;
    key = new ECKey(key);
    var pub = key.getPub().export('bytes'),
        hash160 = util.sha256ripe160(pub),
        script = Script.createOutputScript(new Address(hash160)),
        hash = this.hashTransactionForSignature( script, index, type),
        sig = key.sign(hash).concat([type]);
    this.ins[index].script = Script.createInputScript(sig,pub);
}

// Takes outputs of the form [{ output: 'txhash:index', address: 'address' },...]
Transaction.prototype.signWithKeys = function(keys, outputs, type) {
    type = type || SIGHASH_ALL;
    var addrdata = keys.map(function(key) {
         key = new ECKey(key);
         return {
            key: key,
            address: key.getBitcoinAddress().toString()
         }
    });
    var hmap = {};
    for (var o in outputs) {
        hmap[outputs[o].output] = outputs[o];
    }
    for (var i = 0; i < this.ins.length; i++) {
        var outpoint = this.ins[i].outpoint.hash+':'+this.ins[i].outpoint.index,
            histItem = hmap[outpoint];
        if (!histItem) continue;
        var thisInputAddrdata = addrdata.filter(function(a) {
            return a.address == histItem.address;
        });
        if (thisInputAddrdata.length == 0) continue;
        this.sign(i,thisInputAddrdata[0].key);
    }
}

/**
 * Signs a P2SH output at some index with the given key
 */

Transaction.prototype.p2shsign = function(index, script, key, type) {
    script = new Script(script);
    key = new ECKey(key);
    type = type || SIGHASH_ALL;
    var hash = this.hashTransactionForSignature(script, index, type),
        sig = key.sign(hash).concat([type]);
    return sig;
}

Transaction.prototype.multisign = Transaction.prototype.p2shsign;

Transaction.prototype.applyMultisigs = function(index, script, sigs, type) {
    this.ins[index].script = Script.createMultiSigInputScript(sigs, script);
}

Transaction.prototype.validateSig = function(index, script, sig, pub) {
    script = new Script(script);
    var hash = this.hashTransactionForSignature(script,index,1);
    return ECDSA.verify(hash, convert.coerceToBytes(sig),
                                      convert.coerceToBytes(pub));
}


var TransactionIn = function (data) {
    if (typeof data == "string")
        this.outpoint = { hash: data.split(':')[0], index: data.split(':')[1] }
    else if (data.outpoint)
        this.outpoint = data.outpoint
    else
        this.outpoint = { hash: data.hash, index: data.index }

    if (data.scriptSig)
        this.script = Script.fromScriptSig(data.scriptSig)
    else if (data.script)
        this.script = data.script
    else
        this.script = new Script(data.script)

    this.sequence = data.sequence || 4294967295;
};

TransactionIn.prototype.clone = function () {
    return new TransactionIn({
        outpoint: {
            hash: this.outpoint.hash,
            index: this.outpoint.index
        },
        script: this.script.clone(),
        sequence: this.sequence
    });
};

var TransactionOut = function (data) {
    this.script =
        data.script instanceof Script    ? data.script.clone()
      : Array.isArray(data.script)        ? new Script(data.script)
      : typeof data.script == "string"   ? new Script(convert.hexToBytes(data.script))
      : data.scriptPubKey                ? Script.fromScriptSig(data.scriptPubKey)
      : data.address                     ? Script.createOutputScript(data.address)
      :                                    new Script();

    if (this.script.buffer.length > 0) this.address = this.script.toAddress();

    this.value =
        Array.isArray(data.value)         ? convert.bytesToNum(data.value)
      : "string" == typeof data.value    ? parseInt(data.value)
      : data.value instanceof BigInteger ? parseInt(data.value.toString())
      :                                    data.value;
};

TransactionOut.prototype.clone = function ()
{
  var newTxout = new TransactionOut({
    script: this.script.clone(),
    value: this.value
  });
  return newTxout;
};

module.exports.Transaction = Transaction;
module.exports.TransactionIn = TransactionIn;
module.exports.TransactionOut = TransactionOut;

},{"./address":37,"./convert":39,"./ecdsa":40,"./eckey":41,"./jsbn/jsbn":45,"./message":47,"./script":50,"./util":52,"./wallet":53,"crypto-js/sha256":30}],52:[function(require,module,exports){
var convert = require('./convert.js')
var Crypto = require('crypto-js');
var RIPEMD160 = Crypto.RIPEMD160;
var SHA256 = Crypto.SHA256;
var HMAC= Crypto.algo.HMAC;

/**
 * Calculate RIPEMD160(SHA256(data)).
 *
 * Takes an arbitrary byte array as inputs and returns the hash as a byte
 * array.
 */
exports.sha256ripe160 = function (data) {
    var wordArray = RIPEMD160(SHA256(convert.bytesToWordArray(data)))
    return convert.wordArrayToBytes(wordArray)
}

exports.HmacFromBytesToBytes = function (hasher, message, key) {
  var hmac = HMAC.create(hasher, convert.bytesToWordArray(key))
  hmac.update(convert.bytesToWordArray(message))
  return convert.wordArrayToBytes(hmac.finalize())
}

exports.error = function(msg) {
    throw new Error(msg);
}

},{"./convert.js":39,"crypto-js":10}],53:[function(require,module,exports){
var Script = require('./script');
var ECKey = require('./eckey').ECKey;
var convert = require('./convert');
var assert = require('assert');
var BigInteger = require('./jsbn/jsbn');
var Transaction = require('./transaction').Transaction;
var TransactionIn = require('./transaction').TransactionIn;
var TransactionOut = require('./transaction').TransactionOut;
var HDNode = require('./hdwallet.js')
var rng = require('secure-random');

var Wallet = function (seed, options) {
    if (!(this instanceof Wallet)) { return new Wallet(seed, options); }

    var options = options || {}
    var network = options.network || 'mainnet'

    // Stored in a closure to make accidental serialization less likely
    var masterkey = null;
    var me = this;
    var accountZero = null;
    var internalAccount = null;
    var externalAccount = null;

    // Addresses
    this.addresses = [];
    this.changeAddresses = [];

    // Transaction output data
    this.outputs = {};

    // Make a new master key
    this.newMasterKey = function(seed, network) {
        if (!seed) seed= rng(32, { array: true })
        masterkey = new HDNode(seed, network);

        // HD first-level child derivation method should be private
        // See https://bitcointalk.org/index.php?topic=405179.msg4415254#msg4415254
        accountZero = masterkey.derivePrivate(0)
        externalAccount = accountZero.derive(0)
        internalAccount = accountZero.derive(1)

        me.addresses = [];
        me.changeAddresses = [];

        me.outputs = {};
    }
    this.newMasterKey(seed, network)


    this.generateAddress = function() {
        var key = externalAccount.derive(this.addresses.length)
        this.addresses.push(key.getBitcoinAddress().toString())
        return this.addresses[this.addresses.length - 1]
    }

    this.generateChangeAddress = function() {
        var key = internalAccount.derive(this.changeAddresses.length)
        this.changeAddresses.push(key.getBitcoinAddress().toString())
        return this.changeAddresses[this.changeAddresses.length - 1]
    }

    // Processes a transaction object
    // If "verified" is true, then we trust the transaction as "final"
    this.processTx = function(tx, verified) {
        var txhash = convert.bytesToHex(tx.getHash())
        for (var i = 0; i < tx.outs.length; i++) {
            if (this.addresses.indexOf(tx.outs[i].address.toString()) >= 0) {
                me.outputs[txhash+':'+i] = {
                    output: txhash+':'+i,
                    value: tx.outs[i].value,
                    address: tx.outs[i].address.toString(),
                    timestamp: new Date().getTime() / 1000,
                    pending: true
                }
            }
        }
        for (var i = 0; i < tx.ins.length; i++) {
            var op = tx.ins[i].outpoint
            var o = me.outputs[op.hash+':'+op.index]
            if (o) {
                o.spend = txhash+':'+i
                o.spendpending = true
                o.timestamp = new Date().getTime() / 1000
            }
        }
    }
    // Processes an output from an external source of the form
    // { output: txhash:index, value: integer, address: address }
    // Excellent compatibility with SX and pybitcointools
    this.processOutput = function(o) {
        if (!this.outputs[o.output] || this.outputs[o.output].pending)
             this.outputs[o.output] = o;
    }

    this.processExistingOutputs = function() {
        var t = new Date().getTime() / 1000
        for (var o in this.outputs) {
            if (o.pending && t > o.timestamp + 1200)
                delete this.outputs[o]
            if (o.spendpending && t > o.timestamp + 1200) {
                o.spendpending = false
                o.spend = false
                delete o.timestamp
            }
        }
    }
    var peoInterval = setInterval(this.processExistingOutputs, 10000)

    this.getUtxoToPay = function(value) {
        var h = []
        for (var out in this.outputs) h.push(this.outputs[out])
        var utxo = h.filter(function(x) { return !x.spend });
        var valuecompare = function(a,b) { return a.value > b.value; }
        var high = utxo.filter(function(o) { return o.value >= value; })
                       .sort(valuecompare);
        if (high.length > 0) return [high[0]];
        utxo.sort(valuecompare);
        var totalval = 0;
        for (var i = 0; i < utxo.length; i++) {
            totalval += utxo[i].value;
            if (totalval >= value) return utxo.slice(0,i+1);
        }
        throw ("Not enough money to send funds including transaction fee. Have: "
                     + (totalval / 100000000) + ", needed: " + (value / 100000000));
    }

    this.mkSend = function(to, value, fee) {
        var utxo = this.getUtxoToPay(value + fee)
        var sum = utxo.reduce(function(t,o) { return t + o.value },0),
            remainder = sum - value - fee
        if (value < 5430) throw new Error("Amount below dust threshold!")
        var unspentOuts = 0;
        for (var o in this.outputs) {
            if (!this.outputs[o].spend) unspentOuts += 1
            if (unspentOuts >= 5) return
        }
        var change = this.addresses[this.addresses.length - 1]
        var toOut = { address: to, value: value },
            changeOut = { address: change, value: remainder }
            halfChangeOut = { address: change, value: Math.floor(remainder/2) };

        var outs =
              remainder < 5430  ? [toOut]
            : remainder < 10860 ? [toOut, changeOut]
            : unspentOuts == 5  ? [toOut, changeOut]
            :                     [toOut, halfChangeOut, halfChangeOut]

        var tx = new Bitcoin.Transaction({
            ins: utxo.map(function(x) { return x.output }),
            outs: outs
        })
        this.sign(tx)
        return tx
    }

    this.mkSendToOutputs = function(outputs, changeIndex, fee) {
        var value = outputs.reduce(function(t,o) { return t + o.value },0),
            utxo = this.getUtxoToPay(value + fee),
            sum = utxo.reduce(function(t,p) { return t + o.value },0);
        utxo[changeIndex].value += sum - value - fee;
        var tx = new Bitcoin.Transaction({
            ins: utxo.map(function(x) { return x.output }),
            outs: outputs
        })
        this.sign(tx)
        return tx
    }

    this.sign = function(tx) {
        tx.ins.map(function(inp,i) {
            var inp = inp.outpoint.hash+':'+inp.outpoint.index;
            if (me.outputs[inp]) {
                var address = me.outputs[inp].address
                tx.sign(i, me.getPrivateKeyForAddress(address))
            }
        })
        return tx;
    }

    this.getMasterKey = function() { return masterkey }
    this.getAccountZero = function() { return accountZero }
    this.getInternalAccount = function() { return internalAccount }
    this.getExternalAccount = function() { return externalAccount }

    this.getPrivateKey = function(index) {
        return externalAccount.derive(index).priv
    }

    this.getInternalPrivateKey = function(index) {
        return internalAccount.derive(index).priv
    }

    this.getPrivateKeyForAddress = function(address) {
      var index;
      if((index = this.addresses.indexOf(address)) > -1) {
        return this.getPrivateKey(index)
      } else if((index = this.changeAddresses.indexOf(address)) > -1) {
        return this.getInternalPrivateKey(index)
      } else {
        throw new Error('Unknown address. Make sure the address is from the keychain and has been generated.')
      }
    }
};

module.exports = Wallet;

},{"./convert":39,"./eckey":41,"./hdwallet.js":42,"./jsbn/jsbn":45,"./script":50,"./transaction":51,"assert":54,"secure-random":36}],54:[function(require,module,exports){
// http://wiki.commonjs.org/wiki/Unit_Testing/1.0
//
// THIS IS NOT TESTED NOR LIKELY TO WORK OUTSIDE V8!
//
// Originally from narwhal.js (http://narwhaljs.org)
// Copyright (c) 2009 Thomas Robinson <280north.com>
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the 'Software'), to
// deal in the Software without restriction, including without limitation the
// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
// sell copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
// ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

// when used in node, this will actually load the util module we depend on
// versus loading the builtin util module as happens otherwise
// this is a bug in node module loading as far as I am concerned
var util = require('./node_modules/util');

var pSlice = Array.prototype.slice;

// 1. The assert module provides functions that throw
// AssertionError's when particular conditions are not met. The
// assert module must conform to the following interface.

var assert = module.exports = ok;

// 2. The AssertionError is defined in assert.
// new assert.AssertionError({ message: message,
//                             actual: actual,
//                             expected: expected })

assert.AssertionError = function AssertionError(options) {
  this.name = 'AssertionError';
  this.actual = options.actual;
  this.expected = options.expected;
  this.operator = options.operator;
  if (options.message) {
    this.message = options.message;
    this.generatedMessage = false;
  } else {
    this.message = getMessage(this);
    this.generatedMessage = true;
  }
  var stackStartFunction = options.stackStartFunction || fail;

  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, stackStartFunction);
  }
};

// assert.AssertionError instanceof Error
util.inherits(assert.AssertionError, Error);

function replacer(key, value) {
  if (util.isUndefined(value)) {
    return '' + value;
  }
  if (util.isNumber(value) && (isNaN(value) || !isFinite(value))) {
    return value.toString();
  }
  if (util.isFunction(value) || util.isRegExp(value)) {
    return value.toString();
  }
  return value;
}

function truncate(s, n) {
  if (util.isString(s)) {
    return s.length < n ? s : s.slice(0, n);
  } else {
    return s;
  }
}

function getMessage(self) {
  return truncate(JSON.stringify(self.actual, replacer), 128) + ' ' +
         self.operator + ' ' +
         truncate(JSON.stringify(self.expected, replacer), 128);
}

// At present only the three keys mentioned above are used and
// understood by the spec. Implementations or sub modules can pass
// other keys to the AssertionError's constructor - they will be
// ignored.

// 3. All of the following functions must throw an AssertionError
// when a corresponding condition is not met, with a message that
// may be undefined if not provided.  All assertion methods provide
// both the actual and expected values to the assertion error for
// display purposes.

function fail(actual, expected, message, operator, stackStartFunction) {
  throw new assert.AssertionError({
    message: message,
    actual: actual,
    expected: expected,
    operator: operator,
    stackStartFunction: stackStartFunction
  });
}

// EXTENSION! allows for well behaved errors defined elsewhere.
assert.fail = fail;

// 4. Pure assertion tests whether a value is truthy, as determined
// by !!guard.
// assert.ok(guard, message_opt);
// This statement is equivalent to assert.equal(true, !!guard,
// message_opt);. To test strictly for the value true, use
// assert.strictEqual(true, guard, message_opt);.

function ok(value, message) {
  if (!value) fail(value, true, message, '==', assert.ok);
}
assert.ok = ok;

// 5. The equality assertion tests shallow, coercive equality with
// ==.
// assert.equal(actual, expected, message_opt);

assert.equal = function equal(actual, expected, message) {
  if (actual != expected) fail(actual, expected, message, '==', assert.equal);
};

// 6. The non-equality assertion tests for whether two objects are not equal
// with != assert.notEqual(actual, expected, message_opt);

assert.notEqual = function notEqual(actual, expected, message) {
  if (actual == expected) {
    fail(actual, expected, message, '!=', assert.notEqual);
  }
};

// 7. The equivalence assertion tests a deep equality relation.
// assert.deepEqual(actual, expected, message_opt);

assert.deepEqual = function deepEqual(actual, expected, message) {
  if (!_deepEqual(actual, expected)) {
    fail(actual, expected, message, 'deepEqual', assert.deepEqual);
  }
};

function _deepEqual(actual, expected) {
  // 7.1. All identical values are equivalent, as determined by ===.
  if (actual === expected) {
    return true;

  } else if (util.isBuffer(actual) && util.isBuffer(expected)) {
    if (actual.length != expected.length) return false;

    for (var i = 0; i < actual.length; i++) {
      if (actual[i] !== expected[i]) return false;
    }

    return true;

  // 7.2. If the expected value is a Date object, the actual value is
  // equivalent if it is also a Date object that refers to the same time.
  } else if (util.isDate(actual) && util.isDate(expected)) {
    return actual.getTime() === expected.getTime();

  // 7.3 If the expected value is a RegExp object, the actual value is
  // equivalent if it is also a RegExp object with the same source and
  // properties (`global`, `multiline`, `lastIndex`, `ignoreCase`).
  } else if (util.isRegExp(actual) && util.isRegExp(expected)) {
    return actual.source === expected.source &&
           actual.global === expected.global &&
           actual.multiline === expected.multiline &&
           actual.lastIndex === expected.lastIndex &&
           actual.ignoreCase === expected.ignoreCase;

  // 7.4. Other pairs that do not both pass typeof value == 'object',
  // equivalence is determined by ==.
  } else if (!util.isObject(actual) && !util.isObject(expected)) {
    return actual == expected;

  // 7.5 For all other Object pairs, including Array objects, equivalence is
  // determined by having the same number of owned properties (as verified
  // with Object.prototype.hasOwnProperty.call), the same set of keys
  // (although not necessarily the same order), equivalent values for every
  // corresponding key, and an identical 'prototype' property. Note: this
  // accounts for both named and indexed properties on Arrays.
  } else {
    return objEquiv(actual, expected);
  }
}

function isArguments(object) {
  return Object.prototype.toString.call(object) == '[object Arguments]';
}

function objEquiv(a, b) {
  if (util.isNullOrUndefined(a) || util.isNullOrUndefined(b))
    return false;
  // an identical 'prototype' property.
  if (a.prototype !== b.prototype) return false;
  //~~~I've managed to break Object.keys through screwy arguments passing.
  //   Converting to array solves the problem.
  if (isArguments(a)) {
    if (!isArguments(b)) {
      return false;
    }
    a = pSlice.call(a);
    b = pSlice.call(b);
    return _deepEqual(a, b);
  }
  try {
    var ka = Object.keys(a),
        kb = Object.keys(b),
        key, i;
  } catch (e) {//happens when one is a string literal and the other isn't
    return false;
  }
  // having the same number of owned properties (keys incorporates
  // hasOwnProperty)
  if (ka.length != kb.length)
    return false;
  //the same set of keys (although not necessarily the same order),
  ka.sort();
  kb.sort();
  //~~~cheap key test
  for (i = ka.length - 1; i >= 0; i--) {
    if (ka[i] != kb[i])
      return false;
  }
  //equivalent values for every corresponding key, and
  //~~~possibly expensive deep test
  for (i = ka.length - 1; i >= 0; i--) {
    key = ka[i];
    if (!_deepEqual(a[key], b[key])) return false;
  }
  return true;
}

// 8. The non-equivalence assertion tests for any deep inequality.
// assert.notDeepEqual(actual, expected, message_opt);

assert.notDeepEqual = function notDeepEqual(actual, expected, message) {
  if (_deepEqual(actual, expected)) {
    fail(actual, expected, message, 'notDeepEqual', assert.notDeepEqual);
  }
};

// 9. The strict equality assertion tests strict equality, as determined by ===.
// assert.strictEqual(actual, expected, message_opt);

assert.strictEqual = function strictEqual(actual, expected, message) {
  if (actual !== expected) {
    fail(actual, expected, message, '===', assert.strictEqual);
  }
};

// 10. The strict non-equality assertion tests for strict inequality, as
// determined by !==.  assert.notStrictEqual(actual, expected, message_opt);

assert.notStrictEqual = function notStrictEqual(actual, expected, message) {
  if (actual === expected) {
    fail(actual, expected, message, '!==', assert.notStrictEqual);
  }
};

function expectedException(actual, expected) {
  if (!actual || !expected) {
    return false;
  }

  if (Object.prototype.toString.call(expected) == '[object RegExp]') {
    return expected.test(actual);
  } else if (actual instanceof expected) {
    return true;
  } else if (expected.call({}, actual) === true) {
    return true;
  }

  return false;
}

function _throws(shouldThrow, block, expected, message) {
  var actual;

  if (util.isString(expected)) {
    message = expected;
    expected = null;
  }

  try {
    block();
  } catch (e) {
    actual = e;
  }

  message = (expected && expected.name ? ' (' + expected.name + ').' : '.') +
            (message ? ' ' + message : '.');

  if (shouldThrow && !actual) {
    fail(actual, expected, 'Missing expected exception' + message);
  }

  if (!shouldThrow && expectedException(actual, expected)) {
    fail(actual, expected, 'Got unwanted exception' + message);
  }

  if ((shouldThrow && actual && expected &&
      !expectedException(actual, expected)) || (!shouldThrow && actual)) {
    throw actual;
  }
}

// 11. Expected to throw an error:
// assert.throws(block, Error_opt, message_opt);

assert.throws = function(block, /*optional*/error, /*optional*/message) {
  _throws.apply(this, [true].concat(pSlice.call(arguments)));
};

// EXTENSION! This is annoying to write outside this module.
assert.doesNotThrow = function(block, /*optional*/message) {
  _throws.apply(this, [false].concat(pSlice.call(arguments)));
};

assert.ifError = function(err) { if (err) {throw err;}};

},{"./node_modules/util":56}],55:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.binarySlice === 'function'
    ;
}

},{}],56:[function(require,module,exports){
var process=require("__browserify_process"),global=typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {};// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = function(ctor, superCtor) {
  ctor.super_ = superCtor;
  ctor.prototype = Object.create(superCtor.prototype, {
    constructor: {
      value: ctor,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
};

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

},{"./support/isBuffer":55,"__browserify_process":59}],57:[function(require,module,exports){

},{}],58:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],59:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            if (ev.source === window && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],60:[function(require,module,exports){
module.exports=require(55)
},{}],61:[function(require,module,exports){
var process=require("__browserify_process"),global=typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {};// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

},{"./support/isBuffer":60,"__browserify_process":59,"inherits":58}]},{},[43])
(43)
});
;