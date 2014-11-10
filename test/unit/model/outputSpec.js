/*
 * @fileOverview Output model
 */
'use strict';

define(['model/output'], function(Output) {
  describe('Output creation', function() {

    it('is created properly', function() {
      var output = new Output([], 'txid', 1000, '16WBGwrNqNUMQex7XtXhhxF8LzSoc7oAi1');
      expect(output.receive).toBe('txid')
      expect(output.address).toBe('16WBGwrNqNUMQex7XtXhhxF8LzSoc7oAi1')
      expect(output.value).toBe(1000)
    });
    
    it('is created properly from cache', function() {
      var output = new Output(['txid', 1000, '16WBGwrNqNUMQex7XtXhhxF8LzSoc7oAi1']);
      expect(output.receive).toBe('txid')
      expect(output.address).toBe('16WBGwrNqNUMQex7XtXhhxF8LzSoc7oAi1')
      expect(output.value).toBe(1000)
    });
  });

  describe('Output getters and setters', function() {
    var output;
    beforeEach(function() {
      output = new Output([], 'txid', 1000, '16WBGwrNqNUMQex7XtXhhxF8LzSoc7oAi1');
    });

    it('sets and gets height', function() {
      output.height = 4000;
      expect(output.height).toBe(4000);
    });
    it('sets and gets spend', function() {
      output.spend = 'spendid';
      expect(output.spend).toBe('spendid');
    });
    it('sets and gets counted', function() {
      output.counted = true;
      expect(output.counted).toBe(true);
    });
    it('sets and gets spendpending', function() {
      output.spendpending = true;
      expect(output.spendpending).toBe(true);
    });
    it('sets and gets spendheight', function() {
      output.spendheight = 4001;
      expect(output.spendheight).toBe(4001);
    });
    it('sets and gets stealth', function() {
      output.stealth = true;
      expect(output.stealth).toBe(true);
    });

  });
});
