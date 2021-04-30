'use strict';

/*
 * CLI: Command: Help
 */

const chalk = require('chalk');
const { version } = require('../../../package.json');

const title = chalk.underline.bold;
const command = chalk.dim.bold;

module.exports = async (config, cli) => {
  cli.logLogo();

  cli.log(
    `
Serverless 指令
* 您可以输入 “serverless“ 或简称 ”sls“
* 在 “serverless" 指令后输入 “--help” 获取使用帮助
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


${title('当前命令行版本:')}  v${version}

${title('产品文档:')}        https://cloud.tencent.com/document/product/1154
${title('控制面板:')}        https://serverless.cloud.tencent.com/
${title('应用中心:')}        https://registry.serverless.com/
  `
  );
};
