'use strict';

const login = require('./login');
const logout = require('./logout');
const run = require('./run');
const info = require('./info');
const dev = require('./dev');
const registry = require('./registry');
const init = require('./init');
const help = require('./help');

module.exports = {
  login,
  logout,
  run,
  info,
  dev,
  registry,
  init,
  help,
};
