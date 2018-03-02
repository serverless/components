/* eslint-disable */
const fetch = require('node-fetch')
const parseGithubUrl = require('parse-github-url')

async function createNetlifyDeployKey(config, apiToken) {
  const url = `https://api.netlify.com/api/v1/deploy_keys/`
  const response = await fetch(url, {
    method: 'POST',
    body: JSON.stringify(config),
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiToken}`
    },
  })
  return await response.json()
}

async function deleteNetlifyDeployKey(id) {
  const url = `https://api.netlify.com/api/v1/deploy_keys/${id}`
  const response = await fetch(url, {
    method: 'DELETE',
    body: JSON.stringify({
      key_id: id
    }),
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiToken}`
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
  const url = `https://api.netlify.com/api/v1/sites/`
  const response = await fetch(url, {
    method: 'POST',
    body: JSON.stringify(config),
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiToken}`
    },
  })
  return await response.json()
}

async function deleteNetlifySite(id, apiToken) {
  const url = `https://api.netlify.com/api/v1/sites/${id}`
  const response = await fetch(url, {
    method: 'DELETE',
    body: JSON.stringify({
      site_id: id
    }),
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiToken}`
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
  const url = `https://api.netlify.com/api/v1/hooks`
  const response = await fetch(url, {
    method: 'POST',
    body: JSON.stringify(config),
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${netlifyApiToken}`
    },
  })
  return await response.json()
}

async function addGithubDeployKey(config) {
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
      'Authorization': `Bearer ${config.githubApiToken}`
    },
  })
  return await response.json()
}

async function addGithubWebhooks(githubApiToken) {
  const url = `https://api.github.com/repos/${config.repo}/hooks`
  const response = await fetch(url, {
    method: 'POST',
    body: JSON.stringify({
      "name": "web",
      "active": true,
      "events": ['delete', 'push', 'pull_request'],
      'config': {
        'url': 'https://api.netlify.com/hooks/github',
        'content_type':'json'
      }
    }),
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${githubApiToken}`
    },
  })
  return await response.json()
}


/* Deploy logic */
const deploy = async (inputs, options, state, context) => {
  console.log(`Deploying site:`)

  const netlifyApiToken = inputs.netlifyApiToken
  const githubApiToken = inputs.githubApiToken
  const siteInputs = inputs.siteSettings

  if (!siteInputs.repo || !siteInputs.repo.url) {
    throw new Error('Need repo url')
  }

  const githubData = parseGithubUrl(siteInputs.repo.url)

  // 1. Create netlify deploy key `createNetlifyDeployKey`
  const netlifyDeployKey = await createNetlifyDeployKey({}, netlifyApiToken)

  // 2. Then add key to github repo https://api.github.com/repos/DavidTron5000/responsible/keys
  const githubDeployKey = await addGithubDeployKey({
    repo: githubData.repo,
    key: netlifyDeployKey.public_key,
    githubApiToken: githubApiToken
  })
  // make output -> ghDeployKey.response.redirectURL

  // 3. Then createNetlifySite with https://api.netlify.com/api/v1/sites
  let siteConfig = {
    name: siteInputs.name,
  }

  if (siteInputs.customDomain) {
    siteConfig.custom_domain = siteInputs.customDomain
  }

  if (siteInputs.forceSsl) {
    siteConfig.force_ssl = siteInputs.forceSsl
  }

  const branch = siteInputs.repo.branch || 'master'
  const allowedBranches = siteInputs.repo.allowedBranchs || [branch]

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

  const netlifySite = await createNetlifySite(siteConfig)

  // 4. Then add github webhook to repo. https://api.github.com/repos/DavidTron5000/responsible/hooks
  const githubWebhook = await addGithubWebhooks(githubApiToken)

  // 5. Then make netlify https://api.netlify.com/api/v1/hooks call
  const netlifyDeployCreatedWebhook = await createNetlifyWebhook({
    "site_id": netlifySite.site_id,
    "type": "github_commit_status",
    "event": "deploy_created",
    "data": {
      "access_token": githubApiToken
    }
  }, netlifyApiToken)

  // 6. Then make another netlify https://api.netlify.com/api/v1/hooks call
  const netlifyDeployFailedWebhook = await createNetlifyWebhook({
    "site_id": netlifySite.site_id,
    "type": "github_commit_status",
    "event": "deploy_failed",
    "data": {
      "access_token": githubApiToken
    }
  }, netlifyApiToken)

  // 7. Then make another netlify https://api.netlify.com/api/v1/hooks call
  const netlifyDeployBuildingWebhook = await createNetlifyWebhook({
    "site_id": netlifySite.site_id,
    "type": "github_commit_status",
    "event": "deploy_failed",
    "data": {
      "access_token": githubApiToken
    }
  }, netlifyApiToken)

  // TODO make real outputs
  const outputs = {
    hi: 'lol'
  }

  return outputs
}

const remove = async (inputs, state, context) => {
  context.log(`Removing site:`)

  const site_id = 'd6ba547d-d977-41a7-b6fc-bf414461c1a1'

  deleteNetlifyDeployKey(deploy_key_id)
    .then((data) => {
      console.log('deploy_key_id Deleted')
    }).catch((e) => {
      console.log('error', e)
    })

  deleteNetlifySite(site_id)
    .then((res) => {
      // console.log('data', res)
      console.log('Site Deleted')
    }).catch((e) => {
      console.log('err', e)
    })

  const outputs = {}
  return outputs
}

module.exports = {
  deploy,
  remove
}
