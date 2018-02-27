const octokit = require('@octokit/rest')()

const createWebhook = async ({token, owner, repo, url, event}) => {
  octokit.authenticate({
    type: 'token',
    token: token || process.env.GITHUB_TOKEN
  })

  const params = {
    name: 'web',
    owner,
    repo,
    config: {
      url,
      content_type: 'json'
    },
    events: [event],
    active: true
  }

  const res = await octokit.repos.createHook(params)

  return {
    id: res.data.id
  }
}

const updateWebhook = async ({token, owner, repo, url, event}, id) => {
  octokit.authenticate({
    type: 'token',
    token: token
  })

  const params = {
    name: 'web',
    id,
    owner,
    repo,
    config: {
      url,
      content_type: 'json'
    },
    events: [event],
    active: true
  }

  const res = await octokit.repos.editHook(params)

  return {
    id: res.data.id
  }
}

const deleteWebhook = async ({token, owner, repo}, id) => {
  octokit.authenticate({
    type: 'token',
    token: token || process.env.GITHUB_TOKEN
  })

  await octokit.repos.deleteHook({owner, repo, id})

  return {
    id: null
  }
}

const remove = async (inputs, options, state, context) => {
  context.log('Removing Github Webhook')
  const outputs = await deleteWebhook(state, state.id)
  return outputs
}

const deploy = async (inputs, options, state, context) => {
  const noChanges = (inputs.token === state.token && inputs.owner === state.owner &&
    inputs.repo === state.repo && inputs.url === state.url && inputs.event === state.event)
  let outputs
  if (noChanges) {
    outputs = { id: state.id }
  } else if (!state.id) {
    context.log('Creating Github Webhook')
    outputs = await createWebhook(inputs)
  } else if (state.id && inputs.token && inputs.owner && inputs.repo && inputs.url && inputs.event) {
    context.log('Updating Github Webhook')
    outputs = await updateWebhook(inputs, state.id)
  } else {
    context.log('Removing Github Webhook')
    outputs = await deleteWebhook(state, state.id)
  }
  return outputs
}

module.exports = {
  deploy,
  remove
}
