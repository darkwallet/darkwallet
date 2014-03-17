/**
 * configure RequireJS
 * prefer named modules to long paths
 */
require.config({
  baseUrl: '/js',
  paths: {
    'angular': '../vendors/angular/angular.min',
    'angular-animate': '../vendors/angular-animate/angular-animate.min',
    'angular-route': '../vendors/angular-route/angular-route.min',
    'mm.foundation': '../vendors/angular-foundation/mm-foundation-tpls.min',
    'mnemonicjs': "../vendors/mnemonic.js/mnemonic",
    'ngProgress': "../vendors/ngprogress/build/ngProgress",
    'toaster': "../vendors/AngularJS-Toaster/toaster",
    'identicon': "../vendors/identicon/identicon",
    
    'bitcoinjs-lib': "../vendors/bitcoinjs-lib/bitcoinjs",
    'sjcl': "../vendors/sjcl/sjcl",
    'darkwallet_gateway': "/vendors/darkwallet_gateway/client/gateway",
    
    'domReady': '../vendors/requirejs-domready/domReady'
  },
  
  /**
   * for libs that either do not support AMD out of the box
   */
  shim: {
    'angular': {
      exports: 'angular'
    },
    'angular-animate': {
      deps: ['angular']
    },
    'angular-route': {
      deps: ['angular']
    },
    'mm.foundation': {
      deps: ['angular']
    },
    'ngProgress': {
      deps: ['angular']
    },
    'toaster': {
      deps: ['angular']
    },
    'darkwallet': {
      exports: 'DarkWallet'
    },
    'identicon': {
      exports: 'Identicon'
    },
    'sjcl': {
      exports: 'sjcl'
    },
    'bitcoinjs-lib': {
      exports: 'Bitcoin'
    }
  },
  deps: ['bootstrap']
});
