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

  return {
    id: res.data.id
  }
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

  const res = await octokit.repos.editHook(params)

  return {
    id: res.data.id
  }
}

const remove = async ({token, owner, repo}, id) => {
  octokit.authenticate({
    type: 'token',
    token: token
  })

  await octokit.repos.deleteHook({owner, repo, id})

  return {
    id: null
  }
}

module.exports = async (config, state) => {
  let outputs
  if (!state.id) {
    console.log('Creating Github Webhook')
    outputs = await create(config)
  } else if (state.id && config.token && config.owner && config.repo && config.url && config.event) {
    console.log('Updating Github Webhook')
    outputs = await update(config, state.id)
  } else {
    console.log('Removing Github Webhook')
    outputs = await remove(config, state.id)
  }
  console.log('')
  return outputs
}
