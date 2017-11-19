var fs = require('fs');
var subsrt = require('../lib/subsrt.js');

exports["Resync +3000 ms"] = function(test) {
  var srt = fs.readFileSync('./test/fixtures/sample.srt', 'utf8');
  var captions = subsrt.parse(srt);
  var resynced = subsrt.resync(captions, +3000);
  
  if (fs.existsSync("./test/output")) {
    fs.writeFileSync("./test/output/resync-add-3000.json", JSON.stringify(resynced, " ", 2));
  }
  
  test.ok(typeof resynced == "object", "Expected an object");
  test.ok(resynced.length > 0, "Expected array length > 0");
  test.ok(resynced.length == captions.length, "Expected array of length == " + captions.length);
  
  test.ok(resynced[0].start !== captions[0].start, "Expected start frame value shift!");
  test.ok(resynced[0].end !== captions[0].end, "Expected end frame value shift!");
  
  test.done();
};

exports["Resync -250 ms"] = function(test) {
  var sbv = fs.readFileSync('./test/fixtures/sample.sbv', 'utf8');
  var captions = subsrt.parse(sbv);
  var resynced = subsrt.resync(captions, -250);
  
  if (fs.existsSync("./test/output")) {
    fs.writeFileSync("./test/output/resync-sub-250.json", JSON.stringify(resynced, " ", 2));
  }
  
  test.ok(typeof resynced == "object", "Expected an object");
  test.ok(resynced.length > 0, "Expected array length > 0");
  test.ok(resynced.length == captions.length, "Expected array of length == " + captions.length);
  
  test.ok(resynced[3].start !== captions[3].start, "Expected start frame value shift!");
  test.ok(resynced[3].end !== captions[3].end, "Expected end frame value shift!");
  
  test.done();
};

exports["Resync 25 to 30 FPS"] = function(test) {
  var sub = fs.readFileSync('./test/fixtures/sample.sub', 'utf8');
  var captions = subsrt.parse(sub, { fps: 25 });
  var resynced = subsrt.resync(captions, { ratio: 30 / 25, frame: true });
  
  if (fs.existsSync("./test/output")) {
    fs.writeFileSync("./test/output/resync-fps-30.json", JSON.stringify(resynced, " ", 2));
  }
  
  test.ok(typeof resynced == "object", "Expected an object");
  test.ok(resynced.length > 0, "Expected array length > 0");
  test.ok(resynced.length == captions.length, "Expected array of length == " + captions.length);
  
  test.ok(resynced[3].frame.start !== captions[3].frame.start, "Expected start frame value shift!");
  test.ok(resynced[3].frame.end !== captions[3].frame.end, "Expected end frame value shift!");
  test.ok(resynced[3].frame.count > captions[3].frame.count, "Expected increased frame count number!");
  
  test.done();
};

exports["Resync with non-linear function"] = function(test) {
  var vtt = fs.readFileSync('./test/fixtures/sample.vtt', 'utf8');
  var captions = subsrt.parse(vtt);
  var resynced = subsrt.resync(captions, function(a) {
    return [
      a[0] + 0, //Keep the start time
      a[1] + 500 //Extend each end time by 500 ms
    ];
  });
  
  if (fs.existsSync("./test/output")) {
    fs.writeFileSync("./test/output/resync-extend.json", JSON.stringify(resynced, " ", 2));
  }
  
  test.ok(typeof resynced == "object", "Expected an object");
  test.ok(resynced.length > 0, "Expected array length > 0");
  test.ok(resynced.length == captions.length, "Expected array of length == " + captions.length);
  
  test.ok(resynced[3].start == captions[3].start + 0, "Expected start frame value shift!");
  test.ok(resynced[3].end == captions[3].end + 500, "Expected end frame value shift!");
  
  test.done();
};