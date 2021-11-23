'use strict';

/**
 * This logic intercepts ALL Serverless Framework commands, before the V.1 core starts.
 * This checks to see if the Components CLI should take over.
 */

const minimist = require('minimist');
const {
  runningTemplate,
  legacyLoadComponentConfig,
  legacyLoadInstanceConfig,
  isChinaUser,
  hasServerlessConfigFile,
} = require('./cli/utils');

// These keywords are intercepted by the Serverless Components CLI
const componentKeywords = new Set(['registry', 'init', 'publish']);
// These keywords are allowed for nested templates
const nestedTemplateKeywords = new Set([
  'deploy',
  'remove',
  'info',
  'help',
  '--help',
  'dev',
  'logs',
  'invoke',
  'credentials',
]);

// WARNING: Starting with serverless v2.65.0 release, below logic is ineffective
//          as it was integrated into serverless respository at:
//          https://github.com/serverless/serverless/blob/master/lib/cli/triage.js
const runningComponents = () => {
  const args = minimist(process.argv.slice(2));

  let componentConfig;
  let instanceConfig;

  // load components if user runs a keyword command, or "sls --all" or "sls --target" (that last one for china)
  if (
    componentKeywords.has(process.argv[2]) ||
    // run sls help or sls --help inside a template, will get help information from components.
    (nestedTemplateKeywords.has(process.argv[2]) && runningTemplate(process.cwd())) ||
    args.target ||
    args['help-components'] // if user runs "serverless --help-components" in ANY context, show components help
  ) {
    return true;
  }

  // Chinese users running "serverless deploy" in a project without a serverless config file
  if (isChinaUser() && process.argv[2] === 'deploy' && !hasServerlessConfigFile(process.cwd())) {
    return true;
  }

  try {
    componentConfig = legacyLoadComponentConfig(process.cwd());
  } catch (e) {
    // ignore
  }
  try {
    instanceConfig = legacyLoadInstanceConfig(process.cwd());
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
