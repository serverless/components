const msRestAzure = require('ms-rest-azure')
const StorageManagementClient = require('azure-arm-storage')
const azureStorage = require('azure-storage')

async function createStorage(
  { name, blobContainer, subscriptionId, resourceGroup, directoryId, appId, appSecret, location },
  context
) {
  const credentials = new msRestAzure.ApplicationTokenCredentials(appId, directoryId, appSecret)
  const storageClient = new StorageManagementClient(credentials, subscriptionId)

  const rgComponent = await context.load('../../registry/azure-rg', 'resourceGroup', {
    name: resourceGroup,
    subscriptionId,
    directoryId,
    appId,
    appSecret,
    location
  })

  await rgComponent.deploy()

  context.log(`Creating storage account: ${name}`)
  let storageParameters = {
    location: location,
    sku: {
      name: 'Standard_LRS'
    },
    kind: 'Storage'
  }

  await storageClient.storageAccounts.create(resourceGroup, name, storageParameters)

  let storageKeyResult = await storageClient.storageAccounts.listKeys(resourceGroup, name)

  let storageKey = storageKeyResult.keys[0].value
  let connectionString = `DefaultEndpointsProtocol=https;AccountName=${name};AccountKey=${storageKey};EndpointSuffix=core.windows.net`

  let blobClient = azureStorage.createBlobService(connectionString)

  context.log(`Creating container: ${blobContainer}`)
  return new Promise((resolve) => {
    blobClient.createContainerIfNotExists(blobContainer, (err) => {
      if (err) throw err
      resolve({
        name,
        blobContainer,
        connectionString
      })
    })
  })
}

async function deploy(inputs, context) {
  const { subscriptionId, resourceGroup, directoryId, appId, appSecret } = inputs
  let outputs = await createStorage(inputs, context)
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
  if (!context.state.name) return {}
  const {
    name,
    blobContainer,
    connectionString,
    subscriptionId,
    resourceGroup,
    directoryId,
    appId,
    appSecret
  } = context.state

  const credentials = new msRestAzure.ApplicationTokenCredentials(appId, directoryId, appSecret)
  const storageClient = new StorageManagementClient(credentials, subscriptionId)

  context.log(`Removing storage account: ${name}`)
  await storageClient.storageAccounts.deleteMethod(resourceGroup, name)
  return { name, blobContainer, connectionString }
}

module.exports = {
  deploy,
  remove
}
