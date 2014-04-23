/**
 * @fileOverview HistoryProvider angular provider
 */
'use strict';

define(['./module'], function (providers) {

  var tabs = {};

  /**
   * Tabs
   */ 
  tabs.current = 0;

  tabs.previous = 0;

  tabs.pages = [
      {heading: 'Overview', page: 'dashboard', active: true, visible: true},
      {heading: 'History', page: 'history', visible: true},
      {heading: 'Fund', page: 'fund'},
      {heading: 'Addresses', page: 'addresses', visible: true},
      {heading: 'Tasks', page: 'tasks'},
      {heading: 'Actions', page: 'actions'}
  ];

  tabs.selectTab = function(selected, index) {
      tabs.previous = tabs.current;
      tabs.current = index;
      tabs.pages.forEach(function(tab) {
          tab.active = tab.page == selected.page;
      });
  };

  tabs.updateTabs = function(isAll, isFund, tasks) {
      if (isFund) {
          tabs.pages[2].visible = true;  // fund
          tabs.pages[3].visible = false; // addresses
          tabs.pages[5].visible = false; // actions
      } else {
          tabs.pages[2].visible = false; // fund
          tabs.pages[3].visible = true; // addresses
          tabs.pages[5].visible = !isAll;  // actions
      }
      if (tasks && tasks.length) {
          tabs.pages[4].visible = true;
      } else {
          tabs.pages[4].visible = false;
      }
      if (tabs.pages[tabs.current].visible == false) {
          tabs.pages[tabs.current].active = false;
          tabs.current = 0;
          tabs.pages[0].active = true;      
      }
  }

  providers.factory('$tabs', [function() {
      return tabs;
  }]);


});
