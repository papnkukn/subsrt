var fs = require('fs');
var subsrt = require('../lib/subsrt.js');

exports["Detect"] = function(test) {
  var formats = subsrt.list();
  for (var i = 0; i < formats.length; i++) {
    var ext = formats[i];
    console.log("Detect ." + ext);
    var content = fs.readFileSync('./test/fixtures/sample.' + ext, 'utf8');
    
    var expected = ext;
    var actual = subsrt.detect(content);
    
    test.ok(actual == expected, "Expected '" + expected + "' but got '" + actual + "'!");
  }
  test.done();
};
