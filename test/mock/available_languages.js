'use strict';

define(function() {
    var lang = [
        {"name": "English (US)", "code": "en_US"},
        {"name": "Español (España)", "code": "es_ES"}
    ];
    lang.preferedLanguage = function() {
        return 'en_US';
    };
    return lang;
});