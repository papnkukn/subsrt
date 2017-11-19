var fs = require('fs');
var subsrt = require('../lib/subsrt.js');

exports["Time Conversion"] = function(test) {
  var formats = subsrt.list();
  var fixtures = [ 0, 90, 1000, 60000, 3600000, 7236250 ];
  for (var i = 0; i < formats.length; i++) {
    var ext = formats[i];
    console.log("Time ." + ext);
    var handler = subsrt.format[ext];
    if (handler.helper) {
      var toMilliseconds = handler.helper.toMilliseconds;
      var toTimeString = handler.helper.toTimeString;
      if (typeof toMilliseconds == "function" && typeof toTimeString == "function") {
        for (var f = 0; f < fixtures.length; f++) {
          var value = fixtures[f];
          var s = toTimeString(value);
          var t = toMilliseconds(s);
          test.ok(t == value, "Expected '" + value + "' but got '" + t + "' for '" + s + "'");
        }
      }
    }
  }
  test.done();
};