'use strict';

const utils = require('./cli/utils');
const minimist = require('minimist');
const {
  utils: { isChinaUser },
} = require('@serverless/platform-client-china');

const runningComponents = () => {
  const args = minimist(process.argv.slice(2));

  let componentConfig;
  let instanceConfig;

  // load components if trying to login inside a template directory
  if (utils.runningTemplate(process.cwd()) && process.argv[2] === 'login') {
    return true;
  }

  // load components if user runs "sls registry" or "sls --all" or "sls --target" (that last one for china)
  if (process.argv[2] === 'registry' || args.all || args.target) {
    return true;
  }

  try {
    componentConfig = utils.legacyLoadComponentConfig(process.cwd());
  } catch (e) {
    // ignore
  }
  try {
    instanceConfig = utils.legacyLoadInstanceConfig(process.cwd());
  } catch (e) {
    // ignore
  }

  if (!componentConfig && !instanceConfig) {
    // When no in service context and plain `serverless` command, return true when user in China
    // It's to enable interactive CLI components onboarding for Chinese users
    return process.argv.length === 2 && isChinaUser();
  }

  if (instanceConfig && !instanceConfig.component) {
    return false;
  }

  return true;
};

module.exports = { runningComponents };
