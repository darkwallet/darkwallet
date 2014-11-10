'use strict';

define(function() {
    var lang = [
        {"name": "English (US)", "code": "en_US"},
        {"name": "Español (España)", "code": "es_ES"},
        {"name": "Français", "code": "fr"},
        {"name": "Nederlands", "code": "nl"},
        {"name": "Català", "code": "ca"},
        {"name": "Português (Brasil)", "code": "pt_BR"},
        {"name": "Norsk", "code": "no"},
        {"name": "Norsk bokmål", "code": "nb"},
        {"name": "Português", "code": "pt_PT"},
        {"name": "Deutsch", "code": "de"},
        {"name": "Italiano", "code": "it_IT"},
        {"name": "Magyar", "code": "hu"},
        {"name": "Slovenčina", "code": "sk"},
        {"name": "Čeština", "code": "cs"},
        {"name": "Română", "code": "ro"},
        {"name": "Nederlands (België)", "code": "nl_BE"},
        {"name": "日本語", "code": "ja"},
        {"name": "English (UK)", "code": "en_GB"},
        {"name": "English (Belgium)", "code": "en_BE"},
        {"name": "Svenska", "code": "sv"},
        {"name": "עִבְרִית", "code": "he"},
        {"name": "Esperanto", "code": "eo"},
        {"name": "Dansk", "code": "da"},
        {"name": "ελληνικά", "code": "el"},
        {"name": "Język polski", "code": "pl"},
        {"name": "Türkçe", "code": "tr"}
    ];
    
    var fallbacks = {
        "en": "en_US",
        "es": "es_ES",
        "it": "it_IT",
        "nl": "nl_BE",
        "pt": "pt_PT"
    };
    
    Object.defineProperty(lang, 'preferedLanguage', {
        value: function(preferedLanguages) {
            preferedLanguages = preferedLanguages || navigator.languages;
            preferedLanguages = preferedLanguages.join('|').replace(/-/g, '_').split('|');
            
            var availableLanguages = lang.map(function(l) {
                return l.code;
            });
            for (var key in fallbacks) {
                availableLanguages.push(key);
            };
            
            // Intersection between available and prefered languages
            var intersection = preferedLanguages.map(function(i) {
                return availableLanguages.indexOf(i) >= 0 ? fallbacks[i] || i : null;
            });
            // Suppress null values in array
            intersection = intersection.filter(function(i) {
                return i;
            });
            
            return intersection[0];
        }
    });
    return lang;
});
