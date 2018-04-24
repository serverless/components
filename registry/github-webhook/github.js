const octokit = require('@octokit/rest')()
const parseGithubUrl = require('parse-github-url')

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
    token: githubApiToken
  })

  const gh = parseGithubUrl(githubRepo)

  await octokit.repos.deleteHook({
    owner: gh.owner,
    repo: gh.name,
    id: id
  })

  return {}
}

module.exports = {
  createWebhook,
  deleteWebhook,
  updateWebhook
}
