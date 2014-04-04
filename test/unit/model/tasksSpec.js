/**
 * @fileOverview Pending tasks
 */

define(['model/tasks', 'model/store', 'model/keyring', 'util/mock/chrome_mock'],
function(Tasks, Store, IdentityKeyRing, chrome) {

  var keyring, store, tasks;
  
  beforeEach(function() {
    chrome.storage.local.clear();
    keyring = new IdentityKeyRing();
    store = new Store({}, keyring);
    tasks = new Tasks(store);
  });
  
  var tasksSample =  {
    multisig : [
      { tx : 'mocktx' },
      { tx : 'mocktx' }
    ],
    foo : [ 'bar' ]
  };
  
  describe('Tasks model', function() {
    it('is created properly', function() {
      expect(tasks.store).toBe(store);
      expect(tasks.tasks).toEqual({});
    });

    it('adds tasks', function() {
      tasks.addTask('multisig', {tx: 'mocktx'});
      tasks.addTask('multisig', {tx: 'mocktx'});
      tasks.addTask('foo', 'bar');
      expect(tasks.tasks).toEqual(tasksSample);
      expect(chrome.storage.local._()).toEqual({
        'dw:identity:undefined' : { tasks: tasksSample }
      });
    });

    it('removes task', function() {
      var task = {epic: 'fail'};
      tasks.tasks.lol = [];
      tasks.tasks.lol.push(task);
      tasks.store.save();
      expect(tasks.tasks.lol.indexOf(task)).toEqual(0);
      tasks.removeTask('lol', task);
      expect(tasks.tasks.lol).toEqual([]);
      expect(chrome.storage.local._()).toEqual({ 'dw:identity:undefined' : { tasks : { lol : [  ] } } });
    });

    it('gets open tasks', function() {
      expect(tasks.getOpenTasks()).toEqual(0);
      tasks.tasks = tasksSample;
      expect(tasks.getOpenTasks()).toEqual(3);
    });
  });
});
