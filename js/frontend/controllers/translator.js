'use strict';

define(['./module', 'available_languages'], function (controllers, AvailableLanguages) {

  // Controller
  controllers.controller('TranslatorCtrl', ['$scope', '$translate', '$translatePartialLoader', '$http', '$timeout', 'notify', '_Filter', function($scope, $translate, $translatePartialLoader, $http, $timeout, notify, _) {
    
    $scope.englishLanguage = false;
    
    $scope.switchLanguage = function() {
        var lang = $scope.settings.language;
        $translate.use($scope.englishLanguage ? lang : 'en_US');
        $scope.englishLanguage = !$scope.englishLanguage;
    };
    
    $scope.updateTranslations = function() {
        if (!$scope.settings.translator) { return; }
        $timeout(function() {
            $translate.use($scope.settings.language);
            $translatePartialLoader.addPart('https://i18n-darkwallet.rhcloud.com');
            $translatePartialLoader.deletePart('../i18n');
            $translate.use($scope.settings.language);
            $translate.refresh();
            notify.note(_('Applying latest {0} translations', $scope.settings.language));
            $scope.englishLanguage = false;
        });
    };
    
    $scope.updateAvailableLanguages = function() {
        if (!$scope.settings.translator) { return; }
        
        $http({
            method: 'GET',
            url: 'https://darkwallet-i18n.herokuapp.com/resource'
        }).success(function(data) {
            data = data.available_languages.filter(function(language) {
                var l = {};
                l[language.name] = language.code;
                return l;
            });
            $scope.languages = data;
        });
    };
}]);
});
