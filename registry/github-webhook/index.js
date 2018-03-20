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

  return {
    id: res.data.id
  }
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

  return {
    id: res.data.id
  }
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
  const data = compareInputsToState(inputs, context.state) // eslint-disable-line
  const inputsChanged = !data.isEqual

  // No state or id found, create webhook
  if (!data.hasState || !context.state.id) {
    context.log('Creating Github Webhook')
    const creationOutputs = await createWebhook(inputs)
    context.log('Finished Creating Github Webhook')
    // Save state
    context.saveState({ ...inputs, ...creationOutputs })
    return creationOutputs
  }

  // id found, update webhook
  if (inputsChanged) {
    context.log('Updating Github Webhook')

    data.keys.forEach((item) => {
      const newInput = data.diffs[item].inputs
      const currentState = data.diffs[item].state
      context.log(`\n${item} changed from '${currentState}' to '${newInput}'`)
      const diff = diffValues(newInput, currentState)
      if (diff) {
        console.log(diff)
      }
    })

    const updateOutputs = await updateWebhook(inputs, context.state.id)
    context.log('Finished Updating Github Webhook')

    // Save state
    context.saveState({ ...inputs, ...updateOutputs })
    return updateOutputs
  }

  // return everything?
  return {
    id: context.state.id
  }
}

const remove = async (inputs, context) => {
  context.log('Removing Github Webhook')
  const outputs = await deleteWebhook(context.state, context.state.id)
  context.log('Finished Removing Github Webhook')
  context.saveState()
  return outputs
}

function compareInputsToState(inputs, state) {
  const hasState = !!Object.keys(state).length
  const initialData = {
    hasState: hasState,
    isEqual: true,
    keys: [],
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
