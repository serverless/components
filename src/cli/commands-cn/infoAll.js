'use strict';

const { v4: uuidv4 } = require('uuid');
const { ServerlessSDK } = require('@serverless/platform-client-china');
const { getTemplate, getTemplateDashboardUrl } = require('./utils');
const chalk = require('chalk');
const moment = require('moment');

module.exports = async (config, cli) => {
  const templateYaml = await getTemplate(process.cwd());
  cli.sessionStatus('Initializing', templateYaml.name);

  cli.logLogo();

  const meta = `Action: "info" - Stage: "${templateYaml.stage}" - Org: "${templateYaml.org}" - App: "${templateYaml.app}" - Name: "${templateYaml.name}"`;
  cli.log(meta, 'grey');
  cli.log();

  // initialize SDK
  const sdk = new ServerlessSDK({ context: { traceId: uuidv4() } });

  // don't show the status in debug mode due to formatting issues
  if (!config.debug) {
    cli.sessionStatus('Loading Info', null, 'white');
  }

  const instanceYamls = Object.values(templateYaml).filter(
    (instance) => typeof instance === 'object'
  );

  for (const instanceYaml of instanceYamls) {
    cli.log(instanceYaml.name, 'whiteBold');

    const { instance } = await sdk.getInstance(
      instanceYaml.org,
      instanceYaml.stage,
      instanceYaml.app,
      instanceYaml.name
    );

    if (!instance || !instance.outputs || Object.keys(instance.outputs).length === 0) {
      cli.log(`  ${chalk.grey('Status:')}       ${chalk.red('inactive')}`);
      cli.log();
      continue;
    }

    const lastActionAgo = moment(instance.lastActionAt).fromNow();

    let statusLog;
    if (instance.instanceStatus === 'error') {
      statusLog = chalk.red(instance.instanceStatus);
    } else if (instance.instanceStatus === 'active') {
      statusLog = chalk.green(instance.instanceStatus);
    } else if (instance.instanceStatus === 'inactive') {
      statusLog = chalk.yellow(instance.instanceStatus);
    } else {
      statusLog = instance.instanceStatus;
    }
    cli.log(`  ${chalk.grey('Last Action:')}  ${instance.lastAction} (${lastActionAgo})`);
    cli.log(`  ${chalk.grey('Status:')}       ${statusLog}`);
    cli.log(`  ${chalk.grey('Deployments:')}  ${instance.instanceMetrics.deployments}`);

    // show state only in debug mode
    if (config.debug) {
      cli.log();
      cli.log(`${'State:'}`, 'whiteBold');
      cli.log();
      cli.logOutputs(instance.state);
    }

    const outputs = instance.outputs;

    delete outputs.vendorMessage;

    cli.log(`  ${chalk.grey('Outputs:')}`);
    cli.logOutputs(outputs, 4);

    cli.log();
  }

  cli.log(getTemplateDashboardUrl(templateYaml));

  cli.sessionStop('success', 'Info successfully loaded');
};
