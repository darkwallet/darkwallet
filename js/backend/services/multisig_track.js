'use strict';

define(['backend/port', 'util/protocol', 'util/btc', 'dwutil/multisig'], function(Port, Protocol, BtcUtils, MultisigFund) {

  /*
   * Service tracking and sending multisig actions
   * @constructor
   */
  function MultisigTrackService(core) {
    var self = this;
    this.name = 'multisigTrack';
    this.core = core;    

    // Connect to wallet port for identity cleanup and startup
    Port.connect('wallet', function(data) {
      // Cleanup on identity change;
    });

    // Connect to contacts port to know about contacts becoming available
    Port.connect('contacts', function(data) {
        if (data.type == 'contact') {
            self.onContactAvailable(data.peer);
        }
    });
    Port.connect('channel', function(data) {
        if (data.type == 'initChannel') {
            var channel = core.getLobbyTransport().getChannel(data.name);
            channel.addCallback('MultisigAnnounce', function(msg) { self.onMultisigAnnounce(msg) });
            channel.addCallback('MultisigSpend', function(msg) { self.onMultisigSpend(msg) } );
        }
    });

  }

  /**
   * Check for peer tasks
   */
  MultisigTrackService.prototype.checkPeerTasks = function(peer, section) {
      var self = this;
      var identity = this.core.getCurrentIdentity();
      var contact = peer.contact;

      var tasks = identity.tasks.getTasks(section);

      // Iterate over tasks
      tasks.forEach(function(task) {
          task.participants.forEach(function(participant) {
              if (!participant[1]) {
                  var taskContact = identity.contacts.findByPubKey(participant[0]);
                  if (taskContact == contact) {
                      self.send(peer, section, task);
                  }
              }
          });
      });
  }

  /**
   * A contact becomes available.
   */
  MultisigTrackService.prototype.onContactAvailable = function(peer) {
      // See if we have anything to send to this contact
      this.checkPeerTasks(peer, 'multisig');
      this.checkPeerTasks(peer, 'multisig-announce');

  }

  /**
   * Start a task for a multisig with slots for every participant.
   */
  MultisigTrackService.prototype.prepareTask = function(task, multisig) {
      // Prepare the announce multisig task
      task.participants = [];
      task.started = Date.now();
      multisig.pubKeys.forEach(function(pubKey) {
          task.participants.push([pubKey.slice(), false])
      });
      task.address = multisig.address;
      return task;
  }

  /**
   * Queue announcing the multisig to all peers
   */
  MultisigTrackService.prototype.announce = function(multisig, walletAddress) {
      var identity = this.core.getCurrentIdentity();

      var task = this.prepareTask({}, multisig);

      // Add the task
      identity.tasks.addTask('multisig-announce', task);
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
      identity.tasks.addTask('multisig', task);
      return task;
  }

  /**
   * Send a task to a contact
   */
  MultisigTrackService.prototype.send = function(peer, section, task) {
      var msg;
      if (section == 'multisig') {
          msg = Protocol.MultisigSpendMsg(task.address, task.tx);
          msg.body.pending = task.pending;
      } else if (section == 'multisig-announce') {
          var identity = this.core.getCurrentIdentity();
          var multisig = identity.wallet.multisig.search({address: task.address});
          msg = Protocol.MultisigAnnounceMsg(multisig.script);
          msg.body.name = multisig.name;
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
      var multisig = BtcUtils.importMultisig(script, identity.wallet.versions.p2sh);

      // see if we already have this multisig
      var prevFund = identity.wallet.multisig.search({address: multisig.address});
      if (!prevFund) {
          var task = { fund: multisig, name: msg.body.name };
          identity.tasks.addTask('multisig-invite', task);
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

      // TODO: only supporting one in pocket/multisig here
      var multisig = identity.wallet.multisig.search({address: address});
      if (!multisig) {
          return;
          // throw Error("The selected multisig does not exist");
      }
      var fund = new MultisigFund(multisig);
      var spend = fund.importTransaction(txHex);
      if (spend) {
          // add list of participants to contact
          this.prepareTask(spend.task, multisig);
      }
  }

  return MultisigTrackService;

});
