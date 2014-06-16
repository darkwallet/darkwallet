'use strict';

define(['angular-mocks', 'frontend/providers/tabs'], function(mocks) {
  describe('Tabs provider', function() {

    var tabs, $templateCache;
    
    beforeEach(mocks.module("DarkWallet.providers"));
    beforeEach(mocks.inject(['$tabs', '$templateCache', function(_$tabs_, _$templateCache_) {
      tabs = _$tabs_;
      $templateCache = _$templateCache_;
      $templateCache.get = function() { return true; };
      
    }]));

    it('is initiated correctly', function() {
      expect(tabs.current).toBe(0);
      expect(tabs.previous).toBe(0);
      expect(tabs.visible).toEqual([0, 1, 3]);
    });
    
    it('selects a tab', function() {
      tabs.pages[2].select();
      expect(tabs.current).toBe(2);
      expect(tabs.previous).toBe(0);
      
      tabs.pages[4].select();
      expect(tabs.current).toBe(4);
      expect(tabs.previous).toBe(2);
      
      expect(tabs.pages[0].isActive()).toBe(false);
      expect(tabs.pages[4].isActive()).toBe(true);
    });
    
    describe('updates visible tabs', function() {
      it('when in overview', function() {
        tabs.updateTabs(true, false, []);
        expect(tabs.visible).toEqual([0, 1, 3]);
      });
      
      it('when in a pocket', function() {
        tabs.updateTabs(false, false, []);
        expect(tabs.visible).toEqual([0, 1, 3, 5]);
      });
      
      it('when in a fund', function() {
        tabs.updateTabs(false, true, []);
        expect(tabs.visible).toEqual([0, 1, 2]);
      });
      
      it('when pending tasks', function() {
        tabs.updateTabs(true, false, [{}]);
        expect(tabs.visible).toEqual([ 0, 1, 3, 4 ]);
        
        tabs.updateTabs(false, false, [{}]);
        expect(tabs.visible).toEqual([ 0, 1, 3, 4, 5 ]);
        
        tabs.updateTabs(false, true, [{}]);
        expect(tabs.visible).toEqual([ 0, 1, 2, 4 ]);
      });
    });
    it('selects another tab if current is not visible', function() {
      tabs.current = 5;
      tabs.updateTabs(false, false);
      expect(tabs.current).toBe(5);
      tabs.updateTabs(false, true);
      expect(tabs.current).toBe(0);
    });
  });
});
