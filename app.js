var os = require('os');
var fs = require('fs');
var path = require('path');
var subsrt = require('./lib/subsrt.js');

var config = {
  verbose: process.env.NODE_VERBOSE == "true" || process.env.NODE_VERBOSE == "1"
};

//Command line arguments
var args = process.argv.slice(2);
for (var i = 0; i < args.length; i++) {
  switch (args[i]) {
    case "list":
    case "parse":
    case "build":
    case "detect":
    case "resync":
    case "convert":
      if (config.command) {
        console.error("Cannot run more than one command: " + args[i]);
        process.exit(1);
      }
      config.command = args[i];
      break;
      
    case "--eol":
      config.eol = args[++i];
      if (config.eol) {
        config.eol = config.eol.replace(/\\r/g, "\r").replace(/\\n/g, "\n");
      }
      break;
      
    case "--fps":
      var fps = args[++i];
      if (fps.indexOf("-") > 0) {
        fps = fps.split("-");
        config.fpsFrom = parseFloat(fps[0]);
        config.fpsTo = parseFloat(fps[1]);
      }
      else {
        config.fps = parseFloat(fps);
      }
      break;
      
    case "--offset":
      config.offset = parseInt(args[++i]);
      break;
      
    case "--format":
      config.format = args[++i];
      break;
      
    case "--help":
      help();
      process.exit(0);
      break;
      
    case "--verbose":
      config.verbose = true;
      break;
      
    case "--version":
      console.log(require('./package.json').version);
      process.exit(0);
      break;
      
    default:
      if (!config.src) {
        config.src = args[i];
        continue;
      }
      if (!config.dst) {
        config.dst = args[i];
        continue;
      }
      console.error("Unknown command line argument: " + args[i]);
      process.exit(1);
      break;
  }
}

//Prints help message
function help() {
  console.log("Usage:");
  console.log("  subsrt [command] [options]");
  console.log("");
  console.log("Commands:");
  console.log("  list                   List supported formats");
  console.log("  parse [src] [json]     Parse a subtitle file");
  console.log("  build [json] [dst]     Create a subtitle file from captions");
  console.log("  detect [src]           Detect subtitle file format, if supported");
  console.log("  resync [src] [dst]     Resync FPS or shift time (+/- offset)");
  console.log("  convert [src] [dst]    Converts a subtitle format");
  console.log("");
  console.log("Options:");
  console.log("  --help                 Print this message");
  console.log("  --eol [chars]          End of line chars, e.g. \\r\\n");
  console.log("  --fps [fps]            Frames per second for .sub format");
  console.log("  --offset [time]        Resync time shift offset in ms");
  console.log("  --format [ext]         Subtitle format to convert/build/parse");
  console.log("  --verbose              Enable detailed logging");
  console.log("  --version              Print version number");
  console.log("");
  console.log("Examples:");
  console.log("  subsrt parse sample.sbv");
  console.log("  subsrt parse sample.srt output.json");
  console.log("  subsrt parse sample.sub --fps 30");
  console.log("  subsrt build input.json output.vtt");
  console.log("  subsrt build input.json --format sbv");
  console.log("  subsrt detect unknown.txt");
  console.log("  subsrt convert sample.srt sample.vtt");
  console.log("  subsrt convert --offset -250 sample.srt sample.ssa");
  console.log("  subsrt resync --offset +3000 input.srt output.srt");
  console.log("  subsrt resync --fps 25-30 input.sub output.sub");
}

var commands = {
  list: function() {
    console.log(subsrt.list().join(", "));
  },
  parse: function() {
    var content = fs.readFileSync(config.src, 'utf8');
    
    var options = {
      verbose: config.verbose
    };
    if (config.fps) {
      options.fps = config.fps;
    }
    
    var captions = subsrt.parse(content, options);
    var json = JSON.stringify(captions, " ", 2);
    if (config.dst) {
      fs.writeFileSync(config.dst, json);
    }
    else {
      console.log(json);
    }
  },
  build: function() {
    var json = fs.readFileSync(config.src, 'utf8');
    var captions = JSON.parse(json);
    if (!config.format && config.dst) {
      var ext = path.extname(config.dst);
      config.format = ext.replace(/\./, "").toLowerCase();
    }
    
    var options = {
      verbose: config.verbose,
      format: config.format
    };
    if (config.fps) {
      options.fps = config.fps;
    }
    if (config.eol) {
      options.eol = config.eol;
    }
    
    var content = subsrt.build(captions, options);
    if (config.dst) {
      fs.writeFileSync(config.dst, content);
    }
    else {
      console.log(content);
    }
  },
  detect: function() {
    var content = fs.readFileSync(config.src, 'utf8');
    var format = subsrt.detect(content);
    console.log(format || "unknown");
  },
  resync: function() {
    var options = { };
    if (config.offset) {
      options.offset = config.offset;
    }
    if (config.fpsFrom && config.fpsTo) {
      options.ratio = config.fpsTo / config.fpsFrom;
      options.frame = true;
    }
    if (config.fps) {
      options.fps = config.fps;
    }
    if (config.fpsFrom) {
      options.fps = config.fpsFrom;
      options.frame = true;
    }
    config.resync = options;
    commands.convert();
  },
  convert: function() {
    var content = fs.readFileSync(config.src, 'utf8');
    if (!config.format && config.dst) {
      var ext = path.extname(config.dst);
      config.format = ext.replace(/\./, "").toLowerCase();
    }
    
    var options = {
      verbose: config.verbose,
      format: config.format
    };
    if (config.fps) {
      options.fps = config.fps;
    }
    if (config.eol) {
      options.eol = config.eol;
    }
    if (config.resync) {
      options.resync = config.resync;
    }
    
    var converted = subsrt.convert(content, options);
    if (config.dst) {
      fs.writeFileSync(config.dst, converted);
    }
    else {
      console.log(converted);
    }
  }
};

var func = commands[config.command];
if (typeof func == "function") {
  func();
}
else {
  help();
}