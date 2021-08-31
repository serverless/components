'use strict';

/*
 * CLI: Command: Help
 */

const chalk = require('chalk');
const { distance: getDistance } = require('fastest-levenshtein');
const utils = require('../utils');

const title = chalk.blue.bold;
const command = chalk.blue;
const command2 = chalk.bold.blue;
const description = chalk.blue;
const gray = chalk.gray;

async function generateMainHelp(cli) {
  async function isInSCFComponentFolder() {
    try {
      const instanceYaml = await utils.loadInstanceConfig(process.cwd());
      if (instanceYaml && instanceYaml.component.includes('scf')) {
        return true;
      }
    } catch (error) {
      return false;
    }

    return false;
  }

  cli.logLogo();

  let scfCommands = '';
  if (await isInSCFComponentFolder()) {
    scfCommands = `
${title('函数组件命令')}

${command('invoke')}           调用函数
${command('invoke local')}     本地调用函数
`;
  }

  cli.log(
    `
${title('快速开始')}
${gray('* 直接输入 "serverless" (或缩写 "sls") 进行项目初始化')}

${title('链接')}
${gray('产品文档: https://cloud.tencent.com/document/product/1154')}
${gray('控制面板: https://serverless.cloud.tencent.com/')}
${gray('问答社区: https://github.com/serverless/serverless-tencent/discussions ')}

${title('命令')}
${gray('* 您可以通过 "serverless" 或简称 "sls" 来执行命令')}
${gray('* 使用 "serverless [command] --help" 获取详细帮助信息')}

${command('init')}             通过模板初始化新项目
${command('deploy')}           部署应用到云端
${command('info')}             获取应用详情
${command('dev')}              启动调试模式
${command('logs')}             查看应用日志
${command('remove')}           移除应用
${command('credentials')}      管理全局授权信息
${command('registry')}         查看应用中心的组件与模版信息
${command('publish')}          发布组件或模版到应用中心
${command('bind role')}        重新为当前用户分配使用 Serverless 所需权限
${scfCommands}
  `
  );
}

