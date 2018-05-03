/* eslint-disable no-console,comma-dangle */
const fetch = require('node-fetch')
const parseGithubUrl = require('parse-github-url')
const R = require('ramda')

/* Deploy logic */
const deploy = async (inputs, context) => {
  context.log('Deploying netlify site:')

  const {
    netlifyApiToken,
    githubApiToken,
    siteName,
    siteDomain,
    siteForceSSL,
    siteRepo,
    siteBuildCommand,
    siteBuildDirectory,
    siteRepoBranch,
    siteRepoAllowedBranches,
    siteEnvVars
  } = inputs

  const componentData = compareInputsToState(inputs, context.state)
  const inputsChanged = !componentData.isEqual

  const githubData = parseGithubUrl(siteRepo)

  /* No state found, run create flow */
  if (!componentData.hasState) {
    context.log('run create')
  }

  if (inputsChanged) {
    context.log('inputsChanged. Run updates')
  }

  /* 1. Create netlify deploy key `createNetlifyDeployKey` */
  const netlifyDeployKey = await createNetlifyDeployKey({}, netlifyApiToken)

  /* 2. Then add key to github repo https://api.github.com/repos/owner/repoName/keys */
  const githubDeployKey = await addGithubDeployKey({
    repo: githubData.repo,
    key: netlifyDeployKey.public_key,
    githubApiToken: githubApiToken // eslint-disable-line
  })

  /* 3. Then createNetlifySite with https://api.netlify.com/api/v1/sites */
  const siteConfig = {
    // eslint-disable-line
    name: siteName
  }

  if (siteDomain) {
    siteConfig.custom_domain = siteDomain
  }

  if (siteForceSSL) {
    // siteConfig.force_ssl = siteForceSSL
  }

  const branch = siteRepoBranch || 'master'
  const allowedBranches = siteRepoAllowedBranches || [branch]

  // Set repo configuration
  siteConfig.repo = {
    deploy_key_id: netlifyDeployKey.id,
    provider: 'github',
    public_repo: false,
    repo_branch: branch,
    repo_path: githubData.repo,
    repo_type: 'git',
    repo_url: siteRepo,
    allowed_branches: allowedBranches
  }

  // Set build command
  if (siteBuildCommand) {
    siteConfig.repo.cmd = siteBuildCommand
  }

  // Set build output directory
  if (siteBuildDirectory) {
    siteConfig.repo.dir = siteBuildDirectory
  }

  // Set build env vars
  if (siteEnvVars) {
    siteConfig.repo.env = siteEnvVars
  }

  const netlifySite = await createNetlifySite(siteConfig, netlifyApiToken)

  /* 4. Then add github webhook to repo. https://api.github.com/repos/DavidTron5000/responsible/hooks */
  const githubWebhookConfig = {
    repo: githubData.repo
  }
  const githubWebhook = await addGithubWebhook(githubWebhookConfig, githubApiToken)

  /* 5. Then make netlify https://api.netlify.com/api/v1/hooks call */
  const netlifyDeployCreatedWebhook = await createNetlifyWebhook(
    {
      site_id: netlifySite.site_id,
      type: 'github_commit_status',
      event: 'deploy_created',
      data: {
        access_token: githubApiToken
      }
    },
    netlifyApiToken
  )

  /* 6. Then make another netlify https://api.netlify.com/api/v1/hooks call */
  const netlifyDeployFailedWebhook = await createNetlifyWebhook(
    {
      site_id: netlifySite.site_id,
      type: 'github_commit_status',
      event: 'deploy_failed',
      data: {
        access_token: githubApiToken
      }
    },
    netlifyApiToken
  )

  /* 7. Then make another netlify https://api.netlify.com/api/v1/hooks call */
  const netlifyDeployBuildingWebhook = await createNetlifyWebhook(
    {
      site_id: netlifySite.site_id,
      type: 'github_commit_status',
      event: 'deploy_failed',
      data: {
        access_token: githubApiToken
      }
    },
    netlifyApiToken
  )

  /* return all API call data */
  const outputs = {
    githubDeployKeyData: githubDeployKey,
    githubWebhookData: githubWebhook,
    netlifyDeployKeyData: netlifyDeployKey,
    netlifySiteData: netlifySite,
    netlifyDeployCreatedWebhook: netlifyDeployCreatedWebhook, // eslint-disable-line
    netlifyDeployFailedWebhook: netlifyDeployFailedWebhook, // eslint-disable-line
    netlifyDeployBuildingWebhook: netlifyDeployBuildingWebhook // eslint-disable-line
  }

  context.log(`${context.type}: ✓ Created Netlify Site`)
  // Save state
  const updateState = { ...inputs, ...outputs }
  context.saveState(updateState)

  return outputs
}

