const msRestAzure = require('ms-rest-azure')
const { ResourceManagementClient } = require('azure-arm-resource')

async function deploy(inputs, context) {
  const { name, subscriptionId, directoryId, appId, appSecret, location } = inputs
  const credentials = new msRestAzure.ApplicationTokenCredentials(appId, directoryId, appSecret)
  const resourceClient = new ResourceManagementClient(credentials, subscriptionId)

  const groupParameters = { location: location, tags: { source: 'serverless-framework' } }

  context.log(`Creating resource group: ${name}`)
  await resourceClient.resourceGroups.createOrUpdate(name, groupParameters)

  const state = { name, subscriptionId, directoryId, appId, appSecret }

  context.saveState(state)
  return { name }
}

async function remove(inputs, context) {
  if (!context.state.name) return {}

  const { name, subscriptionId, directoryId, appId, appSecret } = context.state

  const credentials = new msRestAzure.ApplicationTokenCredentials(appId, directoryId, appSecret)
  const resourceClient = new ResourceManagementClient(credentials, subscriptionId)

  context.log(`Removing resource group: ${name}`)
  await resourceClient.resourceGroups.deleteMethod(name)

  return { name }
}

module.exports = {
  deploy,
  remove
}
