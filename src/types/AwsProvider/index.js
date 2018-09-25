import AWS from 'aws-sdk'

const AwsProvider = {
  construct(inputs) {
    AWS.config.update(inputs)
    this.sdk = AWS
  }
}

export default AwsProvider
