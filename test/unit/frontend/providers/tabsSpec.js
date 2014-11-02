'use strict';

define(['angular-mocks', 'frontend/providers/tabs'], function(mocks) {
  describe('Tabs provider', function() {

    var tabs, $templateCache, $http, $location, $route, currentPath;
    
    // '$templateCache', '$http', '$location', '$route'
    beforeEach(function(done){
      mocks.module("DarkWallet.providers");
      mocks.module(function($provide) {
        // Override services
        $provide.value('$route', {});
        $provide.value('_Filter', function(s, x, y) {return s.replace(/\{0\}/, x);});
      });
      mocks.inject([ '$templateCache', '$http', '$location', '$route', '$tabs', function(_$templateCache_, _$http_, _$location_, _$route_, _$tabs_) {
        $templateCache = _$templateCache_;
        $http = _$http_;
        $location = _$location_;
        $route = _$route_;
        $templateCache.get = function() { return true; };
        tabs = _$tabs_;
        done();
      }]);
    });

    it('is initiated correctly', function() {
      expect(tabs.current).toBe(0);
      expect(tabs.previous).toBe(0);
      expect(tabs.visible).toEqual([0, 1, 3]);
    });
    
    it('selects a tab', function() {
      tabs.pages[2].load();
      expect(tabs.current).toBe(2);
      expect(tabs.previous).toBe(0);
      
      tabs.pages[4].load();
      expect(tabs.current).toBe(4);
      expect(tabs.previous).toBe(2);
      
      expect(tabs.pages[0].isActive()).toBe(false);
      expect(tabs.pages[4].isActive()).toBe(true);
    });
    
    describe('updates visible tabs', function() {
      it('when in overview', function() {
        tabs.updateTabs('all', []);
        expect(tabs.visible).toEqual([0, 1, 3]);
      });
      
      it('when in a pocket', function() {
        tabs.updateTabs('hd', []);
        expect(tabs.visible).toEqual([0, 1, 3, 5]);
      });
      
      it('when in a fund', function() {
        tabs.updateTabs('multisig', []);
        expect(tabs.visible).toEqual([0, 1, 2]);
      });
      
      it('when pending tasks', function() {
        tabs.updateTabs('all', [{}]);
        expect(tabs.visible).toEqual([ 0, 1, 3, 4 ]);
        
        tabs.updateTabs('hd', [{}]);
        expect(tabs.visible).toEqual([ 0, 1, 3, 4, 5 ]);
        
        tabs.updateTabs('multisig', [{}]);
        expect(tabs.visible).toEqual([ 0, 1, 2, 4 ]);
      });
    });
    it('selects another tab if current is not visible', function() {
      tabs.current = 5;
      tabs.updateTabs('hd');
      expect(tabs.current).toBe(5);
      tabs.updateTabs('multisig');
      expect(tabs.current).toBe(0);
    });
  });
});
