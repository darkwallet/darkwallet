'use strict';

define(['bitcoinjs-lib'],
function (Bitcoin) {

  var SHA256 = Bitcoin.CryptoJS.SHA256;
  var convert = Bitcoin.convert;

  // ChannelUtils module
  var ChannelUtils = {};

  /** 
   * Get a hash derived from the channel name 
   */ 
  ChannelUtils.hashChannelName = function(channel) { 
      var channelHash = SHA256(SHA256(SHA256('Lobby channel: ' + channel))); 
      channelHash = convert.wordArrayToBytes(channelHash); 
      return convert.bytesToHex(channelHash); 
  }; 

  return ChannelUtils;

});
