'use strict';

const path = require('path');
const chalk = require('chalk');
const inquirer = require('@serverless/utils/inquirer');
const confirm = require('@serverless/utils/inquirer/confirm');
const { ServerlessSDK } = require('@serverless/platform-client-china');
const { v4: uuidv4 } = require('uuid');
const { isProjectPath } = require('../utils');
const { initTemplateFromCli } = require('../commands-cn/init');
const { generatePayload, storeLocally } = require('../commands-cn/telemtry');

const isValidProjectName = RegExp.prototype.test.bind(/^[a-zA-Z][a-zA-Z0-9-]{0,100}$/);

// Add search for user to choice different project templates
inquirer.registerPrompt('autocomplete', require('inquirer-autocomplete-prompt'));

const projectTypeChoice = async (choices) =>
  (
    await inquirer.prompt({
      // EN: What do you want to make?
      message: '请选择你希望创建的 Serverless 应用',
      type: 'autocomplete',
      name: 'projectType',
      emptyText: '无结果',
      searchText: '查询中',
      source: async (_, input) => {
        if (input) {
          return choices.filter(
            (choice) =>
              choice.name.toLowerCase().includes(input.toLowerCase()) ||
              choice.keywords.toLowerCase().includes(input.toLowerCase())
          );
        }
        return choices;
      },
    })
  ).projectType;

const getScfRuntimeTypeChoice = async (choices) =>
  await inquirer.prompt({
    // EN: please choice runtime
    message: '请选择应用的运行时',
    type: 'list',
    name: 'scfRuntimeType',
    choices,
  });

const getMultiScfRuntimeTypeChoice = async (choices) =>
  await inquirer.prompt({
    // EN: please choice runtime
    message: '请选择应用的运行时',
    type: 'list',
    name: 'multiScfRuntimeType',
    choices,
  });

const projectNameInput = async (workingDir) =>
  (
    await inquirer.prompt({
      // EN: What do you want to call this project?
      message: '请输入项目名称',
      type: 'input',
      name: 'projectName',
      default: 'demo',
      validate: async (input) => {
        input = input.trim();
        if (!isValidProjectName(input)) {
          return (
            // EN: Project name is not valid:
            '项目名称校验失败:\n' +
            // EN: - It should only contain alphanumeric and hyphens
            '   项目名称只能包含字母和连字符；\n' +
            // EN: - It should start with an alphabetic character
            '   并且需要以字母开头；\n' +
            // EN: - Shouldn't exceed 128 characters
            '   项目名称不超过 128 个字符。'
          );
        }
        const projectPath = path.join(workingDir, input);
        return (await isProjectPath(projectPath))
          ? // EN: Serverless project already found at ${input} directory
            `您的 ${input} 目录中已经存在 Serverless 项目`
          : true;
      },
    })
  ).projectName.trim();

const getTemplatesFromRegistry = async (sdk) => {
  try {
    const { templates = [] } = await sdk.listPackages(null, { isFeatured: true });

    // Not displaying the scf related templates in the first step
    const templatesChoices = templates
      .filter(
        (item) =>
          (!item.name.startsWith('scf-') || item.name === 'scf-starter') &&
          (!item.name.startsWith('multi-scf-') || item.name === 'multi-scf-starter')
      )
      .map((item) => {
        let name = item.name;

        if (item['description-i18n'] && item['description-i18n']['zh-cn']) {
          name = `${name} - ${item['description-i18n']['zh-cn']}`;
        } else if (item.description) {
          name = `${name} - ${item.description}`;
        }

        return {
          name,
          keywords: item.keywords || '',
          value: { id: item.componentName, name: item.name },
        };
      });

    const scfTemplatesChoices = templates
      .filter((item) => item.name.startsWith('scf-') && item.name !== 'scf-starter')
      .map((item) => {
        let name = item.name;

        if (item['description-i18n'] && item['description-i18n']['zh-cn']) {
          name = `${name} - ${item['description-i18n']['zh-cn']}`;
        } else if (item.description) {
          name = `${name} - ${item.description}`;
        }

        return {
          name,
          value: { id: item.componentName, name: item.name },
        };
      });

    const multiScfTemplatesChioices = templates
      .filter((item) => item.name.startsWith('multi-scf-') && item.name !== 'multi-scf-starter')
      .map((item) => {
        let name = item.name;

        if (item['description-i18n'] && item['description-i18n']['zh-cn']) {
          name = `${name} - ${item['description-i18n']['zh-cn']}`;
        } else if (item.description) {
          name = `${name} - ${item.description}`;
        }

        return {
          name,
          value: { id: item.componentName, name: item.name },
        };
      });

    return { templatesChoices, scfTemplatesChoices, multiScfTemplatesChioices };
  } catch (e) {
    if (!e.extraErrorInfo) {
      e.extraErrorInfo = {
        step: '模版信息获取',
      };
    } else {
      e.extraErrorInfo.step = '模版信息获取';
    }
    throw e;
  }
};

