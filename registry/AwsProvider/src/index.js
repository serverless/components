import { resolve } from '@serverless/utils'
import AWS from 'aws-sdk'

const AwsProvider = {
  getSdk() {
    // TODO BRN: This won't work for multi provider/region
    AWS.config.update({ region: resolve(this.region), credentials: resolve(this.credentials) })
    return AWS
  },
  getCredentials() {
    return { region: this.region, credentials: this.credentials }
  }
}

export default AwsProvider
