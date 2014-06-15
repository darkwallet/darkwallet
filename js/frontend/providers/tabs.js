/**
 * @fileOverview HistoryProvider angular provider
 */
'use strict';

define(['./module'], function (providers) {
  providers.factory('$tabs', ['$templateCache', '$http', function($templateCache, $http) {

  var tabs = {};

  /**
   * Tabs
   */ 
  tabs.current = 0;

  tabs.previous = 0;
  
  var index = 0;

  var Tab = function(heading, page) {
    this.index = index++;
    this.heading = heading;
    this.page = page;
    this.tplUrl = 'wallet/'+page+'.html';
  }
  
  Tab.prototype.isActive = function() {
      return tabs.current == this.index;
  };
  
  Tab.prototype.isVisible = function() {
      return tabs.visible.indexOf(this.index) > -1;
  };
  
  Tab.prototype.select = function() {
    var self = this;
    var tplUrl = this.tplUrl;
    // Finish setting the tab
    var finish = function() {
      tabs.previous = tabs.current;
      tabs.current = self.index;
    }
    // Load straight away or preload the template
    if ($templateCache.get(tplUrl)) {
        finish();
    } else {
        $http.get(tplUrl, {cache:$templateCache}).success(function() {finish();});
    }

  };
  
  tabs.pages = [
    new Tab('Overview', 'dashboard'),
    new Tab('History', 'history'),
    new Tab('Fund', 'fund'),
    new Tab('Addresses', 'addresses'),
    new Tab('Tasks', 'tasks'),
    new Tab('Actions', 'actions')
  ];
  
  tabs.visible = [0, 1, 3]; // Overview, history and addresses

  tabs.updateTabs = function(isAll, isFund, tasks) {
      if (isFund) {
          tabs.visible = [0, 1, 2]; // Overview, history and fund
      } else {
          tabs.visible = [0, 1, 3]; // Overview, history, addresses
      }
      if (tasks && tasks.length) {
          tabs.visible.push(4); // Tasks
      }
      if (!isFund && !isAll) {
          tabs.visible.push(5); // Actions
      }
      if (!tabs.pages[tabs.current].isVisible()) {
          tabs.current = 0;      
      }
  };

  return tabs;
  }]);
});
