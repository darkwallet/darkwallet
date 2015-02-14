'use strict';

define(['backend/port', 'util/protocol'], function(Port, Protocol) {

  /******************
   * Delivery tasks
   * {
   *     id:   <destination idkey>
   *     msg:  <json message>
   *     sent: <timestamp>
   *     ack:  <timestamp>
   **/

  /**
   * Service tracking and sending messages to peers
   * @constructor
   */
  function DeliveryService(core) {
    var self = this;
    this.name = 'delivery';
    this.core = core;
    this.ongoing = {};
    this.messages = [];

    // Connect to wallet port for identity cleanup and startup
    Port.connect('wallet', function(data) {
      // Cleanup on identity change;
      if (data.type === 'ready') {
        self.onIdentityStart();
      }
      else if (data.type === 'closing') {
        self.ongoing = {};
        self.messages = [];
      }
    });

    // Connect to contacts port to know about contacts becoming available
    Port.connect('contacts', function(data) {
        if (data.type === 'contact') {
            self.onContactAvailable(data.peer);
        }
    });

    // Connect to channel port to receive acks
    Port.connect('channel', function(data) {
        if (data.type === 'initChannel') {
            console.log("[delivery] connecting", data.name);
            var channel = core.getLobbyTransport().getChannel(data.name);
            channel.addCallback('Ack', function(msg) { self.onAck(msg); } );
            channel.addCallback('DeliveryTest', function(msg) { self.onDeliveryTest(msg); } );
        }
    });


  }

  /**
   * Send message
   */
  DeliveryService.prototype.sendMessage = function(contacts, message) {
      var newTask = {peers: {}, msg: message, timestamp: Date.now()};
      var online = [];
      contacts.forEach(function(contact) {
          newTask.peers[contact.findIdentityKey().data] = {};
          if (contact.online) {
              online.push(contact);
          }
      });
      this.messages.push(newTask);
      online.forEach(function(contact) {
          this.send(contact.online, newTask);
      });
  };

  /**
   * Identity is starting
   */
  DeliveryService.prototype.onIdentityStart = function() {
      console.log("[delivery] starting identity...");
      var identity = this.core.getCurrentIdentity();
      // Initialize delivery tasks on identity
      if (!identity.tasks.tasks.hasOwnProperty('delivery')) {
          identity.tasks.tasks['delivery'] = [];
      }
      this.messages = identity.tasks.tasks['delivery'];
  };

  /**
   * A contact becomes available.
   * @private
   */
  DeliveryService.prototype.onContactAvailable = function(peer) {
      // See if we have anything to send to this contact
      var idKey = peer.contact.findIdentityKey();
      if (idKey) {
          this.checkPeerMessages(peer, idKey);
      }
  };

  /**
   * Check for peer messages
   * @private
   */
  DeliveryService.prototype.checkPeerMessages = function(peer, idKey) {
      console.log("[delivery] contact available", peer.contact.data.name, idKey.data);
      var self = this;

      // Iterate over tasks
      this.messages.forEach(function(message) {
          if (idKey && message.peers[idKey] && !message.peers[idKey].ack) {
              self.send(peer, message);
          }
      });
  };

  /**
   * Send a task to a contact
   * @private
   */
  DeliveryService.prototype.send = function(peer, task) {
      var msg = task.msg;
      var idKey = peer.contact.findIdentityKey();
      task.peers[idKey].sent = Date.now();
      if (msg && msg.body) {
          // keep track of sent until ack arrives
          msg.body.id = Math.random();
          this.ongoing[msg.body.id] = task;
      }

      peer.channel.postDH(peer.pubKey, msg, function() {});
  };

  /**
   * Acknowledge receiving a spend request
   * @private
   */
  DeliveryService.prototype.sendAck = function(peer, body) {
      // Add the task
      var msg = Protocol.AckMsg(body.id);
      peer.channel.postDH(peer.pubKey, msg, function() {});
  };

  /**
   * A new multisig ack has arrived
   * @private
   */
  DeliveryService.prototype.onAck = function(msg) {
      var peer = msg.peer;
      var tracking = this.ongoing[msg.body.id];
      if (tracking) {
          var idKey = peer.contact.findIdentityKey();
          tracking.peers[idKey].ack = Date.now();
          delete this.ongoing[msg.body.id];
      }
  };

  /**
   * Send test message
   */
  DeliveryService.prototype.sendDeliveryTest = function(contact) {
      var peer = contact.online;
      var msg = Protocol.packMessage('DeliveryTest', {'text': 'test'});
      this.sendMessage([contact], msg);
  };

  /**
   * Receive test message
   * @private
   */
  DeliveryService.prototype.onDeliveryTest = function(msg) {
      var peer = msg.peer;
      this.sendAck(peer, msg.body);
  };

  return DeliveryService;

});
