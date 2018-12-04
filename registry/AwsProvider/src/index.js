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
    if (!/.+-.+.\d+/.test(resolve(this.region))) {
      throw new Error(`Invalid region "${this.region}" in your AWS provider setup`)
    }

    if (!resolve(this.credentials) || isEmpty(this.credentials)) {
      throw new Error(`Credentials not set in your AWS provider setup`)
    }
  }
}

export default AwsProvider
