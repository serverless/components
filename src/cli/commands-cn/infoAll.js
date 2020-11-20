
const { ServerlessSDK } = require('@serverless/platform-client-china');
const { login, loadInstanceCredentials, getTemplate, handleDebugLogMessage } = require('./utils');

module.exports = async () => {
  const templateYaml = await getTemplate(process.cwd());
  console.log(templateYaml);
}