'use strict';

define(['util/scanner'], function(Scanner) {

   var client = {fetch_history: function(address, height, cb) {
     if(address==='1NoYpPj9yn6Ae4PcjAhQeU6yrhTkkAasZN' || address==='1NmG1PMcwkz9UGpfu3Aa1hsGyKCApTjPvJ') {
       cb(null, [1,2,3]);
     } else {
       cb(null, []);
     }
   }};
   var priv = 'xprv9xJCM5Y7Zn6TkwLiSZjUKtkREpxRpi7KFcKKja4kMLpU8gDXygR3JP1jUAL591CcKwgKJVNHd68e4HxVFTkuiVHX5zZfPLFkx13c1FRxfmA';
   var identity = {
     store: {
        get: function() { return 5; }
     },
     wallet: {
        mpk: 'xpub693Ab9Kv7vQjSJ9fZLKAWjqPUEjSyM7LidCCZW8wGosvZKi3Pf2ijiGe1MDTBmQnpXU795HNb4ebuW95tbLNuAzXndALZpRkRaRCbXDhafA',
        oldMpk: 'xpub693Ab9Kv7vQjSJ9fZLKAWjqPUEjSyM7LidCCZW8wGosvZKi3Pf2ijiGe1MDTBmQnpXU795HNb4ebuW95tbLNuAzXndALZpRkRaRCbXDhafA',
        versions: {address: 0}
     }
   };

   describe('HD Scanner new style', function() { 
     it('is created properly', function() {
       var updateCb = function() {};
       var finishCb = function() {};
       var scanner = new Scanner(client, identity, priv, finishCb, updateCb);
       expect(scanner.scanned).toBe(0);
       expect(scanner.status).toBe('');
       expect(scanner.used).toEqual([]);
     });
     it('sets margins', function() {
       var updateCb = function() {};
       var finishCb = function() {};
       var scanner = new Scanner(client, identity, priv, finishCb, updateCb);
       scanner.setMargins(3, 10);
       expect(scanner.pocketMargin).toBe(6);
       expect(scanner.addressMargin).toBe(10);
       expect(scanner.target).toBe(60);
     });
     it('gets address', function() {
       var updateCb = function() {};
       var finishCb = function() {};
       var scanner = new Scanner(client, identity, priv, finishCb, updateCb);
       var address1 = scanner.getAddress(3, 3);
       var address2 = scanner.getAddress(3, 4);
       expect(address1).toBe('1MMaNMDQRLL9HVo9oQnQQFXmeqtJzpYUSE');
       expect(address2).toBe('16rB9qg1XJvppg58Kwx5ZR8ZT43sBVXabu');
     });
     it('gets address from cache', function() {
       var updateCb = function() {};
       var finishCb = function() {};
       var scanner = new Scanner(client, identity, priv, finishCb, updateCb);
       expect(scanner.pocketCache[3]).toBeUndefined();
       var address = scanner.getAddress(3, 2);
       expect(address).toBe('1czCmufmyZbAg4pFJ1MswjfFcMdxxZ6bA');
       expect(scanner.pocketCache[3]).toBeDefined();
       address = scanner.getAddress(3, 2);
       expect(address).toBe('1czCmufmyZbAg4pFJ1MswjfFcMdxxZ6bA');
     });
     it('scans address', function() {
       var updateCalled = false;
       var updateCb = function() {updateCalled=true};
       var finishCb = function() {};
       var scanner = new Scanner(client, identity, priv, finishCb, updateCb);
       var called = false;
       scanner.scanAddress(3, 2, function() {called=true});
       expect(called).toBe(true);
       expect(updateCalled).toBe(true);
     });
     it('scans', function() {
       var updateCalled = 0;
       var finishCalled = false;
       var updateCb = function() {updateCalled+=1;};
       var finishCb = function() {finishCalled=true;};
       var scanner = new Scanner(client, identity, priv, finishCb, updateCb);
       scanner.setMargins(2, 2);
       scanner.scan();
       expect(updateCalled).toBe(11);
       expect(finishCalled).toBe(true);
       expect(scanner.scanned).toBe(11);
       expect(scanner.used).toEqual([[0,0,0]]);
     });

     it('scans with pocket master', function() {
       var updateCalled = 0;
       var finishCalled = false;
       var updateCb = function() {updateCalled+=1;};
       var finishCb = function() {finishCalled=true;};
       var scanner = new Scanner(client, identity, priv, finishCb, updateCb, true);
       scanner.setMargins(2, 2);
       scanner.scan();
       expect(updateCalled).toBe(16);
       expect(finishCalled).toBe(true);
       expect(scanner.scanned).toBe(16);
       expect(scanner.used).toEqual([[0,0,0]]);
     });
   });

   describe('HD Scanner', function() { 
     it('is created properly', function() {
       var updateCb = function() {};
       var finishCb = function() {};
       var scanner = new Scanner(client, identity, null, finishCb, updateCb);
       expect(scanner.scanned).toBe(0);
       expect(scanner.status).toBe('');
       expect(scanner.used).toEqual([]);
     });
     it('sets margins', function() {
       var updateCb = function() {};
       var finishCb = function() {};
       var scanner = new Scanner(client, identity, null, finishCb, updateCb);
       scanner.setMargins(3, 10);
       expect(scanner.pocketMargin).toBe(6);
       expect(scanner.addressMargin).toBe(10);
       expect(scanner.target).toBe(60);
     });
     it('gets address', function() {
       var updateCb = function() {};
       var finishCb = function() {};
       var scanner = new Scanner(client, identity, null, finishCb, updateCb);
       var address1 = scanner.getAddress(3, 3);
       var address2 = scanner.getAddress(3, 4);
       expect(address1).toBe('1HSa4TdZ2NDoTvDgB9y6xdY475y3n1qj4j');
       expect(address2).toBe('1DC8C5oxnGiYQbjJ7h8kVmpYpCMJxnc5Mx');
     });
     it('gets address from cache', function() {
       var updateCb = function() {};
       var finishCb = function() {};
       var scanner = new Scanner(client, identity, null, finishCb, updateCb);
       expect(scanner.pocketCache[3]).toBeUndefined();
       var address = scanner.getAddress(3, 2);
       expect(address).toBe('1HiMmKbA16tGfoZo6rDg3UTvUJGwqY4ZVu');
       expect(scanner.pocketCache[3]).toBeDefined();
       address = scanner.getAddress(3, 2);
       expect(address).toBe('1HiMmKbA16tGfoZo6rDg3UTvUJGwqY4ZVu');
     });
     it('scans address', function() {
       var updateCalled = false;
       var updateCb = function() {updateCalled=true};
       var finishCb = function() {};
       var scanner = new Scanner(client, identity, null, finishCb, updateCb);
       var called = false;
       scanner.scanAddress(3, 2, function() {called=true});
       expect(called).toBe(true);
       expect(updateCalled).toBe(true);
     });
     it('scans', function() {
       var updateCalled = 0;
       var finishCalled = false;
       var updateCb = function() {updateCalled+=1;};
       var finishCb = function() {finishCalled=true;};
       var scanner = new Scanner(client, identity, null, finishCb, updateCb);
       scanner.setMargins(2, 2);
       scanner.scan();
       expect(updateCalled).toBe(11);
       expect(finishCalled).toBe(true);
       expect(scanner.scanned).toBe(11);
       expect(scanner.used).toEqual([[0,0]]);
     });

     it('scans with pocket master', function() {
       var updateCalled = 0;
       var finishCalled = false;
       var updateCb = function() {updateCalled+=1;};
       var finishCb = function() {finishCalled=true;};
       var scanner = new Scanner(client, identity, null, finishCb, updateCb, true);
       scanner.setMargins(2, 2);
       scanner.scan();
       expect(updateCalled).toBe(16);
       expect(finishCalled).toBe(true);
       expect(scanner.scanned).toBe(16);
       expect(scanner.used).toEqual([[0,0]]);
     });
   });

});
