const msRestAzure = require('ms-rest-azure')
const ResourceManagementClient = require('azure-arm-resource').ResourceManagementClient
const StorageManagementClient = require('azure-arm-storage').StorageManagementClient
const Promise = require('bluebird')

async function createFunction(
  { name, subscriptionId, resourceGroup /*, runtime, description, env, root */ },
  context,
  role
) {
  context.log('starting create function...')
  // const path = root || context.projectPath
  // TODO: const pkg = await pack(path);
  const credentials = new msRestAzure.ApplicationTokenCredentials(
    role.clientId,
    role.tenant,
    role.secret
  )
  const resourceClient = new ResourceManagementClient(credentials, subscriptionId)
  const storageClient = new StorageManagementClient(credentials, subscriptionId)

  const storageAccountName = 'serverlessstorage1221'

  let createResourceGroupAsync = Promise.promisify(resourceClient.resourceGroups.createOrUpdate)
  let createResourceAsync = Promise.promisify(resourceClient.resources.createOrUpdate)
  let listKeysAsync = Promise.promisify(storageClient.storageAccounts.listKeys)

  context.log('authenticated clients...')
  var groupParameters = { location: 'westus', tags: { source: 'serverless-framework' } }

  context.log('\nCreating resource group: ' + resourceGroup)

  await createResourceGroupAsync(resourceGroup, groupParameters)

  var planParameters = {
    properties: {
      sku: 'Dynamic',
      computeMode: 'Dynamic',
      name: 'serverless-westus'
    },
    location: 'westus'
  }

  context.log('\nCreating hosting plan: serverless-westus')
  await createResourceAsync(
    resourceGroup,
    'Microsoft.Web',
    '',
    'serverFarms',
    'serverless-westus',
    '2015-04-01',
    planParameters
  )

  context.log(`\nCreating storage account: storageAccountName`)
  var storageParameters = {
    location: 'westus',
    kind: 'Storage',
    sku: {
      name: 'Standard_LRS'
    }
  }

  await createResourceAsync(
    resourceGroup,
    'Microsoft.Storage',
    '',
    'storageAccounts',
    'storageAccountName',
    '2018-02-01',
    storageParameters
  )

  let storageKeyResult = await listKeysAsync(resourceGroup, 'storageAccountName')
  let storageKey = storageKeyResult.keys[0]

  var functionAppSettings = [
    {
      name: 'AzureWebJobsStorage',
      value: `DefaultEndpointsProtocol=https;AccountName=${storageAccountName};AccountKey=${storageKey}`
    },
    {
      name: 'FUNCTIONS_EXTENSION_VERSION',
      value: 'beta'
    },
    {
      name: 'WEBSITE_NODE_DEFAULT_VERSION',
      value: '8.11.0'
    }
  ]
  var functionAppParameters = {
    location: 'westus',
    properties: {
      serverFarmId: 'serverless-westus',
      siteConfig: { appSettings: functionAppSettings }
    },
    Name: name
  }

  context.log(`\nCreating function app: ${name}`)

  let functionAppResult = await createResourceAsync(
    resourceGroup,
    'Microsoft.Web',
    '',
    'sites',
    name,
    '2015-08-01',
    functionAppParameters
  )

  return functionAppResult
}

async function deploy(inputs, context) {
  let outputs = {
    functionUrl: 'https://jeff.azurewebsites.net'
  }
  const role = {
    clientId: process.env.clientId,
    secret: process.env.clientSecret,
    tenant: process.env.tenant
  }

  // az ad sp create-for-rbac -n "jehollan-serverlessframework" --role contributor  \
  // --scopes /subscriptions/ef90e930-9d7f-4a60-8a99-748e0eea69de

  // TODO: call the default Azure Role component

  // TODO: do the decision tree on create or update (if necessary)

  await createFunction(inputs, context, role)

  context.log('about to save state')
  context.saveState({ ...inputs, ...outputs })
  return outputs
}

function remove(inputs, context) {
  context.log('removing functions')
}

module.exports = {
  deploy,
  remove
}
