/**
 * @fileOverview Pending tasks
 */

define(['model/tasks', 'model/store', 'model/keyring', 'util/mock/chrome_mock'],
function(Tasks, Store, IdentityKeyRing, chrome) {
  describe('Tasks model', function() {
    var _store, store, tasks;
  
    beforeEach(function() {
        store = {
        init: function(key, value) {
          return value;
        },
        save: function() {
          _store = {};
          for(var i in tasks.tasks) {
            _store[i] = tasks.tasks[i];
          }
        }
      }
      tasks = new Tasks(store);
    });

    var tasksSample =  {
      multisig : [
        { tx : 'mocktx' },
        { tx : 'mocktx' }
      ],
      foo : [ 'bar' ]
    };

    it('is created properly', function() {
      expect(tasks.store).toBe(store);
      expect(tasks.tasks).toEqual({});
    });

    it('adds tasks', function() {
      tasks.addTask('multisig', {tx: 'mocktx'});
      tasks.addTask('multisig', {tx: 'mocktx'});
      tasks.addTask('foo', 'bar');
      expect(tasks.tasks).toEqual(tasksSample);
      expect(_store).toEqual(tasksSample);
    });

    it('removes task', function() {
      var task = {epic: 'fail'};
      tasks.tasks.lol = [task];
      tasks.store.save();
      
      tasks.removeTask('lol', task);
      expect(tasks.tasks.lol).toEqual([]);
      expect(_store).toEqual({lol: []});
    });

    it('gets open tasks', function() {
      expect(tasks.getOpenTasks()).toEqual(0);
      tasks.tasks = tasksSample;
      expect(tasks.getOpenTasks()).toEqual(3);
    });
  });
});
