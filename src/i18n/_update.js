'use strict';

var recursive = require('recursive-readdir');
var fs = require('fs');
var beautify = require('js-beautify').js_beautify;

recursive('src/html', function (err, htmlFiles) {
  recursive('src/js', function (err, jsFiles) {
    var files = htmlFiles.concat(jsFiles);
    var arr = [];
    var obj = {};
    // Files is an array of filename
    files.forEach(function(file) {
      var data = fs.readFileSync(file, 'utf-8');
      data = data.replace(/\\'/g, "@replace@");
      var inHtml = data.match(/[\{\(]'[^']*'\|_/g);
      var inJs = data.match(/\W_\('[^']*'/g);
      var inErrors = data.match(/\WError\(\'[^'|]*['|]/g)
      if (inHtml) {
        arr = arr.concat(inHtml);
      }
      if (inJs) {
        arr = arr.concat(inJs);
      }
      if (inErrors) {
        arr = arr.concat(inErrors);
      }
    });
    arr.forEach(function(str, key) {
    if (str.indexOf('_(') >= 0) {
        str = str.slice(4,str.length-1)
    } else if (/\WError\(\'/.test(str)) {
        str = str.slice(8,str.length-1);
    } else {
        str = str.slice(2,str.length-3);
    }
    arr[key] = str.replace("@replace@", "'");
    });
    arr.sort();
    arr.forEach(function(str) {
      obj[str] = str;
    });
    console.log(beautify(JSON.stringify(obj)));
  });
});
