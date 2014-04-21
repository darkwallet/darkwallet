'use strict';

define(['darkwallet'], function(DarkWallet) {

/**
 * Transaction Tasks
 * Static class to manage send and receive tasks
 */

var TransactionTasks = {};

/**
 * Create a task for a spend initiated by the wallet
 */
TransactionTasks.processSpend = function(hash, total, recipients) {
    var identity = DarkWallet.getIdentity();
    if (identity.tasks.search('send', 'hash', hash)) {
        // already sent
        return;
    }
    var task = { hash: hash, height: 0, recipients: recipients};

    task.address = recipients[0].address;
    // task expects negative for outgoing and positive for incoming
    task.value = -total;

    task.radar = 0;
    task.progress = 0;
    task.confirmations = 0;
    task.state = 'sending';

    identity.tasks.addTask('send', task);
    return task;
}

/**
 * Process radar value incoming (from 0 to 1)
 */
TransactionTasks.processRadar = function(task, count) {
    task.radar = count;
    if (count >= 0.7 && task.state == 'sending') {
        task.state = 'unconfirmed';
        task.progress = 10;
    } else if (task.state == 'sending') {
        task.progress = count*10;
    }
}


/**
 * Process a history report from obelisk
 */
TransactionTasks.processHistory = function(history, height) {
    var identity = DarkWallet.getIdentity();

    var updated = false;

    // process history
    history.forEach(function(tx) {
        // sum unspent outputs for the address
        var outTxHash = tx[0];
        var inTxHash = tx[4];

        // check if we had some receive task for the outputs
        var taskOut = identity.tasks.search('receive', 'hash', outTxHash);
        if (taskOut && !taskOut.height) {
            taskOut.height = tx[2];
            taskOut.state = tx[2] ? 'confirmed' : 'unconfirmed';
            if (TransactionTasks.updateTaskHeight(taskOut, height)) {
                updated = true;
            }
        }
        // check if we had some send task for the spends
        if (inTxHash) {
            var taskIn = identity.tasks.search('send', 'hash', inTxHash);
            if (taskIn && !taskIn.height) {
                taskIn.height = tx[6];
                taskIn.state = tx[6] ? 'confirmed' : 'unconfirmed';
                if (TransactionTasks.updateTaskHeight(taskIn, height)) {
                    updated = true;
                }
            }
        }
    });
    return true;
}

/**
 * Create or update a task for given history row (from an incoming transaction)
 */
TransactionTasks.processRow = function(value, row, height) {
    var created;
    var section = value>0 ? 'receive' : 'send';
    var identity = DarkWallet.getIdentity();
    var task = identity.tasks.search(section, 'hash', row.hash);
    if (!task) {
        // Since we create tasks for spends ourselves this should be 'receive'
        task = { hash: row.hash, height: row.height, value: value, progress: 10 };
        created = true;
    }

    // save initial height when confirmed
    if (row.height && !task.height) {
        task.height = row.height;
    }
    if (!task.address && !(task.recipients && task.recipients.length)) {
        task.address = row.address;
        task.recipients = [{address: row.address, amount: value}]
    }
    if (row.height) {
        task.state = 'confirmed';
    } else {
        task.state = 'unconfirmed';
        task.confirmations = 0;
    }

    TransactionTasks.updateTaskHeight(task, height);

    if (created) {
        identity.tasks.addTask(section, task);
    } else {
        identity.tasks.store.save();
    }
    return task;
};


/**
 * Process height for all transaction tasks
 */
TransactionTasks.processHeight = function(height) {
    var identity = DarkWallet.getIdentity();

    var spendTasks = identity.tasks.getTasks('send');
    var receiveTasks = identity.tasks.getTasks('receive');
    var tasks = spendTasks.concat(receiveTasks);

    var updated = false;
    tasks.forEach(function(task) {
        if (TransactionTasks.updateTaskHeight(task, height)) {
            updated = true;
        }
    });
    if (updated) {
        identity.tasks.store.save();
    }
};


/**
 * Process height for one task
 * @private
 */
TransactionTasks.updateTaskHeight = function(task, height) {
    var progress;

    // save some data in the task
    if (task.state == 'confirmed') {
        task.confirmations = height ? 1 + height - task.height : 0;
        progress = (((1 + task.confirmations) / 7 )*100).toFixed(1);
        task.progress = Math.min(100, progress);

        // If fully confirmed set to finished
        if (task.confirmations >= 6) {
            task.state = 'finished';
        }
        return true;
    }
};

/**
 * Check for already finished tasks
 */
TransactionTasks.checkFinished = function() {
    var identity = DarkWallet.getIdentity();

    var sendTasks = identity.tasks.getTasks('send');
    var receiveTasks = identity.tasks.getTasks('receive');

    var tasks = sendTasks.concat(receiveTasks);
    var updated;
    tasks.forEach(function(task) {
        if (task.state == 'finished') {
            TransactionTasks.removeTask(task)
            updated = true;
        }
    })
    return updated;
}

/**
 * Remove a task
 * @private
 */
TransactionTasks.removeTask = function(task) {
    var identity = DarkWallet.getIdentity();
    var section = task.value > 0 ? 'receive' : 'send';

    identity.tasks.removeTask(section, task);
}

return TransactionTasks;

});
