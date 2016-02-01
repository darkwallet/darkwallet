/*
 * @fileOverview Stealth support.
 */
'use strict';

define(['bitcoinjs-lib', 'convert', 'bigi', 'bs58check', 'buffer'], function(Bitcoin, Convert, BigInteger, base58check, Buffer) {

var PaymentCodes = {};

PaymentCodes.codeVersion = 0x1
PaymentCodes.addressVersion = 0x23

PaymentCodes.formatNotificationAddress = function(mpKey, version) {
    //var mpKey = Bitcoin.HDNode.fromBase58(mpk);
    var childKey = mpKey.derive(0);
    var pubKey = childKey.pubKey;
    var address = pubKey.getAddress(Bitcoin.networks.bitcoin);
    return address;
}

PaymentCodes.formatAddress = function(mpk, version) {
    if (version === undefined || version === null) {
        version = PaymentCodes.addressVersion;
    }
    var code = PaymentCodes.formatCode(mpk);
    var payload = new Buffer(code.length+1);
    payload.writeUInt8(0x47, 0)
    code.copy(payload, 1);
    return base58check.encode(payload);
}
PaymentCodes.formatCode = function(mpk, version) {
    if (version === undefined || version === null) {
        version = PaymentCodes.codeVersion;
    }
    // Header, version will be added later when encoding
    // features bit field. All bits must be zero except where specified elsewhere in this specification
    var buffer = new Buffer(80);
    var features = 0;
    buffer.writeUInt8(version, 0);
    buffer.writeUInt8(features, 1);
    var sign_and_x = mpk.pubKey.Q.getEncoded(true);
    //var sign = y.isEven() ? 0x02 : 0x03;
    //var xValue = mpk.pubKey.Q.affineX;
    var chainCode = mpk.chainCode;
    sign_and_x.copy(buffer, 2);
    chainCode.copy(buffer, 35);
    return buffer;
}

PaymentCodes.parseBuffer = function(buffer, version) {
    if (!Buffer.isBuffer(buffer)) {
      buffer = new Buffer(buffer);
    }
    var version = buffer.readUInt8(0);
    var features = buffer.readUInt8(1);
    var pointData = buffer.slice(2, 35)
    var chainCode = buffer.slice(35, 67);
    
    var pubKey = Bitcoin.ECPubKey.fromBuffer(pointData);
    var hdNode = new Bitcoin.HDNode(pubKey.Q, chainCode);
    return hdNode;
}

PaymentCodes.parseAddress = function(pCodeAddress) {
    var buffer = base58check.decode(pCodeAddress);
    return PaymentCodes.parseBuffer(buffer.slice(1));
}

PaymentCodes.maskCode = function(codeRaw, mask) {
    var code = new Bitcoin.Buffer(codeRaw);
    var pointData = code.slice(3, 35);
    var chainCode = code.slice(35, 67);
    for(var i=0; i<32; i++) {
        pointData[i] ^= mask[i];
        chainCode[i] ^= mask[i+32];
    }
    pointData.copy(code, 3);
    chainCode.copy(code, 35);
    return code;
}

PaymentCodes.createNotification = function(output, inputPrivKey, myMpk, otherCode) {
    var tx = new Bitcoin.Transaction();
    tx.addInput(output.receive.split(":")[0], parseInt(output.receive.split(":")[1]));
    var input = tx.ins[0];
    var value = output.value;
    // Prepare destination notification address
    var address = PaymentCodes.formatNotificationAddress(PaymentCodes.parseBuffer(otherCode));
    // Prepare payload
    var payload = PaymentCodes.createNotificationPayload(output, inputPrivKey, myMpk, otherCode);
    // add notification output
    tx.addOutput(address.toString(), value);
    // add op_return output
    var chunks = [Bitcoin.opcodes.OP_RETURN, payload];
    var payloadScript = Bitcoin.Script.fromChunks(chunks);
    tx.addOutput(payloadScript, 0);
    return tx;
}

PaymentCodes.formatOutpoint = function(outHash, outValue) {
    var buffer = new Bitcoin.Buffer(36);
    new Bitcoin.Buffer(outHash, "hex").copy(buffer, 0);
    buffer.writeUInt32BE(outValue, 32);
    return buffer;
}

PaymentCodes.createNotificationPayload = function(output, inputPrivKey, myMpk, otherCode) {
    var privKey = inputPrivKey;
    var mpKey = PaymentCodes.parseBuffer(otherCode);
    var childKey = mpKey.derive(0);
    var pubKey = childKey.pubKey;

    // Calculate shared secret
    var output = [output.receive.split(":")[0], parseInt(output.receive.split(":")[1])];
    var s = PaymentCodes.getSharedMask(pubKey, privKey, output);

    // mask paymentcode
    var myCode = PaymentCodes.formatCode(myMpk);
    myCode = PaymentCodes.maskCode(myCode, s);
    return myCode;
}

PaymentCodes.getSharedMask = function(pubKey, privKey, output) {
    // Calculate shared secret
    // 32 bytes: txId, 4 bytes
    var secretPoint = pubKey.Q.multiply(privKey.d);
    var secretX = secretPoint.affineX;
    var outPoint = PaymentCodes.formatOutpoint(output[0], output[1]);
    var s = Bitcoin.crypto.HmacSHA512(secretX, outPoint);
    return s;
};

PaymentCodes.receiveNotification = function(tx, masterPriv, pubKey) {
 //   var pubKey = tx.ins[0].pubKey;
    var privNotificationKey = masterPriv.derive(0).privKey;

    var output = [Bitcoin.bufferutils.reverse(tx.ins[0].hash).toString("hex"), tx.ins[0].index];
    var s = PaymentCodes.getSharedMask(pubKey, privNotificationKey, output);
    /*var secretPoint = pubKey.Q.multiply(privNotificationKey.d);
    var secretX = secretPoint.affineX;
    var outPoint = PaymentCodes.formatOutpoint(Bitcoin.bufferutils.reverse(tx.ins[0].hash).toString("hex"), tx.ins[0].index);
    var s = Bitcoin.crypto.HmacSHA512(secretX, outPoint);*/
    
    // Get peer payment code
    var payload = tx.outs[1].script.toBuffer().slice(3);
    var code = PaymentCodes.maskCode(payload, s);
    // check updated x is member of secp256k1
    return code;
}

PaymentCodes.getSharedSecret = function(privKey, pubKey) {
    // Alice calculates a secret point: <pre>S = aB</pre>
    var secretPoint = pubKey.Q.multiply(privKey.d);

    // Alice calculates a scalar shared secret using the x value of S: <pre>s = SHA256(Sx)</pre>
    var S1 = secretPoint.affineX.toBuffer();
    // XXX Could have been:
    // var S1 = secretPoint.affineX.getEncoded(true);

    // var S1 = new Buffer([3].concat(point.affineX.toBuffer().toJSON().data));
    return S1;
}

PaymentCodes.getSharedSecretHash = function(privKey, pubKey) {
    var S1 = PaymentCodes.getSharedSecret(privKey, pubKey);
    var s = Bitcoin.crypto.sha256(S1);
    return BigInteger.fromBuffer(s);
}

PaymentCodes.getEphemeralPrivate = function(privKey, pubKey) {
    var s = PaymentCodes.getSharedSecretHash(privKey, pubKey);
    var ephemPrivData = privKey.d
                        .add(s).mod(Bitcoin.ECKey.curve.n);
    var privKey = new Bitcoin.ECKey(ephemPrivData, true);
    return privKey;

}

PaymentCodes.getEphemeral = function(privKey, pubKey, pivot) {
    var s = PaymentCodes.getSharedSecretHash(privKey, pubKey);
    //  Alice uses the scalar shared secret to calculate the ephemeral public key used to generate the P2PKH address for this transaction: <pre>B' = B + sG</pre>
    var ephemKeyPoint = pivot.Q
                          .add(new Bitcoin.ECKey(s).pub.Q);
    var pubKey = new Bitcoin.ECPubKey(ephemKeyPoint, true);
    return pubKey;
};

PaymentCodes.pCodeToPubKey = function(otherCode, seq) {
    var otherMpk;
    if (typeof otherCode === 'string') {
        otherMpk = PaymentCodes.parseAddress(otherCode);
    } else {
        otherMpk = PaymentCodes.parseBuffer(otherCode);
    }
    return otherMpk.derive(seq).pubKey;

};

PaymentCodes.send = function(masterPriv, otherCode, seq) {
    var privKey = masterPriv.derive(0).privKey;
    var pubKey = PaymentCodes.pCodeToPubKey(otherCode, seq);

    return PaymentCodes.getEphemeral(privKey, pubKey, pubKey);
};

PaymentCodes.receive = function(masterPriv, otherCode, seq) {
    var privKey = masterPriv.derive(seq).privKey;
    var pubKey = PaymentCodes.pCodeToPubKey(otherCode, 0);

    return PaymentCodes.getEphemeral(privKey, pubKey, privKey.pub);
};

PaymentCodes.receivePrivate = function(masterPriv, otherCode, seq) {
    var privKey = masterPriv.derive(seq).privKey;
    var pubKey = PaymentCodes.pCodeToPubKey(otherCode, 0);

    return PaymentCodes.getEphemeralPrivate(privKey, pubKey);
};


return PaymentCodes;
});
