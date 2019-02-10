const path = require('path')
const dotenv = require('dotenv')
const { isEmpty } = require('ramda')

const getCredentials = (stage = 'dev') => {
  let envFile = `.env`

  if (stage !== 'dev') {
    envFile = `.env.${stage}`
  }

  let result = dotenv.config({ path: path.resolve(process.cwd(), envFile) })

  if (stage !== 'dev' && result.error) {
    throw Error(`env file "${envFile}" not found`)
  }

  // it's helpful in dev to use the env files that already
  // exist in process.env even if no .env file found
  if (stage === 'dev' && (result.error || isEmpty(result.parsed))) {
    result = {
      parsed: {
        AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
        AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY
      }
    }
  }

  return {
    aws: {
      accessKeyId: result.parsed.AWS_ACCESS_KEY_ID,
      secretAccessKey: result.parsed.AWS_SECRET_ACCESS_KEY
    },
    gcf: {} // todo, we gotta decide on the env var keys for each provider
  }
}

module.exports = getCredentials
