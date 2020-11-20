
const {
  getAccessKey,
  loadInstanceCredentials,
  getTemplate,
  isLoggedInOrHasAccessKey,
} = require('./utils');
const { ServerlessSDK } = require('@serverless/platform-client');

module.exports = async () => {
  const templateYaml = await getTemplate(process.cwd());
  const accessKey = await getAccessKey(templateYaml.org);
  const sdk = new ServerlessSDK({
    accessKey,
  });

  
  let instance = await sdk.getInstance(
    templateYaml.org,
    templateYaml.stage,
    templateYaml.app,
    templateYaml.api.name
  );

  console.log(instance);
}