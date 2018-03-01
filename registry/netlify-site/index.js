/* eslint-disable */
const fetch = require('node-fetch')

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

/* Deploy logic */
const deploy = async (inputs, state, context) => {
  context.log(`Deploying site:`)

  const netlifyApiToken = '605f3a53132a3cd12a03a4a424111cac806f551c3f51f6f21e2063617a8aebce'

  // 1. Create netlify deploy key `createNetlifyDeployKey`


  // 2. Then add key to github repo https://api.github.com/repos/DavidTron5000/responsible/keys
  /*
  {
    "mimeType": "application/json",
    "text": {
      "name": "web",
      "active": true,
      "events": ['delete', 'push', 'pull_request'],
      'config': {
        'url': 'https://api.netlify.com/hooks/github',
        'content_type':'json'
      }
    }
  }
  */

  // 3. Then createNetlifySite with https://api.netlify.com/api/v1/sites

  // 4. Then add github webhook to repo. https://api.github.com/repos/DavidTron5000/responsible/hooks
  /*
  {
    "mimeType": "application/json",
    "text": {
      "name": "web",
      "active": true,
      "events": ['delete', 'push', 'pull_request'],
      'config': {
        'url': 'https://api.netlify.com/hooks/github',
        'content_type':'json'
      }
    }
  }
  */

  // 5. Then make netlify https://api.netlify.com/api/v1/hooks call

  /*
  {
    "mimeType": "application/json",
    "text": {
      "site_id": "3e944871-7094-4b73-9248-c87d124ce19f",
      "type": "github_commit_status",
      "event": "deploy_created",
      "data": {
        "access_token": "xyz-122-github-auth-token"
      }
    }
  }
  */

  // 6. Then make another netlify https://api.netlify.com/api/v1/hooks call

  /*
  {
    "mimeType": "application/json",
    "text":  {
      site_id: "3e944871-7094-4b73-9248-c87d124ce19f\",
      type: "github_commit_status",
      event: "deploy_failed",
      data: {
        access_token: "xyz-122-github-auth-token"
      }
    }
  }
  */

  // 7. Then make another netlify https://api.netlify.com/api/v1/hooks call

  /*
  "postData": {
    "mimeType": "application/json",
    "text": {
      site_id: "3e944871-7094-4b73-9248-c87d124ce19f",
      type: "github_commit_status",
      event: "deploy_building\",
      data: {
        access_token: "xyz-122-github-auth-token"
      }
    }
  }
  */
  createNetlifyDeployKey({}, netlifyApiToken)
    .then((data) => {
      console.log('data', data)
      const deploy_key_id = data.id
      const public_key = data.public_key
      const created_at = data.created_at

      createNetlifySite({
        name: 'my-new-site-lol-xyz',
        custom_domain: 'testing-lol-lol-lol.com',
        'repo': {
          'allowed_branches': [
            'other-branch'
          ],
          //'cmd': 'string',
          'deploy_key_id': deploy_key_id,
          'dir': 'demo',
          'provider': 'github',
          'public_repo': false,
          'repo_branch': 'other-branch',
          'repo_path': 'DavidTron5000/responsible',
          'repo_type': 'git',
          'repo_url': 'https://github.com/DavidTron5000/responsible'
        }
      }).then(() => {

      })

  })

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
