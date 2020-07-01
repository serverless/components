'use strict';

const login = require('./login');
const logout = require('./logout');
const run = require('./run');
const info = require('./info');
const create = require('./create');
const dev = require('./dev');
const registry = require('./registry');
const init = require('./init');

module.exports = {
  login,
  logout,
  run,
  info,
  create,
  dev,
  registry,
  init,
};
