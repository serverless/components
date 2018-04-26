const parseGithubUrl = require('parse-github-url')
const { createWebhook, updateWebhook, deleteWebhook } = require('./github')

const Create = async (inputs, context) => {
  const githubData = parseGithubUrl(inputs.githubRepo)
  context.log(`${context.type}: ○ Creating Github Webhook for "${githubData.repo}" repo`)
  const creationOutputs = await createWebhook(inputs)
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
  const updateOutputsData = {
    github: updateOutputs
  }
  context.log(`${context.type}: ✓ Updated Github Webhook in "${githubData.repo}" repo`)
  context.log(`   See hook in https://github.com/${githubData.repo}/settings/hooks`)
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
  Create,
  Update,
  Delete
}
