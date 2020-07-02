'use strict';

const utils = require('./cli/utils');
const minimist = require('minimist');
const {
  utils: { isChinaUser },
} = require('@serverless/platform-client-china');

// These keywords should route to components CLI, not sls cli.
const componentKeywords = new Set(['registry', 'init', 'publish']);

const runningComponents = () => {
  const args = minimist(process.argv.slice(2));

  const isRunningHelpOrVersion =
    process.argv[2] === 'version' ||
    process.argv[2] === 'help' ||
    args.v ||
    args.version ||
    args.h ||
    args.help;

  // don't load components CLI if running version or help
  if (isRunningHelpOrVersion) {
    return false;
  }

  let componentConfig;
  let instanceConfig;

  // load components if user runs a keyword command, or "sls --all" or "sls --target" (that last one for china)
  if (
    componentKeywords.has(process.argv[2]) ||
    // only allow deploy & remove commands for nested templates
    // to save up on extensive FS operations for all the other possible framework v1 commands
    ((process.argv[2] === 'deploy' || process.argv[2] === 'remove') &&
      utils.runningTemplate(process.cwd())) ||
    args.target
  ) {
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
