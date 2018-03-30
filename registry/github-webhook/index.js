const octokit = require('@octokit/rest')()
const R = require('ramda')
const diffValues = require('./diff')

const createWebhook = async ({ token, owner, repo, url, events }) => { // eslint-disable-line

  octokit.authenticate({
    type: 'token',
    token: token || process.env.GITHUB_TOKEN
  })

  const params = {
    name: 'web',
    owner: owner,
    repo: repo,
    config: {
      url,
      content_type: 'json'
    },
    events: events,
    active: true
  }

  const res = await octokit.repos.createHook(params)

  return res.data
}

const updateWebhook = async ({ token, owner, repo, url, events }, id) => { // eslint-disable-line

  octokit.authenticate({
    type: 'token',
    token: token || process.env.GITHUB_TOKEN
  })

  const params = {
    name: 'web',
    id: id,
    owner: owner,
    repo: repo,
    config: {
      url: url,
      content_type: 'json'
    },
    events: events,
    active: true
  }

  const res = await octokit.repos.editHook(params)

  return res.data
}

const deleteWebhook = async ({ token, owner, repo }, id) => {
  octokit.authenticate({
    type: 'token',
    token: token || process.env.GITHUB_TOKEN
  })

  await octokit.repos.deleteHook({ owner, repo, id })

  return {}
}

const deploy = async (inputs, context) => {
  // Util method for checking if state key values have changed
  const componentData = compareInputsToState(inputs, context.state)
  const inputsChanged = !componentData.isEqual
  const defaultOutputs = { ...inputs, ...context.state }

  /* No state found, run create flow */
  if (!componentData.hasState) {
    context.log(`${context.type}: ○ Creating Github Webhook for "${getRepoSlug(inputs)}"`)
    const creationOutputs = await createWebhook(inputs)
    const creationOutputsData = {
      github: creationOutputs
    }
    context.log(`${context.type}: ✓ Created Github Webhook for "${getRepoSlug(inputs)}"`)
    context.log(`See hook in https://github.com/${inputs.owner}/${inputs.repo}/settings/hooks`)
    // Save state
    const createState = { ...inputs, ...creationOutputsData }
    context.saveState(createState)
    return createState
  }

  /* Has state, run update flow if inputsChanged */
  if (inputsChanged) {
    context.log(`${context.type}: ○ Updating Github Webhook for "${getRepoSlug(inputs)}"\n`)

    // Log out diffs
    componentData.keys.forEach((item) => {
      const newInput = componentData.diffs[item].inputs
      const currentState = componentData.diffs[item].state
      const diff = diffValues(newInput, currentState)
      if (diff) {
        context.log(`${context.type}: Property "${item}" changed from '${currentState}' to '${newInput}'`)
        context.log(`${diff}\n`)
      }
    })

    // Need to bail if state doesn't have what we need
    if (!webhookExists(context)) {
      // No webhook id found. Bail
      return defaultOutputs
    }

    // If repo url has changed. Delete old webhook and make a new one in new repo
    if (componentData.keys.includes('repo') || componentData.keys.includes('owner')) {
      // First delete old webhook
      context.log(`${context.type}: Delete old webhook "${context.state.owner}/${context.state.repo}"`)
      await deleteWebhook(context.state, context.state.github.id)
      // Then create new webhook at new repo
      context.log(`${context.type}: ○ Creating Github Webhook for "${getRepoSlug(inputs)}"`)
      const creationOutputs = await createWebhook(inputs)
      const creationOutputsData = {
        github: creationOutputs
      }
      context.log(`${context.type}: ✓ Created Github Webhook for "${getRepoSlug(inputs)}"`)
      context.log(`   See hook in https://github.com/${inputs.owner}/${inputs.repo}/settings/hooks`)
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
    context.log(`${context.type}: ✓ Updated Github Webhook in "${getRepoSlug(inputs)}"`)
    context.log(`   See hook in ${getRepoUrl(inputs)}`)
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
  context.log(`${context.type}: ◌ Removing Github Webhook from repo "${getRepoUrl(inputs)}"`)
  if (!webhookExists(context)) {
    // No webhook id found. Bail
    return defaultOutputs
  }
  const outputs = await deleteWebhook(context.state, context.state.github.id)
  context.log(`${context.type}: ✓ Removed Github Webhook from repo "${getRepoSlug(inputs)}"`)
  context.saveState()
  return outputs
}

function getRepoSlug(inputs) {
  return `${inputs.owner}/${inputs.repo}`
}

function getRepoUrl(inputs) {
  return `https://github.com/${inputs.owner}/${inputs.repo}/settings/hooks`
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
