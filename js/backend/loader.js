/**
 * configure RequireJS
 * prefer named modules to long paths
 */
'use strict';

require.config({
  baseUrl: '../js',
  paths: {
    'angular': '../vendors/angular/angular.min',
    'angular-animate': '../vendors/angular-animate/angular-animate.min',
    'angular-route': '../vendors/angular-route/angular-route.min',
    'mm.foundation': '../vendors/angular-foundation/mm-foundation-tpls.min',
    'angular-xeditable': '../vendors/angular-xeditable/dist/js/xeditable.min',
    'angular-translate': '../vendors/angular-translate/angular-translate.min',
    'angular-translate-loader-static-file': '../vendors/angular-translate-loader-static-files/angular-translate-loader-static-files.min',
    'moment': '../vendors/moment/min/moment-with-langs.min',
    'angular-moment': '../vendors/angular-moment/angular-moment.min',
    'mnemonicjs': "../vendors/mnemonic.js/mnemonic",
    'ngProgress': "../vendors/ngprogress/build/ngProgress",
    'toaster': "../vendors/AngularJS-Toaster/toaster",
    'crypto-js': "../vendors/crypto-js/cryptojs",
    'identicon': "../vendors/identicon/identicon",
    'pnglib': "../vendors/identicon/pnglib",
    'qrcodejs': "../vendors/qrcodejs/qrcode",
    'jsqrcode': "../vendors/jsqrcode/jsqrcode",
    'async': "../vendors/async/lib/async",
    'convert': "util/convert",
    'bitcoinjs-lib': "../vendors/wrappers/bitcoinjs",
    'big': "../vendors/big.js/big.min",

    'bitcoinjs-lib-real': "../vendors/bitcoinjs-lib/bitcoinjs",
    'sjcl-real': "../vendors/sjcl/sjcl",
    'darkwallet_gateway': "../vendors/darkwallet_gateway/client/gateway",
    
    'domReady': '../vendors/requirejs-domready/domReady',
    'sjcl': 'util/fixes',
    
    'available_languages': '../i18n/_index'
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
    'angular-xeditable': {
      deps: ['angular']
    },
    'angular-translate': {
      deps: ['angular']
    },
    'angular-translate-loader-static-file': {
      deps: ['angular', 'angular-translate']
    },
    'ngProgress': {
      deps: ['angular']
    },
    'toaster': {
      deps: ['angular']
    },
    'angular-moment': {
      deps: ['moment', 'angular']
    },
    'qrcodejs': {
      exports: 'QRCode'
    },
    'crypto-js': {
      exports: 'CryptoJS'
    },
    'convert': {
      exports: 'Convert'
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
    'sjcl': {
      deps: ['sjcl-real']
    },
    'bitcoinjs-lib-real': {
      exports: 'Bitcoin'
    },
    'bitcoinjs-lib': {
      deps: ['bitcoinjs-lib-real', 'convert'],
      exports: 'Bitcoin'
    }
  }
});
