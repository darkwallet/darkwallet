/**
 * @fileOverview HistoryProvider angular provider
 */
'use strict';

define(['./module'], function (providers) {
  providers.factory('$tabs', ['$templateCache', '$http', '$location', '$route', '_Filter', function($templateCache, $http, $location, $route, _) {

  var tabs = {};

  /**
   * Tabs
   */ 
  tabs.current = 0;

  tabs.previous = 0;
  tabs.pocketType = 'all';

  tabs.openWallet = function() {
     tabs.pages[tabs.current].select();
  }
 
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
 
  tabs.open = function(pocketType, pocketId) {
     tabs.pocketType = pocketType;
     tabs.pocketId = pocketId;
     tabs.pages[tabs.current].select();
  }

  Tab.prototype.select = function() {
      var dest = 'wallet/'+this.page;
      if (tabs.pocketType) {
          dest += '/'+tabs.pocketType;
      }
      if (tabs.pocketId !== undefined) {
          dest += '/'+tabs.pocketId;
      }
      $location.path(dest);

  };

  Tab.prototype.load = function(callback) {
      var self = this;
      var tplUrl = this.tplUrl;
      // Finish setting the tab
      var finish = function() {
          tabs.previous = tabs.current;
          tabs.current = self.index;
          callback ? callback() : undefined;
      }
      // Load straight away or preload the template
      if ($templateCache.get(tplUrl)) {
          finish();
      } else {
          $http.get(tplUrl, {cache:$templateCache}).success(function() {finish();});
      }
  };
  
  /* To get with npm run i18n-update:
   * _('Overview'), _('History'), _('Fund'), _('Addresses'), _('Tasks'), _('Actions');
   */
  tabs.pages = [
      new Tab('Overview', 'dashboard'),
      new Tab('History', 'history'),
      new Tab('Fund', 'fund'),
      new Tab('Addresses', 'addresses'),
      new Tab('Tasks', 'tasks'),
      new Tab('Actions', 'actions')
  ];
  
  tabs.visible = [0, 1, 3]; // Overview, history and addresses

  tabs.loadRoute = function(section, pocketType, pocketId, callback) {
      tabs.pocketType = pocketType;
      tabs.pocketId = pocketId;
      for(var i=0; i<tabs.pages.length; i++) {
          if (tabs.pages[i].page == section) {
              tabs.pages[i].load(callback);
          }
      }
  };
 
  tabs.updateTabs = function(pocketType, tasks) {
      if (pocketType === 'multisig') {
          tabs.visible = [0, 1, 2]; // Overview, history and fund
      } else {
          tabs.visible = [0, 1, 3]; // Overview, history, addresses
      }
      if (tasks && tasks.length) {
          tabs.visible.push(4); // Tasks
      }
      if (['multisig', 'all', 'init'].indexOf(pocketType) == -1) {
          tabs.visible.push(5); // Actions
      }
      if (!tabs.pages[tabs.current].isVisible()) {
          tabs.current = 0;      
      }
  };

  return tabs;
  }]);
});
