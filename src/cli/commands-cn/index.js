'use strict';

const run = require('./run');
const info = require('./info');
const { init } = require('./init');
const dev = require('./dev');
const registry = require('./registry');
const help = require('./help');

module.exports = {
  run,
  info,
  init,
  dev,
  registry,
  help,
};
