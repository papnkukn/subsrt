'use strict';

var FORMAT_NAME = "ass";

//Compatible format
var ssa = require('./ssa.js');

module.exports = {
  name: FORMAT_NAME,
  helper: ssa.helper,
  detect: ssa.detect,
  parse: ssa.parse,
  build: ssa.build
};