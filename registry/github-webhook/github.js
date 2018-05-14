/* eslint-disable no-console */
const octokit = require('@octokit/rest')()
const R = require('ramda')
const parseGithubUrl = require('parse-github-url')

const permissionsError = `Make sure you have repo and write:repo_hook, read:repo_hook privilegdes set` // eslint-disable-line

const getWebhook = function ({ githubRepo, webhookId, githubApiToken }) {
  const gh = parseGithubUrl(githubRepo)

  octokit.authenticate({
    type: 'token',
    token: githubApiToken
  })

  return octokit.repos.getHook({
    owner: gh.owner,
    repo: gh.name,
    id: webhookId
  })
}

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

  let hookData
  try {
    const res = await octokit.repos.createHook(params)
    hookData = res.data
  } catch (e) {
    console.log(`Handle github error ${e.code}`) // eslint-disable-line
    // already exists. Handle idempotence
    if (e.code === 422) {
      // Get hooks.
      const hooks = await octokit.repos.getHooks({
        owner: gh.owner,
        repo: gh.name,
        page: 1 // Must be updated to handle recursive lookups
      })

      if (hooks.data) {
        const match = hooks.data.filter((h) => { // eslint-disable-line
          const urlMatch = (h.config.url === payloadUrl)
          const eventsMatch = R.equals(h.events, events)
          return urlMatch && eventsMatch
        })
        if (match && match.length) {
          hookData = match[0]
        }
      }
    }

    if (e.code === 404) {
      console.log(`You have incorrect token permissions. ${permissionsError}`)
      throw e
    }
    // handle other errors here
  }

  return hookData
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
  let hookData
  try {
    const res = await octokit.repos.editHook(params)
    hookData = res.data
  } catch (e) {
    // If API errors
    if (e.code === 404) {
      console.log(`You have incorrect token permissions. ${permissionsError}`)
      throw e
    }
  }

  return hookData
}

const deleteWebhook = async ({ githubApiToken, githubRepo }, id) => {
  octokit.authenticate({
    type: 'token',
    token: githubApiToken
  })

  const gh = parseGithubUrl(githubRepo)

  try {
    await octokit.repos.deleteHook({
      owner: gh.owner,
      repo: gh.name,
      id: id
    })
  } catch (e) {
    // If API errors
    if (e.code === 404) {
      console.log(`You have incorrect token permissions. ${permissionsError}`)
      throw e
    }
  }

  return {}
}

module.exports = {
  createWebhook,
  deleteWebhook,
  updateWebhook,
  getWebhook
}