function generateCommandHelp(commandName, cli) {
  const allowedCommands = {
    'init': `
${command2('init')}                       通过模板初始化新应用
${description(`    {template}               [必填] 模板名称
    --name                   指定应用目录名称
`)}`,
    'deploy': `
${command2('deploy')}                    部署应用到云端
${description(`    --stage / -s             指定环境名称，默认使用配置环境
    --target                 指定要部署的组件实例路径
    --inputs                 覆写 inputs 配置
    --profile                使用指定身份的全局授权信息
    --login                  使用临时授权
    --force                  强制部署，跳过缓存和 serverless 应用校验
    --noCache                跳过缓存
    --noValidation           跳过 serverless 应用校验
    --debug                  显示 debug 信息
`)}`,
    'info': `
${command2('info')}                      获取应用详情
${description(`    --stage / -s             指定环境名称，默认使用配置环境
    --profile                指定身份的全局授权信息
`)}`,
    'dev': `
${command2('dev')}                       启动调试模式
${description(`    --stage / -s             指定环境名称，默认使用配置环境
    --profile                使用指定身份的全局授权信息
    --target                 指定执行命令的组件实例路径
`)}`,
    'logs': `
${command2('logs')}                      查看应用日志
${description(`    --function / -f          查看多函数组件的指定函数日志(单函数组件无需指定)
    --target                 指定要查看的组件实例路径
    --stage / -s             指定环境名称，默认使用配置环境
    --startTime              指定开始时间，如：3h, 20130208T080910，默认10m
    --tail / -t              启动监听模式
    --intervial / -i         监听模式的刷新时间 默认：2000ms
    --region / -r            指定地区名称，默认使用配置地区
    --namespace / -n         指定命名空间，默认使用配置命名空间
    --qualifier / -q         指定函数版本，默认使用配置版本
`)}`,
    'remove': `
${command2('remove')}                    移除应用
${description(`    --stage / -s             指定环境名称，默认使用配置环境
    --target                 指定要移除的组件实例路径
    --profile                使用指定身份的全局授权信息
    --debug                  显示 debug 信息
`)}`,
    'credentials': `
${command2('credentials')}               管理全局授权信息
${command2('credentials set')}           存储用户授权信息
${description(`    --secretId / -i          [必填]腾讯云CAM账号secretId
    --secretKey / -k         [必填]腾讯云CAM账号secretKey
    --profile / -n {name}    身份名称. 默认为 "default"
    --overwrite / -o         覆写已有身份名称授权信息`)}
${command2('credentials remove')}        删除用户授权信息
${description('    --profile / -n {name}    身份名称. 默认为 "default"')}
${command2('credentials list')}          查看已有用户授权信息
`,
    'registry': `
${command2('registry')}                  查看注册中心的组件与模版信息
${description(`    {name}                   模板名称
`)}`,
    'publish': `
${command2('publish')}                   发布组件或模版到应用中心
`,
    'bind role': `
${command2('bind role')}                 重新为当前用户分配使用 Serverless 所需权限
`,
    'invoke': `
${command2('invoke')}                    调用函数
${description(`    --function / -f          调用的多函数组件的函数名称(单函数组件无需指定)
    --target                 指定要调用的组件实例路径
    --stage / -s             指定环境名称，默认使用配置环境
    --region / -r            指定地区名称，默认使用配置地区
    --data / -d              指定传入函数的事件(event)参数数据，需要使用序列化的 JSON 格式
    --path / -p              指定传入还输的事件(event)参数的 JSON 文件路径
    --namespace / -n         指定命名空间，默认使用配置命名空间
    --qualifier / -q         指定函数版本，默认使用配置版本
`)}`,
    'invoke local': `
${command2('invoke local')}              本地调用函数
${description(`    --function / -f          调用的多函数组件的函数名称(单函数组件无需指定)
    --target                 指定要调用的组件实例路径
    --data / -d              指定传入函数的事件(event)参数数据，需要使用序列化的 JSON 格式
    --path / -p              指定传入还输的事件(event)参数的 JSON 文件路径
    --context                指定传入函数的上下文(context)参数数据，需要使用序列化的 JSON 格式
    --contextPath / -x       指定传入函数的上下文(context)参数的 JSON 文件路径
    --env / -e               指定环境变量信息 如: --env VAR=val
    --config / -c            指定使用的配置文件
    --py                     指定要使用的本机中的Python版本，默认使用python. 如: --py python3 (此配置只对runtime是Python的配置有效)
    --php                    指定要使用的本机中的Php版本，默认使用php. 如: --php php7.2 (此配置只对runtime是Php的配置有效)
`)}`,
  };

  if (allowedCommands[commandName]) {
    cli.log(allowedCommands[commandName]);
  } else {
    // suggest command
    const commandWordsArr = Object.keys(allowedCommands);
    const { suggestion } = commandWordsArr.reduce(
      (pre, cur) => {
        const distance = getDistance(commandName, cur);
        if (pre.minDistance === 0 || pre.minDistance > distance) {
          return {
            suggestion: cur,
            minDistance: distance,
          };
        }

        return pre;
      },
      { suggestion: '', minDistance: 0 }
    );
    // Serverless command "log" not found. Did you mean "logs"? Run "serverless help" for a list of all available commands.
    cli.log();
    cli.log(
      `Serverless: ${chalk.yellow(
        `没有找到 "${commandName}" 命令. 你想查看的是 "${suggestion}" 的帮助信息吗? 可以通过 "serverless help" 查看所有可用命令`
      )}`
    );
    cli.log();
  }
}

module.exports = async (config, cli) => {
  // Get command name
  let commandName;
  // sls [command] --help
  if (config.help === true) {
    commandName = config.originalCommand;
    const paramStr = config.params.join(' ');
    if (paramStr) commandName = `${commandName} ${paramStr}`;
  }

  // sls --help [command]
  if (config.help && config.help !== true) {
    commandName = config.help;
    if (config.originalCommand) commandName = `${commandName} ${config.originalCommand}`;
  }

  // sls help [command]
  if (!config.help && config.params.length > 0) {
    commandName = config.params.join(' ');
  }

  if (commandName) {
    generateCommandHelp(commandName, cli);
  } else {
    await generateMainHelp(cli);
  }
};
