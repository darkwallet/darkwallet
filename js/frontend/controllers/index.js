/** attach controllers to this module 
 * if you get 'unknown {x}Provider' errors from angular, be sure they are
 * properly referenced in one of the module dependencies in the array.
 * below, you can see we bring in our services and constants modules 
 * which avails each controller of, for example, the `config` constants object.
 **/
'use strict';

define([
    './contacts',
    './dashboard',
    './history',
    './identities',
    './lobby',
    './new_fund',
    './new_wallet',
    './pocketaction',
    './pocketcreate',
    './send',
    './settings',
    './wallet',
    './calculator',
    './notifications',
    './servers',
    './fund',
    './tabs',
    './tools',
    './signing',
    './rcv_stealth'
], function () {});
