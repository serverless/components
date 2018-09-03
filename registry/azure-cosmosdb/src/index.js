const msRestAzure = require('ms-rest-azure')
const { ResourceManagementClient } = require('azure-arm-resource')
const sleep = require('util').promisify(setTimeout)

async function createCosmosDb(
  { name, subscriptionId, directoryId, appId, appSecret, location, resourceGroup, apiType },
  context
) {
  const credentials = new msRestAzure.ApplicationTokenCredentials(appId, directoryId, appSecret)
  const resourceClient = new ResourceManagementClient(credentials, subscriptionId)

  const rgComponent = await context.load('../../registry/azure-rg', 'resourceGroup', {
    resourceGroup,
    subscriptionId,
    directoryId,
    appId,
    appSecret,
    location
  })

  await rgComponent.deploy()

  const cosmosParameters = {
    location,
    kind: 'GlobalDocumentDB',
    properties: {
      databaseAccountOfferType: 'Standard',
      capabilities: [
        {
          name: apiType == 'SQL' ? '' : '' // https://github.com/Azure/azure-quickstart-templates/blob/ea219985c5c6e5db220319076781167a2550e186/101-cosmosdb-create-arm-template/azuredeploy.json#L58
        }
      ]
    },
    tags: {
      defaultExperience: 'DocumentDB' // https://github.com/Azure/azure-quickstart-templates/blob/ea219985c5c6e5db220319076781167a2550e186/101-cosmosdb-create-arm-template/azuredeploy.json#L63
    }
  }

  context.log(`Creating CosmosDB account: ${name}`)
  const resourceId = `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroup}/providers/Microsoft.DocumentDB/databaseAccounts/${name}`
  const apiVersion = '2015-04-08'

  let options = {
    method: 'PUT',
    url: `https://management.azure.com${resourceId}?api-version=${apiVersion}`,
    body: cosmosParameters
  }

  await resourceClient.sendRequest(options)

  let db = await resourceClient.resources.getById(resourceId, apiVersion)
  while (db.properties.provisioningState == 'Initializing') {
    context.log('Initializing...')
    await sleep(10000)
    db = await resourceClient.resources.getById(resourceId, apiVersion)
  }

  options = {
    method: 'POST',
    url: `https://management.azure.com${resourceId}/listKeys?api-version=${apiVersion}`,
    body: null
  }

  const keyResponse = await resourceClient.sendRequest(options)

  return {
    name,
    ...keyResponse
  }
}

async function deploy(inputs, context) {
  const { subscriptionId, directoryId, appId, appSecret, resourceGroup } = inputs
  let outputs = await createCosmosDb(inputs, context)

  const state = {
    ...outputs,
    subscriptionId,
    resourceGroup,
    directoryId,
    appId,
    appSecret
  }

  context.saveState(state)
  return outputs
}

async function remove(inputs, context) {
  const { name, subscriptionId, directoryId, appId, appSecret, resourceGroup } = context.state
  const credentials = new msRestAzure.ApplicationTokenCredentials(appId, directoryId, appSecret)
  const resourceClient = new ResourceManagementClient(credentials, subscriptionId)

  context.log(`Removing CosmosDb: ${name}`)

  const resourceId = `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroup}/providers/Microsoft.DocumentDB/databaseAccounts/${name}`
  const apiVersion = '2015-04-08'

  let options = {
    method: 'DELETE',
    url: `https://management.azure.com${resourceId}?api-version=${apiVersion}`,
    body: null
  }

  await resourceClient.sendRequest(options)

  return { name }
}

module.exports = {
  deploy,
  remove
}
