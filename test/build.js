var fs = require('fs');
var subsrt = require('../lib/subsrt.js');

exports["Build"] = function(test) {
  var formats = subsrt.list();
  for (var i = 0; i < formats.length; i++) {
    var ext = formats[i];
    console.log("Build ." + ext);
    var json = fs.readFileSync('./test/fixtures/sample.json', 'utf8');
    var captions = JSON.parse(json);
    var content = subsrt.build(captions, { format: ext });
    test.ok(captions.length, "Expected length > 0");
    if (fs.existsSync("./test/output")) {
      fs.writeFileSync("./test/output/build." + ext, content);
    }
  }
  test.done();
};