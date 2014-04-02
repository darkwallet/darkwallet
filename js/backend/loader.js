/**
 * configure RequireJS
 * prefer named modules to long paths
 */
require.config({
  baseUrl: '../js',
  paths: {
    'angular': '../vendors/angular/angular.min',
    'angular-animate': '../vendors/angular-animate/angular-animate.min',
    'angular-route': '../vendors/angular-route/angular-route.min',
    'mm.foundation': '../vendors/angular-foundation/mm-foundation-tpls.min',
    'mnemonicjs': "../vendors/mnemonic.js/mnemonic",
    'ngProgress': "../vendors/ngprogress/build/ngProgress",
    'toaster': "../vendors/AngularJS-Toaster/toaster",
    'identicon': "../vendors/identicon",
    'pnglib': "../vendors/pnglib",
    'qrcodejs': "../vendors/qrcodejs/qrcode",
    'jsqrcode': "../vendors/jsqrcode/jsqrcode",
    
    'bitcoinjs-lib': "../vendors/bitcoinjs-lib/bitcoinjs",
    'sjcl-real': "../vendors/sjcl/sjcl",
    'darkwallet_gateway': "/vendors/darkwallet_gateway/client/gateway",
    
    'domReady': '../vendors/requirejs-domready/domReady',
    'sjcl': 'util/fixes'
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
    'qrcodejs': {
      exports: 'QRCode'
    },
    'jsqrcode': {
      exports: 'qrcode'
    },
    'darkwallet': {
      exports: 'DarkWallet'
    },
    'identicon': {
      deps: ['pnglib'],
      exports: 'Identicon'
    },
    'pnglib': {
      exports: 'PNGlib'
    },
    'sjcl-real': {
      exports: 'sjcl'
    },
    'bitcoinjs-lib': {
      exports: 'Bitcoin'
    },
    'sjcl': {
      deps: ['sjcl-real']
    }
  }
});
