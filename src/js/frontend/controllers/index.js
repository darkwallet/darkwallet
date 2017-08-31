/** attach controllers to this module 
 * if you get 'unknown {x}Provider' errors from angular, be sure they are
 * properly referenced in one of the module dependencies in the array.
 * below, you can see we bring in our services and constants modules 
 * which avails each controller of, for example, the `config` constants object.
 **/
'use strict';

define([
    './addresses',
    './backups',
    './browser',
    './bitid',
    './cashout',
    './contacts',
    './faucet',
    './history',
    './sidebar',
    './navbar',
    './history_rows',
    './identities',
    './latest',
    './lobby',
    './ngmodal',
    './new_fund',
    './new_wallet',
    './overview',
    './pocketaction',
    './pocketcreate',
    './reseed',
    './scanning',
    './send',
    './settings',
    './wallet',
    './calculator',
    './notifications',
    './connection_notify',
    './gui_notify',
    './servers',
    './fund',
    './tools',
    './signing',
    './exporting',
    './rcv_stealth'
], function () {});
