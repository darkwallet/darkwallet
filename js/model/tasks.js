/**
 * @fileOverview Pending tasks
 */

define(function() {

/**
 * Tasks class.
 * @param {Object} store Object store
 * @constructor
 */
function Tasks(store) {
  this.store = store;
  this.tasks = this.store.init('tasks', {});
}

Tasks.prototype.addTask = function(section, task) {
    if (!this.tasks.hasOwnProperty(section)) {
        this.tasks[section] = [];
    }
    this.tasks[section].push(task);
    this.store.save();
}

Tasks.prototype.removeTask = function(section, task) {
    if (!this.tasks.hasOwnProperty(section)) {
        return;
    }
    var idx = this.tasks[section].indexOf(task);
    this.tasks[section].splice(idx, 1);
    this.store.save();
}

Tasks.prototype.getOpenTasks = function() {
    var self = this;
    var nOpen = 0;
    Object.keys(this.tasks).forEach(function(section) {
        nOpen += self.tasks[section].length;
    });
    return nOpen;
}

return Tasks;
});
