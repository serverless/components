const octokit = require('@octokit/rest')()

const createWebhook = async ({
  token, owner, repo, url, event
}) => {
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
    events: [ event ],
    active: true
  }

  const res = await octokit.repos.createHook(params)

  return {
    id: res.data.id
  }
}

const updateWebhook = async ({
  token, owner, repo, url, event
}, id) => {
  octokit.authenticate({
    type: 'token',
    token
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
    events: [ event ],
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

  return {
    id: null
  }
}

const remove = async (inputs, context) => {
  context.log('Removing Github Webhook')
  const outputs = await deleteWebhook(context.state, context.state.id)
  context.saveState({ ...inputs, ...outputs })
  return outputs
}

const deploy = async (inputs, context) => {
  const noChanges = (inputs.token === context.state.token && inputs.owner === context.state.owner &&
    inputs.repo === context.state.repo && inputs.url === context.state.url &&
    inputs.event === context.state.event)
  let outputs
  if (noChanges) {
    outputs = { id: context.state.id }
  } else if (!context.state.id) {
    context.log('Creating Github Webhook')
    outputs = await createWebhook(inputs)
  } else if (context.state.id && inputs.token && inputs.owner
    && inputs.repo && inputs.url && inputs.event) {
    context.log('Updating Github Webhook')
    outputs = await updateWebhook(inputs, context.state.id)
  } else {
    context.log('Removing Github Webhook')
    outputs = await deleteWebhook(context.state, context.state.id)
  }
  context.saveState({ ...inputs, ...outputs })
  return outputs
}

module.exports = {
  deploy,
  remove
}
