const msRestAzure = require('ms-rest-azure')
const { ResourceManagementClient } = require('azure-arm-resource')
const StorageManagementClient = require('azure-arm-storage')

async function createFunction(
  {
    name,
    subscriptionId,
    resourceGroup,
    tenant,
    clientId,
    clientSecret /*, runtime, description, env, root */
  },
  context
) {
  context.log('Authenticating and creating clients...')
  // const path = root || context.projectPath
  // TODO: const pkg = await pack(path);
  const credentials = new msRestAzure.ApplicationTokenCredentials(clientId, tenant, clientSecret)
  const resourceClient = new ResourceManagementClient(credentials, subscriptionId)
  const storageClient = new StorageManagementClient(credentials, subscriptionId)

  const storageAccountName = 'serverlessstorage1221'
  const appServicePlanName = 'serverless-westus'
  const functionLocation = 'westus'

  var groupParameters = { location: functionLocation, tags: { source: 'serverless-framework' } }

  context.log('Creating resource group: ' + resourceGroup)

  await resourceClient.resourceGroups.createOrUpdate(resourceGroup, groupParameters)

  context.log('Resource group created')

  var planParameters = {
    properties: {
      sku: 'Dynamic',
      computeMode: 'Dynamic',
      name: appServicePlanName
    },
    location: functionLocation
  }

  context.log(`Creating hosting plan: ${appServicePlanName}`)
  await resourceClient.resources.createOrUpdate(
    resourceGroup,
    'Microsoft.Web',
    '',
    'serverFarms',
    appServicePlanName,
    '2015-04-01',
    planParameters
  )

  context.log(`Creating storage account: ${storageAccountName}`)
  var storageParameters = {
    location: functionLocation,
    kind: 'Storage',
    sku: {
      name: 'Standard_LRS'
    }
  }

  await resourceClient.resources.createOrUpdate(
    resourceGroup,
    'Microsoft.Storage',
    '',
    'storageAccounts',
    storageAccountName,
    '2018-02-01',
    storageParameters
  )

  let storageKeyResult = await storageClient.storageAccounts.listKeys(
    resourceGroup,
    storageAccountName
  )
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
      value: '8.11.0' /* this would correspond to node runtime specified */
    }
  ]
  var functionAppParameters = {
    location: functionLocation,
    properties: {
      serverFarmId: appServicePlanName,
      siteConfig: { appSettings: functionAppSettings }
    },
    Name: name
  }

  context.log(`\nCreating function app: ${name}`)

  let functionAppResult = await resourceClient.resources.createOrUpdate(
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
  // If name is not included, add it from config key
  if (!inputs.name) inputs.name = context.id.split(':')[1]

  let outputs = {
    functionUrl: 'https://jeff.azurewebsites.net'
  }

  // az ad sp create-for-rbac -n "jehollan-serverlessframework" --role contributor  \
  // --scopes /subscriptions/ef90e930-9d7f-4a60-8a99-748e0eea69de

  // TODO: call the default Azure Role component

  // TODO: do the decision tree on create or update (if necessary)

  context.log('about to call createFunction')
  await createFunction(inputs, context)

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