const remove = async (inputs, context) => {
  context.log('Removing netlify site:')
  const { netlifyApiToken, githubApiToken, siteRepo } = inputs
  const githubData = parseGithubUrl(siteRepo)

  const { state } = context

  if (!context || !Object.keys(state).length) {
    throw new Error('No state data found')
  }

  /* Clean up netlify DeployCreated webhook */
  if (state.netlifyDeployCreatedWebhook.id) {
    await deleteNetlifyWebhook(state.netlifyDeployCreatedWebhook.id, netlifyApiToken)
  }

  /* Clean up netlify DeployFailed webhook */
  if (state.netlifyDeployFailedWebhook.id) {
    await deleteNetlifyWebhook(state.netlifyDeployFailedWebhook.id, netlifyApiToken)
  }

  /* Clean up netlify DeployBuilding webhook */
  if (state.netlifyDeployBuildingWebhook.id) {
    await deleteNetlifyWebhook(state.netlifyDeployBuildingWebhook.id, netlifyApiToken)
  }

  /* Clean up github webhook */
  if (state.githubWebhookData.id) {
    await deleteGithubWebhook(
      {
        repo: githubData.repo,
        hookId: state.githubWebhookData.id
      },
      githubApiToken
    )
  }

  /* Remove netlify Site */
  if (state.netlifySiteData.site_id) {
    await deleteNetlifySite(state.netlifySiteData.site_id, netlifyApiToken)
  }

  /* Clean up github deploy keys */
  if (state.githubDeployKeyData.id) {
    await deleteGithubDeployKey(
      {
        repo: githubData.repo,
        id: state.githubDeployKeyData.id
      },
      githubApiToken
    )
  }

  /* Clean up netlify deploy keys */
  if (state.netlifyDeployKeyData.id) {
    await deleteNetlifyDeployKey(state.netlifyDeployKeyData.id, netlifyApiToken)
  }

  const outputs = {}
  context.saveState()
  return outputs
}

async function createNetlifyDeployKey(config, apiToken) {
  console.log('Creating netlify deploy key')
  const url = 'https://api.netlify.com/api/v1/deploy_keys/'
  const response = await fetch(url, {
    method: 'POST',
    body: JSON.stringify(config),
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiToken}`
    }
  })
  return await response.json() // eslint-disable-line
}

async function deleteNetlifyDeployKey(id, apiToken) {
  console.log('Deleting netlify deploy key')
  const url = `https://api.netlify.com/api/v1/deploy_keys/${id}`
  const response = await fetch(url, {
    method: 'DELETE',
    body: JSON.stringify({
      key_id: id
    }),
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiToken}`
    }
  })

  // response.ok
  if (response.status === 404) {
    console.log('DeployKey already deleted')
  }

  if (response.status === 204) {
    console.log('DeployKey deleted!')
  }

  return response
}

async function createNetlifySite(config, apiToken) {
  console.log('Creating netlify site')
  const url = 'https://api.netlify.com/api/v1/sites/'
  const response = await fetch(url, {
    method: 'POST',
    body: JSON.stringify(config),
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiToken}`
    }
  })
  return await response.json() // eslint-disable-line
}

async function deleteNetlifySite(id, apiToken) {
  console.log('Deleting netlify site')
  const url = `https://api.netlify.com/api/v1/sites/${id}`
  const response = await fetch(url, {
    method: 'DELETE',
    body: JSON.stringify({
      site_id: id
    }),
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiToken}`
    }
  })

  // response.ok

  if (response.status === 404) {
    console.log('Site already deleted')
  }

  if (response.status === 204) {
    console.log('Site deleted!')
  }

  return response
}

async function createNetlifyWebhook(config, netlifyApiToken) {
  console.log('Creating netlify webhook')
  const url = 'https://api.netlify.com/api/v1/hooks'
  const response = await fetch(url, {
    method: 'POST',
    body: JSON.stringify(config),
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${netlifyApiToken}`
    }
  })

  const data = await response.json()

  if (response.status === 422) {
    throw new Error(`Error in createNetlifyWebhook ${JSON.stringify(data)}`)
  }

  return data
}

async function deleteNetlifyWebhook(hookId, apiToken) {
  console.log('Deleting netlify webhook', hookId)
  const url = `https://api.netlify.com/api/v1/hooks/${hookId}`
  const response = await fetch(url, {
    method: 'DELETE',
    body: JSON.stringify({
      hook_id: hookId
    }),
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiToken}`
    }
  })

  // response.ok
  if (response.status === 404) {
    console.log('Webhook already deleted')
  }

  if (response.status === 204) {
    console.log('Deleted netlify webhook')
  }

  return response
}

async function addGithubDeployKey(config) {
  console.log('Adding netlify deploy key to github repo')
  const url = `https://api.github.com/repos/${config.repo}/keys`
  const response = await fetch(url, {
    method: 'POST',
    body: JSON.stringify({
      title: 'Netlify Deploy Key',
      key: config.key,
      read_only: true
    }),
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.githubApiToken}`
    }
  })
  return await response.json() // eslint-disable-line
}

async function deleteGithubDeployKey(config, githubApiToken) {
  console.log('Removing netlify deploy key to github repo', config.id)
  const url = `https://api.github.com/repos/${config.repo}/keys/${config.id}`
  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${githubApiToken}`
    }
  })

  if (response.status === 404) {
    console.log('GithubDeployKey already deleted')
  }

  if (response.status === 204) {
    console.log('Deleted GithubDeployKey')
  }

  return response
}

async function addGithubWebhook(config, githubApiToken) {
  console.log('Creating github webhook')
  const url = `https://api.github.com/repos/${config.repo}/hooks`
  const response = await fetch(url, {
    method: 'POST',
    body: JSON.stringify({
      name: 'web',
      active: true,
      events: ['delete', 'push', 'pull_request'],
      config: {
        url: 'https://api.netlify.com/hooks/github',
        content_type: 'json'
      }
    }),
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${githubApiToken}`
    }
  })
  return await response.json() // eslint-disable-line
}

async function deleteGithubWebhook(config, githubApiToken) {
  console.log('Deleting github webhook', config.hookId)
  const url = `https://api.github.com/repos/${config.repo}/hooks/${config.hookId}`
  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${githubApiToken}`
    }
  })
  return response
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
