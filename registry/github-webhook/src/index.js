const octokit = require('@octokit/rest')()
const R = require('ramda')
const parseGithubUrl = require('parse-github-url')
const diffValues = require('./diff')

const createWebhook = async ({ githubApiToken, githubRepo, payloadUrl, events }) => {
  octokit.authenticate({
    type: 'token',
    token: githubApiToken
  })

  const gh = parseGithubUrl(githubRepo)

  const params = {
    name: 'web',
    owner: gh.owner,
    repo: gh.name,
    config: {
      url: payloadUrl,
      content_type: 'json'
    },
    events: events,
    active: true
  }

  const res = await octokit.repos.createHook(params)

  return res.data
}

const updateWebhook = async ({ githubApiToken, githubRepo, payloadUrl, events }, id) => {
  octokit.authenticate({
    type: 'token',
    token: githubApiToken
  })

  const gh = parseGithubUrl(githubRepo)

  const params = {
    name: 'web',
    id: id,
    owner: gh.owner,
    repo: gh.name,
    config: {
      url: payloadUrl,
      content_type: 'json'
    },
    events: events,
    active: true
  }

  const res = await octokit.repos.editHook(params)

  return res.data
}

const deleteWebhook = async ({ githubApiToken, githubRepo }, id) => {
  octokit.authenticate({
    type: 'token',
    token: githubApiToken || process.env.GITHUB_TOKEN
  })

  const gh = parseGithubUrl(githubRepo)

  await octokit.repos.deleteHook({
    owner: gh.owner,
    repo: gh.name,
    id: id
  })

  return {}
}

const deploy = async (inputs, context) => {
  // Util method for checking if state key values have changed
  const componentData = compareInputsToState(inputs, context.state)
  const inputsChanged = !componentData.isEqual
  const defaultOutputs = { ...inputs, ...context.state }
  const githubData = parseGithubUrl(inputs.githubRepo)

  /* No state found, run create flow */
  if (!componentData.hasState) {
    context.log(`${context.type}: ○ Creating Github Webhook for "${githubData.repo}" repo`)
    const creationOutputs = await createWebhook(inputs)
    const creationOutputsData = {
      github: creationOutputs
    }
    context.log(`${context.type}: ✓ Created Github Webhook for "${githubData.repo}" repo`)
    context.log(`See hook in https://github.com/${githubData.repo}/settings/hooks`)
    // Save state
    const createState = { ...inputs, ...creationOutputsData }
    context.saveState(createState)
    return createState
  }

  /* Has state, run update flow if inputsChanged */
  if (inputsChanged) {
    context.log(`${context.type}: ○ Updating Github Webhook for "${githubData.repo}"\n`)

    // Log out diffs
    componentData.keys.forEach((item) => {
      const newInput = componentData.diffs[item].inputs
      const currentState = componentData.diffs[item].state
      const diff = diffValues(newInput, currentState)
      if (diff) {
        context.log(`${context.type}: Property "${item}" changed`)
        context.log(`${diff}\n`)
        //  from '${currentState}' to '${newInput}'
      }
    })

    // Need to bail if state doesn't have what we need
    if (!webhookExists(context)) {
      // No webhook id found. Bail
      return defaultOutputs
    }

    // If repo url has changed. Delete old webhook and make a new one in new repo
    if (componentData.keys.includes('githubRepo')) {
      // First delete old webhook
      const oldGithubData = parseGithubUrl(context.state.githubRepo)
      context.log(`${context.type}: Delete old webhook in "${oldGithubData.repo}" repo`)
      await deleteWebhook(context.state, context.state.github.id)
      // Then create new webhook at new repo
      context.log(`${context.type}: ○ Creating Github Webhook for "${githubData.repo}" repo`)
      const creationOutputs = await createWebhook(inputs)
      const creationOutputsData = {
        github: creationOutputs
      }
      context.log(`${context.type}: ✓ Created Github Webhook for "${githubData.repo}" repo`)
      context.log(`   See hook in https://github.com/${githubData.repo}/settings/hooks`)
      // Save state
      const createState = { ...inputs, ...creationOutputsData }
      context.saveState(createState)
      return createState
    }

    // Same repo, update the existing hook
    const updateOutputs = await updateWebhook(inputs, context.state.github.id)
    const updateOutputsData = {
      github: updateOutputs
    }
    context.log(`${context.type}: ✓ Updated Github Webhook in "${githubData.repo}" repo`)
    context.log(`   See hook in https://github.com/${githubData.repo}/settings/hooks`)
    // Save state
    const updateState = { ...inputs, ...updateOutputsData }
    context.saveState(updateState)
    return updateState
  }

  // No Op. Return default
  return defaultOutputs
}

const remove = async (inputs, context) => {
  const defaultOutputs = { ...inputs, ...context.state }
  const githubData = parseGithubUrl(inputs.githubRepo)
  context.log(`${context.type}: ◌ Removing Github Webhook from repo "${githubData.repo}"`)
  if (!webhookExists(context)) {
    // No webhook id found. Bail
    return defaultOutputs
  }
  const outputs = await deleteWebhook(context.state, context.state.github.id)
  context.log(`${context.type}: ✓ Removed Github Webhook from repo "${githubData.repo}"`)
  context.saveState()
  return outputs
}

function webhookExists(context) {
  return context.state && context.state.github && context.state.github.id
}

// Util method to compare state values to inputs
function compareInputsToState(inputs, state) {
  const hasState = !!Object.keys(state).length
  const initialData = {
    // If no state keys... no state
    hasState: hasState,
    // default everything is equal
    isEqual: true,
    // Keys that are different
    keys: [],
    // Values of the keys that are different
    diffs: {}
  }
  return Object.keys(inputs).reduce((acc, current) => {
    // if values not deep equal. There are changes
    if (!R.equals(inputs[current], state[current])) {
      return {
        hasState: hasState,
        isEqual: false,
        keys: acc.keys.concat(current),
        diffs: {
          ...acc.diffs,
          ...{
            [`${current}`]: {
              inputs: inputs[current],
              state: state[current]
            }
          }
        }
      }
    }
    return acc
  }, initialData)
}

module.exports = {
  deploy,
  remove
}
