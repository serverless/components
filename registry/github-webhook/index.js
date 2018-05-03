const parseGithubUrl = require('parse-github-url')
const {
  createWebhook,
  updateWebhook,
  deleteWebhook,
  getWebhook
} = require('./github')

const commands = {
  info: {
    command: 'info',
    description: 'Get info about github webhook',
    handler: (inputs, state, options) => {
      if (!webhookExists(state)) {
        getWebhook({
          githubRepo: state.githubRepo,
          webhookId: state.github.id,
          githubApiToken: state.githubApiToken
        }).then((data) => {
          // if --json set it will output raw json
          if (options.json) {
            console.log(JSON.stringify(data.data)) // eslint-disable-line
            return
          }
          // Default console.log nice output
          console.log('Github webhook info:') // eslint-disable-line
          Object.keys(data.data).forEach((key) => {
            const values = data.data[key]
            console.log(`   ${key}: ${JSON.stringify(values)}`) // eslint-disable-line
          })
        }).catch((e) => {
          throw e
        })
      } else {
        console.log('No webhook exists yet. Please deploy')
      }
    },
    options: {
      json: {
        description: 'Output raw json string',
        shortcut: 'j'
      }
    }
  }
}

const Create = async (inputs, context) => {
  const githubData = parseGithubUrl(inputs.githubRepo)
  const creationOutputs = await createWebhook(inputs)
  context.log(`${context.type}: ○ Creating Github Webhook for "${githubData.repo}" repo`)

  context.log(`${context.type}: ✓ Created Github Webhook for "${githubData.repo}" repo`)
  context.log(`See hook in https://github.com/${githubData.repo}/settings/hooks`)

  // return outputs for core to save
  const creationOutputsData = {
    github: creationOutputs
  }
  return { ...inputs, ...creationOutputsData }
}

const Update = async (inputs, context) => {
  // Same repo, update the existing hook
  const githubData = parseGithubUrl(inputs.githubRepo)
  const updateOutputs = await updateWebhook(inputs, context.state.github.id)

  context.log(`${context.type}: ✓ Updated Github Webhook in "${githubData.repo}" repo`)
  context.log(`   See hook in https://github.com/${githubData.repo}/settings/hooks`)

  const updateOutputsData = {
    github: updateOutputs
  }
  // return outputs for core to save
  return { ...inputs, ...updateOutputsData }
}

const Delete = async (inputs, context) => {
  const githubData = parseGithubUrl(context.state.githubRepo)
  // TODO repo is gone from state so this fails. Handle at core?
  context.log(`${context.type}: ◌ Removing Github Webhook from repo "${githubData.repo}"`)
  if (!webhookExists(context)) {
    context.log('webhook not found')
    // No webhook id found. Bail
    return { ...context.state }
  }
  const outputs = await deleteWebhook(context.state, context.state.github.id)
  context.log(`${context.type}: ✓ Removed Github Webhook from repo "${githubData.repo}"`)
  // return outputs for core to save
  return outputs
}

function webhookExists(context) {
  return context.state && context.state.github && context.state.github.id
}

module.exports = {
  commands,
  Create,
  Update,
  Delete,
  myCustomFunctionToDoStuff: (inputs, state, opts) => {
    console.log('run the function hehehe')
  }
}
