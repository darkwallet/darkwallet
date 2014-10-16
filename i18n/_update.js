var recursive = require('recursive-readdir');
var fs = require('fs');
var beautify = require('js-beautify').js_beautify;

recursive('html', function (err, files) {
  var arr = [];
  var obj = {};
  // Files is an array of filename
  files.forEach(function(file) {
    var data = fs.readFileSync(file, 'utf-8');
    data = data.match(/\{\{'[^']*'\|_/g);
    if (data) {
      arr = arr.concat(data);
    }
  });
  arr.forEach(function(str) {
    str = str.slice(3,str.length-3);
    obj[str] = str;
  });
  console.log(beautify(JSON.stringify(obj)));
});
