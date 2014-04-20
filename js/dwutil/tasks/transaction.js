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
    if (identity.tasks.search('spend', 'hash', hash)) {
        // already sent
        return;
    }
    var task = { hash: hash, height: 0, recipients: recipients};

    task.address = recipients[0].address;
    task.value = total;

    task.progress = 0;
    task.confirmations = 0;
    task.state = 'unconfirmed';

    identity.tasks.addTask('spend', task);
    return task;
}


/**
 * Create or update a task for given history row (from an incoming transaction)
 */
TransactionTasks.processRow = function(type, value, row, height) {
    var created;
    var identity = DarkWallet.getIdentity();
    var task = identity.tasks.search(type, 'hash', row.hash);
    if (!task) {
        task = { hash: row.hash, height: row.height, value: value };
        created = true;
    }
    console.log("process row", task, height, row);

    // save initial height when confirmed
    if (row.height && !task.height) {
        task.height = row.height;
    }
    if (!task.address && !(task.recipients && task.recipients.length)) {
        task.address = row.address;
        task.recipients = [{address: row.address, amount: value}]
    }
    task.state = height ? 'confirmed' : 'unconfirmed';

    this.updateTaskHeight(task, height);

    if (created) {
        identity.tasks.addTask(type, task);
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

    tasks.forEach(function(task) {
        TransactionTasks.updateTaskHeight(task, height);
    });
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
    } else {
        progress=10;
    }
    task.progress = Math.min(100, progress);
};

return TransactionTasks;

});
