'use strict';

/*
 * CLI: Command: Help
 */

const chalk = require('chalk');
const { version } = require('../../../package.json');
const utils = require('../utils');

const title = chalk.blue.bold;
const command = chalk.dim.bold;

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
${title('快速开始')}
* 直接输入 “serverless" (或缩写 “sls”) 进行项目初始化

${title('Serverless 链接')}
产品文档: https://cloud.tencent.com/document/product/1154
控制面板: https://serverless.cloud.tencent.com/
应用中心: https://registry.serverless.com/

${title('Serverless 命令')}
* 您可以输入 “serverless“ 或简称 ”sls“
* 在 “serverless" 命令后输入 “--help” 获取使用帮助

${command('serverless init')}             通过模板初始化新项目
${command('serverless deploy')}           部署应用到云端
${command('serverless info')}             获取应用详情
${command('serverless dev')}              启动调试模式
${command('serverless logs')}             查看应用日志
${command('serverless remove')}           从云端移除一个 Serverless 实例
${command('serverless credentials')}      管理全局用户授权信息
${command('serverless registry')}         显示 应用中心 里的组件与模版信息
${command('serverless publish')}          发布一个组件或模版到 应用中心
${command('serverless bind role')}        重新为当前用户分配使用 Serverless 所需权限

${scfCommands}
  `
  );
}

function generateCommandHelp(command) {}

module.exports = async (config, cli) => {
  await generateMainHelp(cli);
};
