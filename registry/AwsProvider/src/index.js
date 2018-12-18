import { all, isEmpty, resolve } from '@serverless/utils'
import AWS from 'aws-sdk'

const AwsProvider = {
  getSdk() {
    this.validate()
    // TODO BRN: This won't work for multi provider/region
    AWS.config.update({
      region: resolve(this.region),
      credentials: all(this.credentials)
    })
    return AWS
  },

  getCredentials() {
    this.validate()
    return {
      region: resolve(this.region),
      credentials: all(this.credentials)
    }
  },

  validate() {
    const region = resolve(this.region) || process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION
    const envCredSet = process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY

    if (!/.+-.+.\d+/.test(region)) {
      throw new Error(`Invalid region "${region}" in your AWS provider setup`)
    }

    if ((!resolve(this.credentials) || isEmpty(this.credentials)) && !envCredSet) {
      throw new Error(`Credentials not set in your AWS provider setup`)
    }
  },

  async getAccountId() {
    const Aws = this.getSdk()
    const STS = new Aws.STS()
    const res = await STS.getCallerIdentity({}).promise()
    return res.Account
  }
}

export default AwsProvider
