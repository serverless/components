const octokit = require('@octokit/rest')()

const create = async ({token, owner, repo, url, event}) => {
  octokit.authenticate({
    type: 'token',
    token: token || process.env.GITHUB_TOKEN
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
    token: token || process.env.GITHUB_TOKEN
  })

  await octokit.repos.deleteHook({owner, repo, id})

  return {
    id: null
  }
}

module.exports = async (inputs, state) => {
  const noChanges = (inputs.token === state.token && inputs.owner === state.owner &&
    inputs.repo === state.repo && inputs.url === state.url && inputs.event === state.event)
  let outputs
  if (noChanges) {
    outputs = { id: state.id }
  } else if (!state.id) {
    console.log('Creating Github Webhook')
    outputs = await create(inputs)
  } else if (state.id && inputs.token && inputs.owner && inputs.repo && inputs.url && inputs.event) {
    console.log('Updating Github Webhook')
    outputs = await update(inputs, state.id)
  } else {
    console.log('Removing Github Webhook')
    outputs = await remove(state, state.id)
  }
  return outputs
}
