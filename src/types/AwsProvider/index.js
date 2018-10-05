import AWS from 'aws-sdk'

const AwsProvider = {
  construct(inputs) {
    AWS.config.update(inputs)
    this.sdk = AWS
  },
  getSdk() {
    return this.sdk
  },
  getCredentials() {
    return { region: this.region, credentials: this.credentials }
  }
}

export default AwsProvider
