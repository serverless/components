'use strict';

const path = require('path');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

const rootDir = path.join(__dirname, '..');
const apiDir = path.join(rootDir, 'api');
const dashboardDir = path.join(rootDir, 'dashboard');

async function installDependencies(dir) {
  await exec(`cd ${dir} && npm install`);
}

/* eslint-disable  no-console*/
async function bootstrap() {
  try {
    console.log('Start install dependencies...')
    await Promise.all([
      installDependencies(rootDir),
      installDependencies(apiDir),
      installDependencies(dashboardDir),
    ]);
    console.log('All dependencies installed.')
  } catch (e) {
    console.error(e);
  }
}

bootstrap();
