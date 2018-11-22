import { isEmpty } from '@serverless/utils'
import AWS from 'aws-sdk'

const AwsProvider = (SuperClass) =>
  class extends SuperClass {
    async construct(inputs, context) {
      await super.construct(inputs, context)

      // NOTE: we cannot use `resolvable` or `resolve` here since AwsProvider doesn't extend Component
      this.region = inputs.region || 'us-east-1'
      this.credentials = inputs.credentials
    }

    getSdk() {
      this.validate()
      // TODO BRN: This won't work for multi provider/region
      AWS.config.update({ region: this.region, credentials: this.credentials })
      return AWS
    }

    getCredentials() {
      this.validate()
      return { region: this.region, credentials: this.credentials }
    }

    validate() {
      if (!/.+-.+.\d+/.test(this.region)) {
        throw new Error(`Invalid region "${this.region}" in your AWS provider setup`)
      }

      if (!this.credentials || isEmpty(this.credentials)) {
        throw new Error(`Credentials not set in your AWS provider setup`)
      }
    }
  }

export default AwsProvider
