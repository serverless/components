'use strict';

const run = require('./run');
const info = require('./info');
const { init } = require('./init');
const dev = require('./dev');
const registry = require('./registry');
const help = require('./help');
const param = require('./param');
const credentials = require('./credentials');
const log = require('./log');

module.exports = {
  run,
  info,
  init,
  dev,
  registry,
  help,
  param,
  credentials,
  log,
};
