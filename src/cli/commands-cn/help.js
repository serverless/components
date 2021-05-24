'use strict';

/*
 * CLI: Command: Help
 */

const chalk = require('chalk');
const { distance: getDistance } = require('fastest-levenshtein');
const utils = require('../utils');

const title = chalk.blue.bold;
const command = chalk.bold;
const gray = chalk.gray;

async function generateMainHelp(cli) {
  async function isInSCFComponentFolder() {
    try {
      const instanceYaml = await utils.loadInstanceConfig(process.cwd());
      if (instanceYaml && instanceYaml.component === 'scf') {
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
${command('serverless invoke')}           调用函数
${command('serverless invoke local')}     本地调用函数
`;
  }

  cli.log(
    `
${title('快速开始')}
${gray('* 直接输入 "serverless" (或缩写 "sls") 进行项目初始化')}

${title('Serverless 链接')}
${gray('产品文档: https://cloud.tencent.com/document/product/1154')}
${gray('控制面板: https://serverless.cloud.tencent.com/')}
${gray('应用中心: https://registry.serverless.com/')}

${title('Serverless 命令')}
${gray('* 您可以输入 "serverless" 或简称 "sls"')}
${gray('* 使用 "serverless help [command]" 获取详细帮助信息')}

${command('serverless init')}             通过模板初始化新项目
${command('serverless deploy')}           部署应用到云端
${command('serverless info')}             获取应用详情
${command('serverless dev')}              启动调试模式
${command('serverless logs')}             查看应用日志
${command('serverless remove')}           移除应用
${command('serverless credentials')}      管理全局授权信息
${command('serverless registry')}         查看应用中心的组件与模版信息
${command('serverless publish')}          发布组件或模版到应用中心
${command('serverless bind role')}        重新为当前用户分配使用 Serverless 所需权限
${scfCommands}
  `
  );
}

function generateCommandHelp(commandName, cli) {
  const allowedCommands = {
    init: `
init                      通过模板初始化新应用
    {template}               [必填] 模板名称 
    --name                   指定应用目录名称
`, 'deploy': `
deploy                    部署应用到云端
    --target                 指定要部署的组件实例路径
    --inputs                 覆写 inputs 配置
    --profile                使用指定身份的全局授权信息
    --login                  使用临时授权
    --debug                  显示 debug 信息
`, 'info': `
info                      获取应用详情
    --profile                指定身份的全局授权信息
`, 'dev': `
dev                       启动调试模式
    --profile                使用指定身份的全局授权信息
`, 'logs': `
logs                      查看应用日志
    --function / -f          查看指定函数的日志，默认使用配置的函数
    --startTime              指定开始时间，如：3h, 20130208T080910，默认10m
    --tail / -t              启动监听模式
    --intervial / -i         监听模式的刷新时间 默认：2000ms
    --stage / -s             指定环境名称，默认使用配置环境
    --region / -r            指定地区名称，默认使用配置地区
`, 'remove': `
remove                    移除应用
    --target                 指定要移除的组件实例路径
    --profile                使用指定身份的全局授权信息
    --debug                  显示 debug 信息
`, 'credentials': `
credentials               管理全局授权信息
credentials set           存储用户授权信息
    --secretId / -i          [必填]腾讯云CAM账号secretId
    --secretKey / -k         [必填]腾讯云CAM账号secretKey
    --profile / -n {name}    身份名称. 默认为 "default"
    --overwrite / -o         覆写已有身份名称授权信息
credentials remove        删除用户授权信息
    --profile / -n {name}    身份名称. 默认为 "default"
credentials list          查看已有用户授权信息
`, 'registry': `
registry                  查看注册中心的组件与模版信息
    {name}                   模板名称
`, 'publish': `
publish                   发布组件或模版到应用中心
`, 'bind role': `
bind role                 重新为当前用户分配使用 Serverless 所需权限
`, 'invoke': `
invoke                    调用函数
    --function / -f          调用的函数名称，默认使用配置的函数
    --stage / -s             指定环境名称，默认使用配置环境
    --region / -r            指定地区名称，默认使用配置地区
    --data / -d              指定传入函数的事件(event)参数数据，需要使用序列化的 JSON 格式
    --path / -p              指定传入还输的事件(event)参数的 JSON 文件路径
`, 'invoke local': `
invoke local              本地调用函数
    --function / -f          调用的函数名称，默认使用配置的函数
    --data / -d              指定传入函数的事件(event)参数数据，需要使用序列化的 JSON 格式
    --path / -p              指定传入还输的事件(event)参数的 JSON 文件路径
    --context                指定传入函数的上下文(context)参数数据，需要使用序列化的 JSON 格式
    --contextPath / -x       指定传入函数的上下文(context)参数的 JSON 文件路径
    --env / -e               指定环境变量信息 如: --env VAR=val
    --config / -c            指定使用的配置文件
`
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
    cli.log(`没有找到 "${commandName}" 命令. 你想查看的是 "${suggestion}" 的帮助信息吗? 可以通过 "serverless help" 查看所有可用命令`)
  }
}

module.exports = async (config, cli) => {
  if (config.params.length === 0) {
    await generateMainHelp(cli);
  } else {
    const command = config.params.join(' ');
    generateCommandHelp(command, cli);
  }
};
