const msRestAzure = require('ms-rest-azure')
const ResourceManagementClient = require('azure-arm-resource').ResourceManagementClient
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

  let createResourceGroupAsync = Promise.promisify(resourceClient.resourceGroups.createOrUpdate)
  let createResourceAsync = Promise.promisify(resourceClient.resources.createOrUpdate)

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

  var params = {
    location: 'westus',
    properties: { serverFarmId: 'serverless-westus', siteConfig: { appSettings: [] } },
    Name: name
  }

  context.log(`\nCreating function app: ${name}`)

  var response = await createResourceAsync(
    resourceGroup,
    'Microsoft.Web',
    '',
    'sites',
    name,
    '2015-08-01',
    params
  )

  return response
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
