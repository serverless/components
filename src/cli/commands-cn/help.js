'use strict';

/*
 * CLI: Command: Help
 */

const chalk = require('chalk');
const { version } = require('../../../package.json');
const utils = require('../utils');

const title = chalk.underline.bold;
const command = chalk.dim.bold;

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

module.exports = async (config, cli) => {
  cli.logLogo();

  let scfCommands = '';
  if (await isInSCFComponentFolder()) {
    scfCommands = `
函数组件命令
${command('serverless invoke')}           调用函数
${command(
  '   --data / -d'
)}                 指定传入函数的事件 (event) 参数数据，需要使用序列化的 JSON 格式
${command('   --path / -p')}                 指定传入函数的事件 (event) 参数的 JSON 文件路径
${command('   --stage / -s')}                指定环境名称，默认使用配置环境
${command('   --region / -r')}               指定地区名称，默认使用配置地区

${command('serverless invoke local')}     本地调用函数
${command('   --function / -f')}             调用的函数名称，默认使用配置的函数
${command(
  '   --data / -d'
)}                 指定传入函数的事件 (event) 参数数据，需要使用序列化的 JSON 格式
${command('   --path / -p')}                 指定传入函数的事件 (event) 参数的 JSON 文件路径
${command(
  '   --context'
)}                   指定传入函数的上下文(context)参数数据，需要使用序列化的 JSON 格式
${command('   --contextPath / -x')}          指定传入函数的上下文 (context) 参数的 JSON 文件路径
${command('   --env / -e')}                  指定环境变量信息 如: --env VAR=val
${command('   --config / -c')}               指定使用的配置文件
`;
  }

  cli.log(
    `
Serverless 命令
* 您可以输入 “serverless“ 或简称 ”sls“
* 在 “serverless" 命令后输入 “--help” 获取使用帮助
快速开始
* 直接输入 “serverless" (或缩写 “sls”) 进行项目初始化


${command('serverless init {name}')}      通过 应用中心 或指定链接初始化一个模版项目
${command('  --debug')}                      获取项目初始化过程中的详细信息
${command('  --name')}                       自定义项目目录名称

${command('serverless deploy')}           部署 Serverless 实例到云端
${command('  --debug')}                      获取部署过程的详细信息
${command('  --target')}                     部署该目录下指定 Serverless 实例
${command('  --inputs')}                     增加实例部署参数
${command('  --profile')}                    使用全局授权名称信息的密钥信息, 默认 'default' 
${command('  --login')}                      忽略全局认证信息 

${command('serverless info')}             获取并展示一个 Serverless 实例的相关信息
${command('  --profile')}                    使用全局授权名称信息的密钥信息, 默认 'default' 

${command(
  'serverless dev'
)}              启动 DEV MODE 开发者模式，支持在命令行中实时输出运行日志，同时支持对 Node.js 应用进行云端调试
${command('  --profile')}                    使用全局授权名称信息的密钥信息, 默认 'default' 

${command('serverless logs')}             查看应用日志
${command('   --startTime')}                 指定开始时间，如：3h, 20130208T080910, 默认10m
${command('   --tail / -t')}                 启动监听模式
${command('   --intervial / -i')}            监听模式的刷新时间 默认：2000ms
${command('   --stage / -s')}                指定环境名称，默认使用配置环境
${command('   --region / -r')}               指定地区名称，默认使用配置地区

${command('serverless remove')}           从云端移除一个 Serverless 实例
${command('  --debug')}                      获取移除过程的详细信息
${command('  --target')}                     移除该目录下指定 Serverless 实例
${command('  --profile')}                    使用全局授权名称信息的密钥信息, 默认 'default'

${command('serverless credentials')}      管理全局用户授权信息
${command('   set')}                         存储用户授权信息
${command('     --secretId / -i')}              (必填)腾讯云CAM账号secretId
${command('     --secretKey / -k')}             (必填)腾讯云CAM账号secretKey
${command('     --profile / -n {name}')}        身份名称. 默认为 "default"
${command('     --overwrite / -o')}             覆写已有身份名称授权信息
${command('   remove')}                      删除用户授权信息
${command('     --profile / -n {name}')}        (必填)身份名称.
${command('   list')}                        查看用户授权信息

${command('serverless registry')}         显示 应用中心 里的组件与模版信息
${command('serverless registry {name}')}  显示 应用中心 里的指定组件或模版的详细信息

${command('serverless publish')}          发布一个组件或模版到 应用中心

${command('serverless bind role')}        重新为当前用户分配使用 Serverless 所需权限

${scfCommands}
${title('当前命令行版本:')}  v${version}

${title('产品文档:')}        https://cloud.tencent.com/document/product/1154
${title('控制面板:')}        https://serverless.cloud.tencent.com/
${title('应用中心:')}        https://registry.serverless.com/
  `
  );
};
