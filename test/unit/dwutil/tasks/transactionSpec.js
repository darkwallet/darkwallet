'use strict';

define(['testUtils'], function(testUtils) {

  describe('Transaction tasks', function() {
    var TransactionTasks, tasks, activeTasks;

    beforeEach(function(done) {
      activeTasks = {send: [], receive: []};
      tasks = [];
      testUtils.stub('darkwallet', {
        getIdentity: function() {
            return {
                tasks: {
                    store: {save: function(){}},
                    search: function(section){return activeTasks[section]?activeTasks[section][0]:null},
                    getTasks: function(section){return activeTasks[section]},
                    addTask: function(section, task){
                        tasks.push([section, task]);
                        activeTasks[section].push(task);
                    }
                }
            }
        }
      });


      testUtils.loadWithCurrentStubs('dwutil/tasks/transaction', function(_TransactionTasks) {
        TransactionTasks = _TransactionTasks;
        done();
      });

    });

    it('processes a spend', function() {
        var task = TransactionTasks.processSpend("foo", 10, [{address: 'bla'}]);

        expect(task).toEqual({hash: 'foo', height: 0, recipients: [{address : 'bla'}], address: 'bla', value: -10, radar: 0, progress: 0, confirmations: 0, state: 'sending' })
        expect(tasks.length).toBe(1);

        // already there
        var task2 = TransactionTasks.processSpend("foo", 10, [{address: 'bla'}]);
        expect(task2).toBe(task);
    })

    it('processes a radar event', function() {
        var task = TransactionTasks.processSpend("foo", 10, [{address: 'bla'}]);
        
        TransactionTasks.processRadar(task, 0.25);
        expect(task.state).toBe('sending');
        expect(task.radar).toBe(0.25);
        expect(task.progress).toBe(2.5);
        TransactionTasks.processRadar(task, 0.5);
        expect(task.state).toBe('sending');
        expect(task.radar).toBe(0.5);
        expect(task.progress).toBe(5);
        TransactionTasks.processRadar(task, 0.8);
        expect(task.state).toBe('unconfirmed');
        expect(task.radar).toBe(0.8);
        expect(task.progress).toBe(10);
    })

    it('processes some output history and confirms the task', function() {
        activeTasks = {receive: [{height:0}]};
        var history = [["a1b0c4cb40f018d379adf9ff5c1aaf62a8e4083a3b0dc125ad843b169af9f329", 0, 287813, 40000, null, null, null]];

        var updated = TransactionTasks.processHistory(history, 287814);

        expect(updated).toBe(true);
        expect(activeTasks.receive[0].height).toBe(287813);
        expect(activeTasks.receive[0].state).toBe('confirmed');
        expect(activeTasks.receive[0].confirmations).toBe(2);
    })

    it('processes some input history', function() {
        activeTasks = {send: [{height:0}]};
        var history = [["a1b0c4cb40f018d379adf9ff5c1aaf62a8e4083a3b0dc125ad843b169af9f329", 0, 287813, 40000, 'foo', 0, 287818]];

        var updated = TransactionTasks.processHistory(history, 0);

        expect(updated).toBe(true);
        expect(activeTasks.send[0].height).toBe(287818);
    })

    it('processes some output history with height', function() {
        activeTasks = {receive: [{height:0}]};
        var history = [["a1b0c4cb40f018d379adf9ff5c1aaf62a8e4083a3b0dc125ad843b169af9f329", 0, 287813, 40000, null, null, null]];

        var updated = TransactionTasks.processHistory(history, 300813);

        expect(updated).toBe(true);
        expect(activeTasks.receive[0].height).toBe(287813);
    })

    it('processes some input history with height', function() {
        activeTasks = {send: [{height:0}]};
        var history = [["a1b0c4cb40f018d379adf9ff5c1aaf62a8e4083a3b0dc125ad843b169af9f329", 0, 287813, 40000, 'foo', 0, 287818]];

        var updated = TransactionTasks.processHistory(history, 300813);

        expect(updated).toBe(true);
        expect(activeTasks.send[0].height).toBe(287818);
    })


    it('processes some old history', function() {
        activeTasks = {receive: [{height:300813}]};
        var history = [["a1b0c4cb40f018d379adf9ff5c1aaf62a8e4083a3b0dc125ad843b169af9f329", 0, 287813, 40000, null, null, null]];

        var updated = TransactionTasks.processHistory(history, 0);

        expect(updated).toBe(false);
        expect(activeTasks.receive[0].height).toBe(300813);
    })

    it('processes an incoming row and confirms the task', function() {
        activeTasks.receive [{height:0, hash: 'foo'}];
        var row = {height: 300000, hash: 'foo'};
        var task = TransactionTasks.processRow(10, row, 300004);
        
        expect(task.state).toBe('confirmed');
        expect(task.confirmations).toBe(5);
        expect(task.height).toBe(300000);
        expect(task.hash).toBe('foo');

        expect(activeTasks.receive.length).toBe(1)
        expect(activeTasks.send.length).toBe(0)
    })


    it('processes an incoming row', function() {
        activeTasks.receive [{height:0, hash: 'foo'}];
        var row = {height: 0, hash: 'foo'};
        var task = TransactionTasks.processRow(10, row, 300004);
        
        expect(task.state).toBe('unconfirmed');
        expect(task.confirmations).toBe(0);
        expect(task.height).toBe(0);
        expect(task.hash).toBe('foo');

        expect(activeTasks.receive.length).toBe(1)
        expect(activeTasks.send.length).toBe(0)
    })

    it('processes an outgoing row', function() {
        activeTasks.send = [{height:300000, hash: 'foo'}];
        var row = {height: 300000, address: 'address', hash: 'foo'};
        var task = TransactionTasks.processRow(-10, row, 300004);
 
        expect(task.state).toBe('confirmed');
        expect(task.confirmations).toBe(5);
        expect(task.height).toBe(300000);
        expect(task.hash).toBe('foo');
        expect(task.address).toBe('address');
        expect(task.recipients).toEqual([ { address : 'address', amount : -10 } ]);

        expect(activeTasks.receive.length).toBe(0)
        expect(activeTasks.send.length).toBe(1)
    })

    it('processes a new incoming row', function() {
        var row = {height: 280001, hash: 'foo'};
        var task = TransactionTasks.processRow(10, row, 300000);
        
        expect(task.state).toBe('finished');
        expect(task.confirmations).toBe(20000);
        expect(task.height).toBe(280001);
        expect(task.hash).toBe('foo');

        expect(activeTasks.receive.length).toBe(1)
        expect(activeTasks.send.length).toBe(0)
    })

    it('processes a new outgoing row', function() {
        var row = {height: 280000, address: 'address', hash: 'foo'};
        var task = TransactionTasks.processRow(-10, row, 300000);
 
        expect(task.state).toBe('finished');
        expect(task.confirmations).toBe(20001);
        expect(task.height).toBe(280000);
        expect(task.hash).toBe('foo');
        expect(task.address).toBe('address');
        expect(task.recipients).toEqual([ { address : 'address', amount : -10 } ]);

        expect(activeTasks.receive.length).toBe(0)
        expect(activeTasks.send.length).toBe(1)
    })


    it('processes a height update with no tasks', function() {

        TransactionTasks.processHeight(300002);

        expect(activeTasks.send.length).toBe(0);
        expect(activeTasks.receive.length).toBe(0);
    })

    it('processes a height update', function() {
        activeTasks.receive = [{height:300001, hash: 'foo2', state: 'confirmed'}];
        activeTasks.send = [{height:290000, hash: 'foo', state: 'confirmed'}];

        TransactionTasks.processHeight(300002);

        var stask = activeTasks.send[0];
        var rtask = activeTasks.receive[0];

        expect(rtask.progress).toBe(42.9);
        expect(stask.progress).toBe(100);
        expect(rtask.confirmations).toBe(2);
        expect(stask.confirmations).toBe(10003);
        expect(stask.state).toBe('finished');
        expect(rtask.state).toBe('confirmed');
    })


    it('updates height for one task', function() {
        var row = {height: 280001, hash: 'foo'};
        var task = TransactionTasks.processRow(10, row, 280002);
        TransactionTasks.updateTaskHeight(task, 300009);


        expect(task.progress).toBe(100);
        expect(task.confirmations).toBe(20009);
        expect(task.state).toBe('finished');
    })
  });
});
