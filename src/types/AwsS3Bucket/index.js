const AwsS3Bucket = {
  async deploy() {
    const provider = this.provider
    // TODO: add deployment logic here
    this.arn = await deploy()
  },

  async updateS3Config({ event, filter, function: func }) {
    await this.deploy({ event, filter, function: func })
  },

  async deploySource(subscription) {
    const config = subscription.getConfig()
    const sinkConfig = subscription.getSinkConfig()

    if (sinkConfig.protocol === 'AwsLambdaFunction') {
      await this.updateS3Configuration({
        event: config.event,
        filter: config.filter,
        function: sinkConfig.uri // the Lambda arn
      })
    } else if (sinkConfig.protocol === 'AwsSNSTopic') {
      await this.updateS3Configuration({
        event: config.event,
        filter: config.filter,
        topic: sinkConfig.uri // the SNS Topic arn
      })
    }
  },

  getSourceConfig() {
    return {
      uri: this.arn
    }
  }
}

export default AwsS3Bucket
