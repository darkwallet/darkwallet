'use strict';

define(['backend/port', 'util/protocol', 'util/btc', 'dwutil/multisig', 'bitcoinjs-lib'], function(Port, Protocol, BtcUtils, MultisigFund, Bitcoin) {

  var convert = Bitcoin.convert;

  /*
   * Service tracking and sending multisig actions
   * @constructor
   */
  function MultisigTrackService(core) {
    var self = this;
    this.name = 'multisigTrack';
    this.core = core;
    this.ongoing = {};

    // Connect to wallet port for identity cleanup and startup
    Port.connect('wallet', function(data) {
      // Cleanup on identity change;
      if (data.type == 'closing') {
        self.ongoing = {};
      }
    });

    // Connect to contacts port to know about contacts becoming available
    Port.connect('contacts', function(data) {
        if (data.type == 'contact') {
            self.onContactAvailable(data.peer);
        }
    });
    Port.connect('channel', function(data) {
        if (data.type == 'initChannel') {
            console.log("[msTrack] connecting", data.name);
            var channel = core.getLobbyTransport().getChannel(data.name);
            channel.addCallback('MultisigAnnounce', function(msg) { self.onMultisigAnnounce(msg) });
            channel.addCallback('MultisigSpend', function(msg) { self.onMultisigSpend(msg) } );
            channel.addCallback('MultisigAck', function(msg) { self.onMultisigAck(msg) } );
            channel.addCallback('MultisigSign', function(msg) { self.onMultisigSign(msg) } );
        }
    });

  }

  /**
   * Check a peer task
   */
  MultisigTrackService.prototype.checkPeerTask = function(peer, section, task) {
      var self = this;
      var identity = this.core.getCurrentIdentity();
      var contact = peer.contact;

      if (!task.participants) {
          var multisig = identity.wallet.multisig.search({address: task.inPocket});
          if (!multisig) {
              return
          }
          self.prepareTask(task, multisig);
      }

      task.participants.forEach(function(participant) {
          participant.available = true;
          if (!participant.sent || (participant.peer != peer.fingerprint)) {
              var taskContact = identity.contacts.findByPubKey(participant.pubKey);
              if (taskContact == contact) {
                  participant.peer = peer.fingerprint;
                  console.log("[msTrack]", section);
                  self.send(peer, section, task, participant);
              }
          }
      });
  }

  /**
   * Check for peer tasks
   */
  MultisigTrackService.prototype.checkPeerTasks = function(peer, section) {
      var self = this;
      var identity = this.core.getCurrentIdentity();

      var tasks = identity.tasks.getTasks(section);

      // Iterate over tasks
      tasks.forEach(function(task) {
          self.checkPeerTask(peer, section, task);
      });
  }

  /**
   * A contact becomes available.
   */
  MultisigTrackService.prototype.onContactAvailable = function(peer) {
      // See if we have anything to send to this contact
      this.checkPeerTasks(peer, 'multisig');
      this.checkPeerTasks(peer, 'multisig-announce');
      this.checkPeerTasks(peer, 'multisig-sign');

  }

  /**
   * Start a task for a multisig with slots for every participant.
   * @private
   */
  MultisigTrackService.prototype.prepareTask = function(task, multisig) {
      // Prepare the announce multisig task
      task.participants = [];
      task.started = Date.now();
      multisig.pubKeys.forEach(function(pubKey) {
          // pubkey, available, sent, ack, signature
          var state = {pubKey: pubKey.slice(), available: false, sent: false, ack: false, sig: null};
          task.participants.push(state)
      });
      task.address = multisig.address;
      return task;
  }

  /**
   * Add a task and check if we can send it to any peers
   * @private
   */
  MultisigTrackService.prototype.addTask = function(section, task) {
      var self = this;
      var identity = this.core.getCurrentIdentity();

      // Store the task so we can keep track of it
      identity.tasks.addTask(section, task);

      // Now see if we're connected and check contacts
      var transport = this.core.service.lobby.lobbyTransport;
      if (transport) {
          transport.peers.forEach(function(peer) {
              if (peer.contact) {
                  self.checkPeerTask(peer, section, task);
              }
          });
      }
  }

  /**
   * Queue announcing the multisig to all peers
   */
  MultisigTrackService.prototype.announce = function(multisig, walletAddress) {
      var task = this.prepareTask({}, multisig);

      // Add the task
      this.addTask('multisig-announce', task);
      return task;
  }

  MultisigTrackService.prototype.accept = function(task) {
      var identity = this.core.getCurrentIdentity();

      task.state  = 'finished';

      var exists = identity.wallet.multisig.search({address: task.fund.address});
      if (!exists) {
          var multisig = task.fund;
          multisig.name = task.name;
          multisig.participants = multisig.pubKeys.slice();
          var walletAddress = identity.wallet.multisig.addFund(multisig);
          this.core.initAddress(walletAddress);
      }

      // identity.tasks.removeTask('multisig-invite', task);
  }

  /**
   * Create a task for sending the sign
   */
  MultisigTrackService.prototype.sign = function(multisig, tx, signature) {
      var task = this.prepareTask({}, multisig);
      task.hash = convert.bytesToHex(tx.getHash());
      task.signature = convert.bytesToHex(signature);

      // Add the task
      this.addTask('multisig-sign', task);
      return task;
  }


  /**
   * Send the spend to other peers so it can be spent
   */
  MultisigTrackService.prototype.spend = function(txHex, pending) {
      var identity = this.core.getCurrentIdentity();

      // TODO: only supporting one in pocket/multisig here
      var address = pending[0].address;
      var multisig = identity.wallet.multisig.search({address: address});
      if (!multisig) {
          throw Error("The selected multisig does not exist");
      }
      var task = this.prepareTask({}, multisig);
      task.tx = txHex;
      task.pending = pending;

      // TODO inPocket must be removed in favour of task.address
      task.inPocket = address;

      // Add the task
      this.addTask('multisig', task);
      return task;
  }

  /**
   * Send a task to a contact
   * @private
   */
  MultisigTrackService.prototype.send = function(peer, section, task, tracking) {
      var msg;
      if (section == 'multisig') {
          msg = Protocol.MultisigSpendMsg(task.address, task.tx);
          msg.body.pending = task.pending;
      } else if (section == 'multisig-announce') {
          var identity = this.core.getCurrentIdentity();
          var multisig = identity.wallet.multisig.search({address: task.address});
          msg = Protocol.MultisigAnnounceMsg(multisig.script);
          msg.body.name = multisig.name;
      } else if (section == 'multisig-sign') {
          msg = Protocol.MultisigSignMsg(task.address, task.hash, [task.signature]);
      }
 
      if (msg) {
          // keep track of sent until ack arrives
          msg.body.id = Math.random();
          tracking.sent = msg.body.id;
          this.ongoing[msg.body.id] = tracking;
      }

      peer.channel.postDH(peer.pubKey, msg, function() {});
  }

  /**
   * A new multisig was received, queue for accepting
   */
  MultisigTrackService.prototype.onMultisigAnnounce = function(msg) {
      var identity = this.core.getCurrentIdentity();
      var peer = msg.peer;
      var script = msg.body.script;

      // parse the multisig
      var multisig = BtcUtils.importMultiSig(script, identity.wallet.versions.p2sh);

      // see if we already have this multisig
      var prevFund = identity.wallet.multisig.search({address: multisig.address});
      if (!prevFund) {
          var task = { fund: multisig, name: msg.body.name };
          this.addTask('multisig-invite', task);
      }
  }

  /**
   * Acknowledge receiving a spend request
   * @private
   */
  MultisigTrackService.prototype.sendAck = function(peer, spend) {
      // Add the task
      var msg = Protocol.MultisigAckMsg(spend.id);
      peer.channel.postDH(peer.pubKey, msg, function() {});
  }


  /**
   * A new spend arrived from a peer, queue for spending
   */
  MultisigTrackService.prototype.onMultisigSign = function(msg) {
      var peer = msg.peer;
      var txHash = msg.body.hash;
      var address = msg.body.address;
      var sigHex = msg.body.sig[0];

      // Ack
      this.sendAck(peer, msg.body);

      // TODO: only supporting one in pocket/multisig here
      var multisig = identity.wallet.multisig.search({address: address});
      if (!multisig) {
          return;
          // throw Error("The selected multisig does not exist");
      }
      var fund = new MultisigFund(multisig);

      var spend = fund.getSpend(txHash);
      if (spend) {
          fund.importSignature(sigHex, spend);
      }
  }

  /**
   * A new spend arrived from a peer, queue for spending
   */
  MultisigTrackService.prototype.onMultisigSpend = function(msg) {
      var identity = this.core.getCurrentIdentity();
      var peer = msg.peer;
      var txHex = msg.body.tx;
      var address = msg.body.address;

      // Ack
      this.sendAck(peer, msg.body);

      // TODO: only supporting one in pocket/multisig here
      var multisig = identity.wallet.multisig.search({address: address});
      if (!multisig) {
          return;
          // throw Error("The selected multisig does not exist");
      }
      var prev = identity.tasks.search('multisig', 'tx', txHex);
      if (!prev) {
          var fund = new MultisigFund(multisig);
          var spend = fund.importTransaction(txHex);
          if (spend) {
              // add list of participants to contact
              this.prepareTask(spend.task, multisig);
          }
      }
  }

  /**
   * A new multisig ack has arrived
   */
  MultisigTrackService.prototype.onMultisigAck = function(msg) {
      var identity = this.core.getCurrentIdentity();
      var peer = msg.peer;
      var tracking = this.ongoing[msg.body.id];
      if (tracking) {
          tracking.ack = true;
          delete this.ongoing[msg.body.id];
      }
  }

  return MultisigTrackService;

});
