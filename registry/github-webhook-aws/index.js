const parseGithubRepo = require('parse-github-url')

// "private" functions
async function deployIamRole(inputs, context) {
  const roleName = `${inputs.name}-iam-role`
  const iamInputs = {
    name: roleName,
    service: 'apigateway.amazonaws.com'
  }

  const iamComponent = await context.load('iam', 'iam')
  const outputs = await iamComponent.deploy(iamInputs)
  outputs.name = roleName
  return outputs
}

async function deployGithubWebhook(inputs, context) {
  const repo = parseGithubRepo(inputs.githubRepo)

  const ghInputs = {
    token: inputs.githubApiToken,
    owner: repo.owner,
    repo: repo.name,
    url: 'http://lol.com',
    events: inputs.webhookTriggers
  }

  const githubWebhookComponent = await context.load('github-webhook', 'ghwebhook')
  const outputs = await githubWebhookComponent.deploy(ghInputs)

  return outputs
}

async function deployApiGateway(inputs, context) {
  //* // eslint-disable-line
  const apiInputs = {
    name: inputs.name,
    roleArn: inputs.roleArn,
    routes: {
      '/github/webhook': {
        post: {
          lambdaArn: inputs.handler.arn
        }
      }
    }
  }
  /**/

  const apiGatewayComponent = await context.load('apigateway', 'apig')
  const outputs = await apiGatewayComponent.deploy(apiInputs)
  outputs.name = inputs.name
  return outputs
}

async function removeIamRole(inputs, context) {
  const iamComponent = await context.load('iam', 'iam')
  return iamComponent.remove(inputs)
}

async function removeApiGateway(inputs, context) {
  const apiGatewayComponent = await context.load('apigateway', 'apig')
  return apiGatewayComponent.remove(inputs)
}

async function removeGithubWebhook(inputs, context) {
  const apiGatewayComponent = await context.load('github-webhook', 'ghwebhook')
  return apiGatewayComponent.remove(inputs)
}

// "public" functions
async function deploy(inputs, context) {
  const outputs = {}
  outputs.iam = await deployIamRole(inputs, context)
  outputs.apigateway = await deployApiGateway(
    {
      ...inputs,
      roleArn: outputs.iam.arn // TODO: add functionality to read from state so that update works
    },
    context
  )
  const ghOutputs = await deployGithubWebhook(inputs)
  console.log('ghOutputs', ghOutputs)
  return outputs
}

async function remove(inputs, context) {
  await removeIamRole(inputs, context)
  await removeApiGateway(inputs, context)
  await removeGithubWebhook(inputs, context)
  return {}
}

module.exports = {
  deploy,
  remove
}
