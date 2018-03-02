/* eslint-disable no-console,comma-dangle */
const fetch = require('node-fetch')
const parseGithubUrl = require('parse-github-url')

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
      Authorization: `Bearer ${apiToken}` // eslint-disable-line
    },
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
    },
  })
  console.log(response)
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
    },
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
    },
  })
  return await response.json() // eslint-disable-line
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
    },
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
    },
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
    },
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
      events: [ 'delete', 'push', 'pull_request' ],
      config: {
        url: 'https://api.netlify.com/hooks/github',
        content_type: 'json'
      }
    }),
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${githubApiToken}`
    },
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
    },
  })
  return response
}

/* Deploy logic */
const deploy = async (inputs) => {
  console.log('Deploying netlify site:')

  const { netlifyApiToken, githubApiToken } = inputs

  const siteInputs = inputs.siteSettings

  if (!siteInputs.repo || !siteInputs.repo.url) {
    throw new Error('Need repo url')
  }

  if (!netlifyApiToken) {
    throw new Error('No netlifyApiToken found')
  }

  if (!githubApiToken) {
    throw new Error('No githubApiToken found')
  }

  const githubData = parseGithubUrl(siteInputs.repo.url)

  /* 1. Create netlify deploy key `createNetlifyDeployKey` */
  const netlifyDeployKey = await createNetlifyDeployKey({}, netlifyApiToken)
  // console.log('netlifyDeployKey data', netlifyDeployKey)

  /* 2. Then add key to github repo https://api.github.com/repos/owner/repoName/keys */
  const githubDeployKey = await addGithubDeployKey({
    repo: githubData.repo,
    key: netlifyDeployKey.public_key,
    githubApiToken: githubApiToken // eslint-disable-line
  })
  // console.log('githubDeployKey data', githubDeployKey)

  /* 3. Then createNetlifySite with https://api.netlify.com/api/v1/sites */
  let siteConfig = { // eslint-disable-line
    name: siteInputs.name,
  }

  if (siteInputs.customDomain) {
    siteConfig.custom_domain = siteInputs.customDomain
  }

  if (siteInputs.forceSsl) {
    // siteConfig.force_ssl = siteInputs.forceSsl
  }

  const branch = siteInputs.repo.branch || 'master'
  const allowedBranches = siteInputs.repo.allowedBranchs || [ branch ]

  // Set repo configuration
  siteConfig.repo = {
    deploy_key_id: netlifyDeployKey.id,
    provider: 'github',
    public_repo: false,
    repo_branch: branch,
    repo_path: githubData.repo,
    repo_type: 'git',
    repo_url: siteInputs.repo.url,
    allowed_branches: allowedBranches
  }

  // Set build command
  if (siteInputs.repo.buildCommand) {
    siteConfig.repo.cmd = siteInputs.repo.buildCommand
  }

  // Set build output directory
  if (siteInputs.repo.buildDirectory) {
    siteConfig.repo.dir = siteInputs.repo.buildDirectory
  }

  const netlifySite = await createNetlifySite(siteConfig, netlifyApiToken)
  // console.log('netlifySite data', netlifySite)

  /* 4. Then add github webhook to repo. https://api.github.com/repos/DavidTron5000/responsible/hooks */
  const githubWebhookConfig = {
    repo: githubData.repo
  }
  const githubWebhook = await addGithubWebhook(githubWebhookConfig, githubApiToken)
  // console.log('githubWebhook data', githubWebhook)

  /* 5. Then make netlify https://api.netlify.com/api/v1/hooks call */
  const netlifyDeployCreatedWebhook = await createNetlifyWebhook({
    site_id: netlifySite.site_id,
    type: 'github_commit_status',
    event: 'deploy_created',
    data: {
      access_token: githubApiToken
    }
  }, netlifyApiToken)
  // console.log('netlifyDeployCreatedWebhook data', netlifyDeployCreatedWebhook)

  /* 6. Then make another netlify https://api.netlify.com/api/v1/hooks call */
  const netlifyDeployFailedWebhook = await createNetlifyWebhook({
    site_id: netlifySite.site_id,
    type: 'github_commit_status',
    event: 'deploy_failed',
    data: {
      access_token: githubApiToken
    }
  }, netlifyApiToken)

  /* 7. Then make another netlify https://api.netlify.com/api/v1/hooks call */
  const netlifyDeployBuildingWebhook = await createNetlifyWebhook({
    site_id: netlifySite.site_id,
    type: 'github_commit_status',
    event: 'deploy_failed',
    data: {
      access_token: githubApiToken
    }
  }, netlifyApiToken)

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

  return outputs
}

const remove = async (inputs, options) => {
  console.log('Removing netlify site:')

  const { netlifyApiToken, githubApiToken } = inputs
  const siteInputs = inputs.siteSettings
  const githubData = parseGithubUrl(siteInputs.repo.url)

  if (!options || !Object.keys(options).length) {
    throw new Error('No state data found')
  }

  /* Clean up netlify DeployCreated webhook */
  await deleteNetlifyWebhook(
    options.netlifyDeployCreatedWebhook.id,
    netlifyApiToken
  )
  // console.log('deleteNetlifyDeployCreatedWebhook data', deleteNetlifyDeployCreatedWebhook)

  /* Clean up netlify DeployFailed webhook */
  await deleteNetlifyWebhook(
    options.netlifyDeployFailedWebhook.id,
    netlifyApiToken
  )

  /* Clean up netlify DeployBuilding webhook */
  await deleteNetlifyWebhook(
    options.netlifyDeployBuildingWebhook.id,
    netlifyApiToken
  )

  /* Clean up github webhook */
  await deleteGithubWebhook({
    repo: githubData.repo,
    hookId: options.githubWebhookData.id
  }, githubApiToken)

  /* Remove netlify Site */
  await deleteNetlifySite(options.netlifySiteData.site_id, netlifyApiToken)

  /* Clean up github deploy keys */
  await deleteGithubDeployKey({
    repo: githubData.repo,
    id: options.githubDeployKeyData.id
  }, githubApiToken)

  /* Clean up netlify deploy keys */
  await deleteNetlifyDeployKey(options.netlifyDeployKeyData.id, netlifyApiToken)

  // return new outputs?
  const outputs = {}
  return outputs
}

module.exports = {
  deploy,
  remove
}
