var fs = require('fs');
var subsrt = require('../lib/subsrt.js');

exports["Convert"] = function(test) {
  var extensions = subsrt.list();
  for (var i = 0; i < extensions.length; i++) {
    for (var j = 0; j < extensions.length; j++) {
      var ext1 = extensions[i];
      var ext2 = extensions[j];
      
      console.log("Convert ." + ext1 + " to ." + ext2);
      
      var content1 = fs.readFileSync('./test/fixtures/sample.' + ext1, 'utf8');
      var content2 = subsrt.convert(content1, { from: ext1, to: ext2 });
      
      test.ok(typeof content2 == "string", "Expected a string");
      test.ok(content2.length > 0, "Expected a string with length > 0");
      
      var format = subsrt.detect(content2);
      test.ok(format == ext2, "Expected a '" + ext2 + "' format but got '" + format + "'!");
      
      var captions = subsrt.parse(content2, { format: ext2 });
      test.ok(typeof captions != "undefined", "Expected an object!");
      test.ok(captions.length > 0, "Expected at least one caption!");
      
      if (fs.existsSync("./test/output")) {
        fs.writeFileSync("./test/output/convert." + ext1 + "." + ext2, content2);
      }
    }
  }
  test.done();
};
  