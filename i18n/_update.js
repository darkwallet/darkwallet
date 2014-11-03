'use strict';

var recursive = require('recursive-readdir');
var fs = require('fs');
var beautify = require('js-beautify').js_beautify;

recursive('html', function (err, htmlFiles) {
  recursive('js', function (err, jsFiles) {
    var files = htmlFiles.concat(jsFiles);
    var arr = [];
    var obj = {};
    // Files is an array of filename
    files.forEach(function(file) {
      var data = fs.readFileSync(file, 'utf-8');
      data = data.replace(/\\'/g, "@replace@");
      var inHtml = data.match(/[\{\(]'[^']*'\|_/g);
      var inJs = data.match(/\W_\('[^']*'/g);
      var inErrors = data.match(/\WError\(\[?'[^']*'/g)
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
    arr.sort();
    arr.forEach(function(str) {
    if (str.indexOf('_(') >= 0) {
        str = str.slice(4,str.length-1)
    } else if (/\WError\(\[?'/.test(str)) {
        str = str.slice(0,str.length-1);
        str = str.replace(/^\WError\(\[?'/, '');
    } else {
        str = str.slice(2,str.length-3);
    }
    str = str.replace("@replace@", "'");
      obj[str] = str;
    });
    console.log(beautify(JSON.stringify(obj)));
  });
});
