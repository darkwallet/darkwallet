'use strict';

define(['./module'], function (filters) {

// Filter for presenting a satoshi amount into selected btc unit with unit label
filters.filter('_', ['translateFilter', '$translate', '$sce', function(translateFilter, $translate, $sce) {
  
  var format = function(format, args) {
    var string = format.replace(/{(\d+)}/g, function(match, number) { 
      return typeof args[number] != 'undefined'
        ? args[number] 
        : match
      ;
    });
    string = string.replace(/\*\*(.+)\*\*/g, '<strong>$1</strong>');
    string = string.replace(/\*(.+)\*/g, '<em>$1</em>');
    string = string.replace(/\{[\w ]+\}/g, '');
    return $sce.trustAsHtml(string);
  };
  
  return function(input) {
    if (input === undefined) {
      return $translate.use().replace('_', '-');
    }
    var args = Array.prototype.slice.call(arguments, 1);
    input = translateFilter(input);
    return format(input, args);
  };
}]);

filters.filter('pocket', ['_Filter', function(_) {
    return function(input) {
        // _('spending'), _('business'), _('savings')
        if(['spending', 'business', 'savings'].indexOf(input) >= 0) {
            input = _(input);
        }
        return input;
    };
}]);

});
