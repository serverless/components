'use strict';

/*
 * CLI: Command: Registry
 */

const { ServerlessSDK } = require('@serverless/platform-client-china');
const { v4: uuidv4 } = require('uuid');
const utils = require('./utils');
const { loadComponentConfig, loadTemplateConfig } = require('../utils');
const { loadServerlessFile } = require('../serverlessFile');

/**
 * Publish a Package(Component or Template) to the Serverless Registry
 * @param {*} config
 * @param {*} cli
 */
const publish = async (config, cli) => {
  // Disable timer
  config.timer = false;

  // Start CLI persistance status
  cli.sessionStart('初始化中...');

  await utils.login(config);

  // We want to check the existence of serverless.template.yml and serverless.component.yml first
  // If both of them did not show up, we will check serverless.yml for backward compatibility
  // Why not check the existence of serverless.yml first? serverless.template.yml and serverless.yml may be in the same folder
  const serverlessTemplateFile = await loadTemplateConfig(process.cwd());
  const serverlessComponentFile = await loadComponentConfig(process.cwd());
  const serverlessFile = await loadServerlessFile(process.cwd());

  if (!serverlessTemplateFile && !serverlessComponentFile && !serverlessFile) {
    throw new Error(
      '发布失败。当前工作目录没有包含 "serverless.template.yml" 或者 "serverless.component.yml"'
    );
  }

  let finalServerlessFile;

  if (serverlessComponentFile) {
    // Publishing a component
    finalServerlessFile = serverlessComponentFile;
    finalServerlessFile.src = serverlessComponentFile.main;
    finalServerlessFile.type = 'component';
  } else {
    // Publishing a template
    finalServerlessFile = serverlessTemplateFile || serverlessFile;
    finalServerlessFile.type = 'template';
    finalServerlessFile.version = '0.0.0';
  }

  // fall back to service name for framework v1
  finalServerlessFile.name = finalServerlessFile.name || finalServerlessFile.service;

  // If "--dev" flag is used, set the version the API expects
  // default version is dev
  if (!finalServerlessFile.version || config.dev) {
    finalServerlessFile.version = 'dev';
  }

  finalServerlessFile.org = finalServerlessFile.org || (await utils.getDefaultOrgName());

  // Presentation
  cli.logRegistryLogo();
  cli.log(
    `发布中 "${finalServerlessFile.name}@${config.dev ? 'dev' : finalServerlessFile.version}"...`,
    'grey'
  );

  const sdk = new ServerlessSDK({ context: { traceId: uuidv4() } });

  // Publish
  cli.sessionStatus('发布中');

  let registryPackage;
  try {
    registryPackage = await sdk.publishPackage(finalServerlessFile);
  } catch (error) {
    if (error.message.includes('409')) {
      error.message = error.message.replace('409 - ', '');
      cli.error(error.message, true);
    } else {
      throw error;
    }
  }

  if (registryPackage && registryPackage.version === '0.0.0-dev') {
    registryPackage.version = 'dev';
  }

  cli.sessionStop(
    'success',
    `发布成功 ${registryPackage.name}${
      registryPackage.type === 'template' ? '' : `@${registryPackage.version}`
    }`
  );
  return null;
};

/**
 * Get a registry package from the Serverless Registry
 * @param {*} config
 * @param {*} cli
 */
const getPackage = async (config, cli) => {
  const packageName = config.params[0];

  // Start CLI persistance status
  cli.sessionStart(`正在获取版本: ${packageName}`);

  const sdk = new ServerlessSDK({ context: { traceId: uuidv4() } });
  const data = await sdk.getPackage(packageName);
  delete data.component;

  if (Object.keys(data).length === 0) {
    throw new Error(`所查询的包 "${packageName}" 不存在.`);
  }

  const devVersion = data.versions.indexOf('0.0.0-dev');
  if (devVersion !== -1) {
    data.versions.splice(devVersion, 1);
  }

  cli.logRegistryLogo();
  cli.log();
  cli.log(`${data.type === 'template' ? 'Template' : 'Component'}: ${packageName}`);
  cli.log(`描述: ${data.description}`);
  if (data.type !== 'template') {
    cli.log(`最新版本: ${data.version}`);
  }
  if (data.author) {
    cli.log(`作者: ${data.author}`);
  }
  if (data.repo) {
    cli.log(`代码地址: ${data.repo}`);
  }
  cli.log();
  if (data.type !== 'template') {
    cli.log('可用版本:');
    cli.log(`${data.versions.join(', ')}`);
  }

  cli.sessionStop('success', `"${packageName}" 的包信息`);
  return null;
};

/**
 * List Featured
 * @param {*} config
 * @param {*} cli
 */
const listFeatured = async (config, cli) => {
  cli.logRegistryLogo();

  const sdk = new ServerlessSDK({ context: { traceId: uuidv4() } });
  const { templates: featuredTemplates } = await sdk.listPackages(null, { isFeatured: true });

  if (featuredTemplates.length > 0) {
    cli.log();
    cli.log('运行 "serverless init <package>" 安装组件或者模版...');
    cli.log();
    for (const featuredTemplate of featuredTemplates) {
      let name = featuredTemplate.name;

      if (featuredTemplate['description-i18n'] && featuredTemplate['description-i18n']['zh-cn']) {
        name = `${name} - ${featuredTemplate['description-i18n']['zh-cn']}`;
      } else if (featuredTemplate.description) {
        name = `${name} - ${featuredTemplate.description}`;
      }

      cli.log(`• ${name}`, 'grey');
    }
  }

  cli.sessionStop('close', '查看更多: https://github.com/serverless-components?q=tencent');
  return null;
};

/**
 * Route Registry Command
 */
module.exports = async (config, cli) => {
  if (!config.params[0]) {
    return await listFeatured(config, cli);
  }
  if (config.params[0] === 'publish') {
    return await publish(config, cli);
  }
  return await getPackage(config, cli);
};
