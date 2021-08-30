/* eslint no-restricted-syntax: 0 */

'use strict';

const { ServerlessSDK, utils: tencentUtils } = require('@serverless/platform-client-china');
const {
  getOutputs,
  getAllComponents,
  setDependencies,
  createGraph,
  executeGraph,
  writeJsonToCredentials,
} = require('../utils');
const {
  writeClientUid,
  login,
  loadInstanceCredentials,
  getTemplate,
  handleDebugLogMessage,
  clientUidDefaultPath,
} = require('./utils');
const { generatePayload, storeLocally, send: sendTelemtry } = require('./telemtry');
const generateNotificationsPayload = require('../notifications/generate-payload');
const { v4: uuidv4 } = require('uuid');
const requestNotification = require('../notifications/request');
const printNotification = require('../notifications/print-notification');

function translateCommand(command) {
  const translateCommandMap = new Map([
    ['deploy', '部署'],
    ['remove', '移除'],
  ]);
  if (translateCommandMap.has(command)) {
    return translateCommandMap.get(command);
  }
  return '执行';
}

module.exports = async (config, cli, command) => {
  cli.sessionStart('正在初始化', { timer: true });

  await login(config);

  if (!config.debug) {
    cli.logLogo();
  } else if (process.env.SERVERLESS_PLATFORM_STAGE === 'dev') {
    cli.log('Running in Platform Dev stage');
  }

  const templateYaml = await getTemplate(process.cwd());

  if (!templateYaml) {
    throw new Error('No components found in sub directories.');
  }

  // Load Instance Credentials
  const credentials = await loadInstanceCredentials(templateYaml.stage);

  cli.sessionStatus('正在初始化', templateYaml.name);

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
      orgName: templateYaml.org,
      traceId: uuidv4(),
    },
  });

  // Prepare Options
  const options = {};
  options.dev = config.dev;

  // Connect to Serverless Platform Events, if in debug mode
  options.debug = config.debug;

  const cliendUidResult = await writeClientUid();
  if (!cliendUidResult[orgUid]) {
    options.client_uid = cliendUidResult.value;
  }

  if (options.debug) {
    await sdk.connect({
      filter: {
        stageName: templateYaml.stage,
        appName: templateYaml.app,
      },
      onEvent: handleDebugLogMessage(cli),
    });
  }

  const deferredNotificationsData =
    command === 'deploy'
      ? requestNotification(
          Object.assign(generateNotificationsPayload(templateYaml), { command: 'deploy' })
        )
      : null;

  if (command === 'remove') {
    cli.sessionStatus('正在删除', null, 'white');
  } else {
    cli.sessionStatus('正在部署', null, 'white');
  }

  const allComponents = await getAllComponents(templateYaml);

  const telemtryData = await generatePayload({
    command,
    userId: orgUid,
    rootConfig: templateYaml,
    configs: Object.values(allComponents),
  });

  try {
    const allComponentsWithDependencies = setDependencies(allComponents);
    const graph = createGraph(allComponentsWithDependencies, command);

    const allComponentsWithOutputs = await executeGraph(
      allComponentsWithDependencies,
      command,
      graph,
      cli,
      sdk,
      credentials,
      options
    );

    // Check for errors
    const succeeded = [];
    const failed = [];
    for (const component in allComponentsWithOutputs) {
      if (Object.prototype.hasOwnProperty.call(allComponentsWithOutputs, component)) {
        const c = allComponentsWithOutputs[component];
        if (c.error) {
          failed.push(c);
        }
        if (c.outputs) {
          succeeded.push(c);
        }
      }
    }

    // Insert appId into client_uid-credentials to avoid repeatly searching database, no matter the status of instance is succ or fail
    if (!cliendUidResult[orgUid] && command === 'deploy') {
      writeJsonToCredentials(clientUidDefaultPath, {
        client_uid: { ...cliendUidResult, [orgUid]: true },
      });
    }
    if (failed.length) {
      cli.sessionStop(
        'error',
        `已成功 ${translateCommand(command)}组件${succeeded.length}个，失败${failed.length}个`
      );
      telemtryData.outcome = 'failure';
      telemtryData.failure_reason = failed.map((f) => f.error.message).join(',');
      await storeLocally(telemtryData);
      if (command === 'deploy') {
        sendTelemtry();
      }
      return null;
    }

    // don't show outputs if removing
    if (command !== 'remove') {
      const outputs = getOutputs(allComponentsWithOutputs);

      // log all outputs at once at the end only on debug mode
      // when not in debug, the graph handles logging outputs
      // of each deployed instance in realtime
      if (options.debug) {
        cli.log();
        cli.logOutputs(outputs);
      }
    }

    cli.sessionStop('success', `已成功${translateCommand(command)}组件${succeeded.length}个`);

    if (deferredNotificationsData) printNotification(cli, await deferredNotificationsData);
    await storeLocally(telemtryData);

    if (command === 'deploy') {
      sendTelemtry();
    }
    sdk.disconnect();
    return null;
  } catch (e) {
    telemtryData.outcome = 'failure';
    telemtryData.failure_reason = e.message;
    await storeLocally(telemtryData);

    if (command === 'deploy') {
      sendTelemtry();
    }
    throw e;
  }
};
