'use strict';

const path = require('path');
const { Application } = require(path.join(process.cwd(), 'node_modules/egg'));

Object.defineProperty(Application.prototype, Symbol.for('egg#eggPath'), {
  value: '/opt',
});

const app = new Application({
  mode: 'single',
  env: 'prod',
});

app.binaryTypes = ['*/*'];

module.exports = app;
