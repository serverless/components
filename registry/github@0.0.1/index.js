const octokit = require('@octokit/rest')()

const create = async ({token, owner, repo, url, event}) => {
  octokit.authenticate({
    type: 'token',
    token: token
  })

  const params = {
    name: 'web',
    owner,
    repo,
    config: {url},
    events: [event],
    active: true
  }

  const res = await octokit.repos.createHook(params)

  return { webhookId: res.id }
}

const update = async ({token, owner, repo, url, event}, id) => {
  octokit.authenticate({
    type: 'token',
    token: token
  })

  const params = {
    name: 'web',
    id,
    owner,
    repo,
    config: {url},
    events: [event],
    active: true
  }

  await octokit.repos.editHook(params)

  return { webhookId: id }
}

const remove = async ({token, owner, repo}, id) => {
  octokit.authenticate({
    type: 'token',
    token: token
  })

  await octokit.repos.deleteHook({owner, repo, id})

  return { webhookId: null }
}

module.exports = async (config, state) => {
  let outputs
  if (!config.token && !state.token) {
    console.log('Skipping Github: no token provided')
  } else if (!state.webhookId) {
    console.log('Creating Github Webhook')
    outputs = await create(config)
  } else if (state.webhookId && config.token && config.owner && config.repo && config.url && config.event) {
    console.log('Updating Github Webhook')
    outputs = await update(config, state.webhookId)
  } else {
    console.log('Removing Github Webhook:')
    outputs = await remove(config, state.webhookid)
  }
  console.log('Done')
  return outputs
}
