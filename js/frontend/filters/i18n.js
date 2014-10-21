'use strict';

define(['./module'], function (filters) {

// Filter for presenting a satoshi amount into selected btc unit with unit label
filters.filter('_', ['translateFilter', function(translateFilter) {
  
  var format = function(format, args) {
    return format.replace(/{(\d+)}/g, function(match, number) { 
      return typeof args[number] != 'undefined'
        ? args[number] 
        : match
      ;
    });
  };
  
  return function(input) {
    var args = Array.prototype.slice.call(arguments, 1);
    input = translateFilter(input);
    return format(input, args);
  };
}]);

});
