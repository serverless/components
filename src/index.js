'use strict';

const packageJson = require('../package.json');
const { runningComponents } = require('./legacy');
const ServerlessCLI = require('./cli');

const cli = ServerlessCLI; // Backwards compat
const runComponents = ServerlessCLI;
const componentsVersion = packageJson.version;

module.exports = {
  ServerlessCLI,
  cli,
  runComponents,
  runningComponents,
  componentsVersion,
};
