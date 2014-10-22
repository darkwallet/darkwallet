'use strict';

define(['./module'], function (filters) {

// Filter for presenting a satoshi amount into selected btc unit with unit label
filters.filter('_', ['translateFilter', '$sce', function(translateFilter, $sce) {
  
  var format = function(format, args) {
    var string = format.replace(/{(\d+)}/g, function(match, number) { 
      return typeof args[number] != 'undefined'
        ? args[number] 
        : match
      ;
    });
    string = string.replace(/\*\*(.+)\*\*/g, '<strong>$1</strong>');
    string = string.replace(/\*(.+)\*/g, '<em>$1</em>');
    return $sce.trustAsHtml(string);
  };
  
  return function(input) {
    var args = Array.prototype.slice.call(arguments, 1);
    input = translateFilter(input);
    return format(input, args);
  };
}]);

});
