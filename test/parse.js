var fs = require('fs');
var subsrt = require('../lib/subsrt.js');
  
exports["Parse"] = function(test) {
  var formats = subsrt.list();
  for (var i = 0; i < formats.length; i++) {
    var ext = formats[i];
    console.log("Parse ." + ext);
    var content = fs.readFileSync('./test/fixtures/sample.' + ext, 'utf8');
    var captions = subsrt.parse(content, { format: ext });
    test.ok(captions.length, "Expected length > 0");
    
    if (fs.existsSync("./test/output")) {
      fs.writeFileSync("./test/output/parse." + ext + ".json", JSON.stringify(captions, " ", 2));
    }
  }
  test.done();
};
