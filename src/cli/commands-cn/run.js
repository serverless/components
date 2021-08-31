'use strict';

/*
 * CLI: Command: RUN
 */

const path = require('path');
const fs = require('fs');
const {
  runningTemplate,
  loadInstanceConfig,
  fileExists,
  checkTemplateAppAndStage,
  writeJsonToCredentials,
} = require('../utils');
const { ServerlessSDK, utils: tencentUtils } = require('@serverless/platform-client-china');
const { v4: uuidv4 } = require('uuid');
const { generatePayload, storeLocally, send: sendTelemtry } = require('./telemtry');
const utils = require('./utils');
const runAll = require('./runAll');
const chalk = require('chalk');
const generateNotificationsPayload = require('../notifications/generate-payload');
const requestNotification = require('../notifications/request');
const printNotification = require('../notifications/print-notification');
const { version } = require('../../../package.json');
const { getServerlessFilePath } = require('../serverlessFile');
const componentsVersion = require('../../../package.json').version;

module.exports = async (config, cli, command) => {
  let instanceDir = process.cwd();
  if (config.target) {
    instanceDir = path.join(instanceDir, config.target);
  }

  if (!config.target && runningTemplate(instanceDir) && checkTemplateAppAndStage(instanceDir)) {
    return runAll(config, cli, command);
  }

  let telemtryData = await generatePayload({ command });
  try {
    const hasPackageJson = await fileExists(path.join(process.cwd(), 'package.json'));

    if (
      command === 'deploy' &&
      !getServerlessFilePath(process.cwd()) &&
      hasPackageJson &&
      !config.target
    ) {
      const generatedYML = await utils.generateYMLForNodejsProject(cli);
      await fs.promises.writeFile(path.join(process.cwd(), 'serverless.yml'), generatedYML, 'utf8');
      loadInstanceConfig.clear();
      cli.log('自动生成 serverless.yml 成功，即将部署');
    }

    // Start CLI persistance status
    cli.sessionStart('正在初始化', { timer: true });

    await utils.checkBasicConfigValidation(instanceDir);

    await utils.login(config);

    // Load YAML
    const instanceYaml = await utils.loadInstanceConfig(instanceDir, command);

    // Presentation
    const meta = `Action: "${command}" - Stage: "${instanceYaml.stage}" - App: "${instanceYaml.app}" - Name: "${instanceYaml.name}"`;
    if (!config.debug) {
      cli.logLogo();
      cli.log(meta, 'grey');
    } else {
      cli.log(meta);
    }

    cli.sessionStatus('正在初始化', instanceYaml.name);

    // Load Instance Credentials
    const instanceCredentials = await utils.loadInstanceCredentials(instanceYaml.stage);

    // initialize SDK
    const orgUid = await tencentUtils.getOrgId();
    const sdk = new ServerlessSDK({
      accessKey: tencentUtils.buildTempAccessKeyForTencent({
        SecretId: process.env.TENCENT_SECRET_ID,
        SecretKey: process.env.TENCENT_SECRET_KEY,
        Token: process.env.TENCENT_TOKEN,
      }),
      context: {
        orgUid,
        orgName: instanceYaml.org,
        traceId: uuidv4(),
      },
      agent: `ComponentsCLI_${version}`,
    });

    telemtryData = await generatePayload({ command, rootConfig: instanceYaml, userId: orgUid });

    // if the command is not deploy and remove, it's a custom command, we should change the event to components.custom.xxx
    if (command !== 'deploy' && command !== 'remove') {
      telemtryData.event = `components.custom.${command}`;
    }

    // Prepare Options
    const options = {};
    options.debug = config.debug;
    options.dev = config.dev;
    options.force = config.force;
    options.noValidation = config.noValidation;
    options.noCache = config.noCache;
    options.componentsVersion = componentsVersion;

    const cliendUidResult = await utils.writeClientUid();
    if (!cliendUidResult[orgUid]) {
      options.client_uid = cliendUidResult.value;
    }

    // Connect to Serverless Platform Events, if in debug mode
    if (options.debug) {
      await sdk.connect({
        filter: {
          stageName: instanceYaml.stage,
          appName: instanceYaml.app,
          instanceName: instanceYaml.name,
        },
        onEvent: utils.handleDebugLogMessage(cli),
      });
    }

    let deferredNotificationsData;
    if (command === 'deploy') {
      deferredNotificationsData = requestNotification(
        Object.assign(generateNotificationsPayload(instanceYaml), { command: 'deploy' })
      );

      // Warn about dev agent
      if (options.dev) {
        cli.log();
        cli.log(
          '"--dev" option detected.  Dev Agent will be added to your code.  Do not deploy this in your production stage.',
          'grey'
        );
      }

      // run deploy
      cli.sessionStatus('', null, 'white');
      options.statusReceiver = (statusMsg) => {
        if (statusMsg) {
          cli.sessionStatus(statusMsg, null, 'white');
        } else {
          cli.sessionStatus('部署中', null, 'white');
        }
      };
      const instance = await sdk.deploy(instanceYaml, instanceCredentials, options);
      const vendorMessage = instance.outputs.vendorMessage;
      delete instance.outputs.vendorMessage;
      cli.log();
      if (instance.typeErrors) {
        cli.logTypeError(instance.typeErrors);
        cli.log();
      }
      cli.logOutputs(instance.outputs);
      cli.log();
      cli.log(`${chalk.grey('应用控制台:')} ${utils.getInstanceDashboardUrl(instanceYaml)}`);
      if (vendorMessage) {
        cli.log();
        cli.log(`${chalk.green(vendorMessage)}`);
      }

      // Insert appId into client_uid-credentials to avoid repeatly searching database, no matter the status of instance is succ or fail
      if (!cliendUidResult[orgUid]) {
        writeJsonToCredentials(utils.clientUidDefaultPath, {
          client_uid: { ...cliendUidResult, [orgUid]: true },
        });
      }
      if (instance.instanceStatus === 'error') {
        telemtryData.outcome = 'failure';
        telemtryData.failure_reason = instance.deploymentError;
      }
    } else if (command === 'remove') {
      // run remove
      cli.sessionStatus('删除中', null, 'white');
      await sdk.remove(instanceYaml, instanceCredentials, options);
    } else if (command === 'bind' && config.params[0] === 'role') {
      await sdk.bindRole(instanceCredentials);
      cli.log('已成功开通 Serverless 相关权限');
    } else if (command === 'login') {
      // we have do login upside, so if command is login, do nothing here
      // no op
    } else {
      // run a custom method synchronously to receive outputs directly
      options.sync = true;

      // run a custom method
      cli.sessionStatus('正在运行', null, 'white');
      // We need to convert xx-yy-zz into xx_yy_zz, due to we can not use a 'xx-yy` as the name of function in nodejs
      command = command.replace(/-/g, '_');
      const instance = await sdk.run(command, instanceYaml, instanceCredentials, options);

      cli.log();
      cli.logOutputs(instance.outputs);
      if (instance.actionStatus === 'error') {
        telemtryData.outcome = 'failure';
        telemtryData.failure_reason = instance.actionError;
      }
    }
    cli.sessionStop('success', '执行成功');

    await storeLocally(telemtryData);
    if (deferredNotificationsData) printNotification(cli, await deferredNotificationsData);
    // we will send all telemtry data into metrics server while deploying
    if (command === 'deploy') {
      await sendTelemtry();
    }

    sdk.disconnect();
    return null;
  } catch (e) {
    telemtryData.outcome = 'failure';
    telemtryData.failure_reason = e.message;
    await storeLocally(telemtryData);

    if (command === 'deploy') {
      await sendTelemtry();
    }
    throw e;
  }
};
