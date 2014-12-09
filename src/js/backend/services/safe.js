'use strict';

define(['backend/port', 'crypto-js'], function(Port, CryptoJS) {

  /*
   * Service handling 'safe' temporary session passwords
   * @constructor
   */
  function SafeService(core) {
    var store = {};
    this.name = 'safe';
    
    // Port for communication with other services
    Port.connect('wallet', function(data) {
      // Cleanup on identity change;
      if (data.type == 'closing') {
        store = {};
      }
    });

    this.hash = function(section, value) {
        return CryptoJS.SHA256(section+':'+core.getCurrentIdentity().name+value).toString();
    };
    this.set = function(section, name, value) {
        var result = this.hash(section, value);
        store[this.hash(section, name)] = result;
        return result;
    };

    this.get = function(section, name) {
        return store[this.hash(section, name)];
    };
  }
   
  return SafeService;

});