module.exports = async (config, cli) => {
  // We assume we're not in service|component context
  // As this function is configured to be invoked only in such case
  if (
    // EN: No project detected. Do you want to create a new one?'
    !(await confirm('当前未检测到 Serverless 项目，是否希望新建一个项目？', {
      name: 'shouldCreateNewProject',
    }))
  ) {
    return null;
  }
  const sdk = new ServerlessSDK({ context: { traceId: uuidv4() } });
  let telemtryData = await generatePayload({ command: 'auto' });
  // Fetch latest templates from registry
  try {
    const { templatesChoices, scfTemplatesChoices, multiScfTemplatesChioices } =
      await getTemplatesFromRegistry(sdk);
    if (templatesChoices.length === 0) {
      // EN: Can not find any template in registry!
      cli.log(chalk.red('当前注册中心无可用模版!\n'));
      return null;
    }
    // console.log(templatesChoices)
    const projectType = await projectTypeChoice(templatesChoices);
    const workingDir = process.cwd();
    let { name, id: packageName } = projectType;

    // Choice runtime for scf examples
    if (name === 'scf-starter') {
      const {
        scfRuntimeType: { id, name: scfName },
      } = await getScfRuntimeTypeChoice(scfTemplatesChoices);
      packageName = id;
      name = scfName;
    }

    if (name === 'multi-scf-starter') {
      const {
        multiScfRuntimeType: { id, name: multiScfName },
      } = await getMultiScfRuntimeTypeChoice(multiScfTemplatesChioices);
      packageName = id;
      name = multiScfName;
    }

    const projectName = await projectNameInput(workingDir);
    const projectDir = path.join(workingDir, projectName);

    cli.log(
      // EN: Downloading ${projectType.name} app...
      `Serverless: ${chalk.yellow(`正在安装 ${name} 应用...`)}\n`
    );

    // Get detailed information about the selected template
    const registryPackage = await sdk.getPackage(packageName);

    // Start CLI persistance status
    cli.sessionStart('Installing', { timer: false });
    // Start initialing the template on cli
    const ymlParsed = await initTemplateFromCli(
      projectDir,
      packageName,
      registryPackage,
      cli,
      projectName
    );

    cli.log(`- 项目 "${projectName}" 已在当前目录成功创建`);
    cli.log(`- 执行 "cd ${projectName} && serverless deploy" 部署应用`);

    cli.sessionStop('success', '创建成功');

    // save onboarding action data
    telemtryData = await generatePayload({
      command: 'auto',
      rootConfig: ymlParsed,
      serviceDir: projectDir,
    });
    await storeLocally(telemtryData);

    if (
      // EN: Do you want to deploy your project on the cloud now?
      !(await confirm('是否希望立即将该项目部署到云端？', {
        name: 'shouldDeployNewProject',
      }))
    ) {
      return null;
    }
    process.chdir(projectDir);

    // Proceed with a deployment
    process.argv.push('deploy');
    return require('..')();
  } catch (err) {
    telemtryData.outcome = 'failure';
    telemtryData.failure_reason = err.message;
    await storeLocally(telemtryData, err);

    throw err;
  }
};
