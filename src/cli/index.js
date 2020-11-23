'use strict';

/*
 * Serverless Components: CLI Handler
 */

const path = require('path');
const http = require('http');
const https = require('https');
const minimist = require('minimist');
const dotenv = require('dotenv');
const semver = require('semver');
const chalk = require('chalk');
const HttpsProxyAgent = require('https-proxy-agent');
const CLI = require('./CLI');
const { loadInstanceConfig, fileExistsSync, isProjectPath, isChinaUser } = require('./utils');

module.exports = async () => {
  const args = minimist(process.argv.slice(2));
  const instanceConfig = loadInstanceConfig(process.cwd());
  const stage = args.stage || (instanceConfig && instanceConfig.stage) || 'dev';

  const params = [];
  if (args._[1]) {
    params.push(args._[1]);
  }
  if (args._[2]) {
    params.push(args._[2]);
  }
  if (args._[3]) {
    params.push(args._[3]);
  }
  if (args._[4]) {
    params.push(args._[4]);
  }

  const config = { ...args, params };
  if (config._) {
    delete config._;
  }

  config.platformStage = process.env.SERVERLESS_PLATFORM_STAGE || 'prod';
  config.debug = process.env.SLS_DEBUG || !!args.debug;

  // Add stage environment variable
  if (args.stage && !process.env.SERVERLESS_STAGE) {
    process.env.SERVERLESS_STAGE = args.stage;
  }

  // Initialize CLI utilities
  const cli = new CLI(config);

  /**
   * Load environment variables from .env files, 2 directories up
   * Nearest to current working directory is preferred
   */
  const defaultEnvFilePath = path.join(process.cwd(), '.env');
  const stageEnvFilePath = path.join(process.cwd(), `.env.${stage}`);
  const firstParentDefaultEnvFilePath = path.join(process.cwd(), '..', '.env');
  const firstParentStageEnvFilePath = path.join(process.cwd(), '..', `.env.${stage}`);
  const secondParentDefaultEnvFilePath = path.join(process.cwd(), '../..', '.env');
  const secondParentStageEnvFilePath = path.join(process.cwd(), '../..', `.env.${stage}`);

  if (stage && fileExistsSync(stageEnvFilePath)) {
    dotenv.config({ path: path.resolve(stageEnvFilePath) });
  } else if (fileExistsSync(defaultEnvFilePath)) {
    dotenv.config({ path: path.resolve(defaultEnvFilePath) });
  } else if (fileExistsSync(firstParentStageEnvFilePath)) {
    dotenv.config({ path: path.resolve(firstParentStageEnvFilePath) });
  } else if (fileExistsSync(firstParentDefaultEnvFilePath)) {
    dotenv.config({ path: path.resolve(firstParentDefaultEnvFilePath) });
  } else if (fileExistsSync(secondParentDefaultEnvFilePath)) {
    dotenv.config({ path: path.resolve(secondParentDefaultEnvFilePath) });
  } else if (fileExistsSync(secondParentStageEnvFilePath)) {
    dotenv.config({ path: path.resolve(secondParentStageEnvFilePath) });
  }

  /**
   * Set global proxy agent if it's configured in environment variable
   */
  if (process.env.HTTP_PROXY || process.env.HTTPS_PROXY) {
    if (semver.gte(process.version, 'v11.7.0')) {
      // save default global agent in case we want to restore them
      // and hand proxy handling to other libs
      http.defaultGlobalAgent = http.globalAgent;
      https.defaultGlobalAgent = https.globalAgent;
      http.globalAgent = new HttpsProxyAgent(process.env.HTTP_PROXY || process.env.HTTPS_PROXY);
      https.globalAgent = new HttpsProxyAgent(process.env.HTTPS_PROXY || process.env.HTTP_PROXY);
    } else {
      process.stdout.write(
        `Serverless: ${chalk.yellow(
          'you need to upgrade the NodeJS in order to use http/https proxy.'
        )}\n`
      );
    }
  }

  /**
   * Handle interactive onboarding when using the "serverless" command for China-based users
   */
  if (process.argv.length === 2 && isChinaUser() && !(await isProjectPath(process.cwd()))) {
    // Interactive onboarding
    return require('./interactive-onboarding/cn')(config, cli);
  }

  let commands;
  if (isChinaUser()) {
    commands = require('./commands-cn');
  } else {
    commands = require('./commands');
  }

  let command = args._[0];

  // handle "publish" command.
  if (command === 'publish') {
    command = 'registry';
    config.params.unshift('publish');
  }

  // // handle "unpublish" command.
  if (command === 'unpublish') {
    command = 'registry';
    config.params.unshift('unpublish');
  }
  /**
   * Running "serverless --help" is equivalent to "serverless help"
   */
  if (args.help || args.h || args['help-components']) {
    command = 'help';
  }

  // Handle version command. Log and exit.
  // TODO: Move this to a command file like all others. Don't handle this here.
  const checkingVersion = args._[0] === 'version' || args.version || args.v;
  if (checkingVersion) {
    return cli.logVersion();
  }

  try {
    if (!command) {
      throw new Error(
        'Please enter a valid command. Run "serverless help" to see all available commands.'
      );
    }
    if (commands[command]) {
      await commands[command](config, cli, command);
    } else {
      await commands.run(config, cli, command);
    }
  } catch (error) {
    process.exitCode = 1;

    if (cli.isSessionActive()) {
      cli.sessionStop('error', error);
    } else {
      cli.logError(error);
      cli.log();
    }
  }

  return null;
};
