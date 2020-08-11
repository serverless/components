'use strict';

/*
 * CLI: Command: Help
 */

const chalk = require('chalk');
const { version } = require('../../../package.json');

const title = chalk.underline.bold;
const command = chalk.dim.bold;

module.exports = async (config, cli) => {
  cli.logLogo();

  cli.log(
    `
${command(
  'serverless init {name}'
)}      Initializes the specified package name or token in the current working directory
${command('  --dir, -d')}                 Specify destination directory

${command(
  'serverless {command}'
)}        Runs the specified component command (deploy, remove...etc)
${command('  --debug')}                   logs the running low-level debug statements
${command('  --stage {stage}')}           Overwrites the stage set in serverless.yml
${command('  --app {app}')}               Overwrites the app set in serverless.yml
${command('  --org {org}')}               Overwrites the org set in serverless.yml

${command(
  'serverless dev'
)}              Watches, auto deploys and shows realtime logs of your deployed app
${command('  --debug')}                   logs low-level debug statements during deployment

${command('serverless info')}             Shows essential information about your deployed app
${command(
  '  --debug'
)}                   Adds additional component state data for debugging purposes

${command(
  'serverless publish'
)}          Publishes the package in the current working directory to the Serverless Registry
${command('  --dev')}                     Overwrites the version property and set it to dev

${command('serverless registry')}         Lists featured packages in the Serverless Registry

${command(
  'serverless registry {name}'
)}  Fetches the given package name data from the Serverless Registry

${command('serverless login')}            Logs into the Serverless Dashboard via the browser

${command('serverless logout')}           Logs out the current user from the Serverless Dashboard

${title('Version:')}          v${version}
${title('Documentation:')}    https://github.com/serverless/components
  `
  );
};
